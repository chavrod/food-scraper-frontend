from decimal import Decimal, ROUND_HALF_UP
from datetime import timedelta
from collections import OrderedDict

from django.views.decorators.csrf import csrf_protect
from django.middleware.csrf import get_token
from django.db.models import (
    Sum,
    F,
    Value,
    IntegerField,
    DecimalField,
    Min,
    Max,
    QuerySet,
    Count,
)
from django.db.models.functions import Coalesce
from django.core.paginator import Paginator
from django.http import JsonResponse
from django.utils import timezone
from django.core.cache import cache

from rest_framework import status, viewsets, mixins
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated

from tasks.cache_data import cache_data
import core.serializers as core_serializers
import core.models as core_models
import core.pagination as core_paginaton
import core.filters as core_filters

from shop_wiz.settings import CACHE_SHOP_SCRAPE_EXECUTION_SECONDS, RESULTS_EXPIRY_DAYS


@csrf_protect
def ping(request):
    csrf_token = get_token(request)
    response = JsonResponse({"status": "OK", "csrfToken": csrf_token})
    response.set_cookie("csrftoken", csrf_token)
    return response


class SearchedProductViewSet(
    viewsets.GenericViewSet,
):
    serializer_class = core_serializers.SearchedProduct
    queryset = core_models.SearchedProduct.objects.all()
    pagination_class = core_paginaton.SearchedProductsPagination

    def _begin_scraping_and_notify_client(self, query_param):
        cache_key = f"scrape_query_{query_param}"
        last_update = cache.get(cache_key)

        average_time_seconds = CACHE_SHOP_SCRAPE_EXECUTION_SECONDS

        if last_update and timezone.now() - last_update < timedelta(
            seconds=CACHE_SHOP_SCRAPE_EXECUTION_SECONDS
        ):
            elapsed_time = timezone.now() - last_update
            elapsed_seconds = elapsed_time.total_seconds()
            seconds_left = average_time_seconds - elapsed_seconds
            average_time_seconds = Decimal(int(max(0, seconds_left)))
            pass
        else:
            # Start the scraping process and set the cache
            # TODO: Rethink
            is_relevant_only_param = True
            cache_data.delay(query_param, is_relevant_only_param)
            cache.set(
                cache_key,
                timezone.now(),
                timeout=CACHE_SHOP_SCRAPE_EXECUTION_SECONDS,
            )
            print(f"SETTING NEW CACHE FOR {cache_key}")

        scrape_stats_for_customer_serializer = core_serializers.ScrapeStatsForCustomer(
            data={"average_time_seconds": average_time_seconds}
        )
        scrape_stats_for_customer_serializer.is_valid(raise_exception=True)
        return Response(
            {"data": {}, "metadata": scrape_stats_for_customer_serializer.data}
        )

    def list(self, request, *args, **kwargs):
        serializer = core_serializers.SearchParams(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        validated_params = serializer.validated_data

        filter_created_date = timezone.now() - timedelta(days=RESULTS_EXPIRY_DAYS)
        recent_products: QuerySet[
            core_models.SearchedProduct
        ] = self.get_queryset().filter(
            query=validated_params["query"], created__gte=filter_created_date
        )

        # Check if we have up to date data for this query
        if not recent_products.exists():
            return self._begin_scraping_and_notify_client(validated_params["query"])

        filtered_products = core_filters.SearchedProductFilter(
            validated_params, recent_products
        ).qs

        # TODO: Can we refactor it ????
        # 1. One query
        # 2. Moved to queryset manager (potentially just aggregated on the recent_products queryset right away)
        price_ranges = recent_products.aggregate(Min("price"), Max("price"))
        min_selected_price, max_selected_price = None, None
        if validated_params.get("price_range"):
            parts = validated_params.get("price_range").split(",")
            min_selected_price, max_selected_price = float(parts[0]), float(parts[1])
        price_range_info = {
            "name": "euros",
            "min": round(price_ranges["price__min"], 2),
            "max": round(price_ranges["price__max"], 2),
            "min_selected": min_selected_price,
            "max_selected": max_selected_price,
        }

        ordered_unit_type_values = [
            unit_type.value for unit_type in core_models.UnitType
        ]
        # Pre-populate an ordered dictionary with placeholders for each unit type
        ordered_unit_range_info_dict = OrderedDict(
            (unit_type, None) for unit_type in ordered_unit_type_values
        )
        unit_types_present = (
            recent_products.values("unit_type").annotate(total=Count("id")).order_by()
        )
        # Loop through each unit_type and calculate the min and max unit_measurement values
        for entry in unit_types_present:
            unit_type = entry["unit_type"]
            unit_type_products = recent_products.filter(unit_type=unit_type)
            ranges = unit_type_products.aggregate(Max("unit_measurement"))
            unit_range_info = {
                "name": unit_type,
                "count": entry["total"],
                "min": 0,
                "max": round(ranges["unit_measurement__max"], 2),
                "min_selected": None,
                "max_selected": None,
            }
            # If this unit_type is the selected type, add the selected ranges
            if unit_type == validated_params.get("unit_type"):
                min_selected = 0
                max_selected = round(ranges["unit_measurement__max"], 2)
                if validated_params.get("validate_unit_measurement_range"):
                    parts = validated_params.get(
                        "validate_unit_measurement_range"
                    ).split(",")
                    min_selected, max_selected = float(parts[0]), float(parts[1])
                unit_range_info["min_selected"] = min_selected
                unit_range_info["max_selected"] = max_selected

            # Update the placeholder in the ordered dictionary with actual data
            if unit_type in ordered_unit_range_info_dict:
                ordered_unit_range_info_dict[unit_type] = unit_range_info

        # Convert the dictionary back to a list, filtering out placeholders
        total_unit_range_info_list = [
            info for info in ordered_unit_range_info_dict.values() if info is not None
        ]

        # If requested page is greater than the greatest cached page, return the latest available page
        paginator = Paginator(filtered_products, self.pagination_class.page_size)
        page_obj = paginator.get_page(validated_params["page"])

        serializer = self.get_serializer(page_obj, many=True)

        metadata_serializer = core_serializers.SearchedProductMetadata(
            data={
                "page": page_obj.number,
                "total_pages": paginator.num_pages,
                "order_by": validated_params["order_by"],
                "total_results": filtered_products.count(),
                "active_unit": validated_params.get("unit_type"),
                "units_range_list": total_unit_range_info_list,
                "price_range_info": price_range_info,
            }
        )
        metadata_serializer.is_valid(raise_exception=True)

        return Response(
            {
                "data": serializer.data,
                "metadata": metadata_serializer.data,
            }
        )


class BasketViewSet(viewsets.GenericViewSet):
    # TODO: Make this available to admin only
    def list(self, request):
        pass


class BasketItemViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated]
    pagination_class = core_paginaton.BasketItemsPagination

    def _get_basket_item(self, request, pk):
        """Helper method to retrieve basket and item, handling common validation."""
        customer = request.user.customer
        try:
            basket = core_models.Basket.objects.get(customer=customer)
            print("basket", basket)
            for item in basket.items.all():
                print(item.pk, item)
        except core_models.Basket.DoesNotExist:
            return (
                None,
                Response(
                    {"error": "Basket not found."}, status=status.HTTP_404_NOT_FOUND
                ),
            )

        try:
            basket_item = core_models.BasketItem.objects.get(pk=pk, basket=basket)
            print("basket_item", basket_item)
        except core_models.BasketItem.DoesNotExist:
            return (
                None,
                Response(
                    {"error": "Item not found in basket"},
                    status=status.HTTP_404_NOT_FOUND,
                ),
            )

        return basket_item, None

    def list(self, request, pk=None):
        customer = request.user.customer
        basket, created = core_models.Basket.objects.get_or_create(customer=customer)

        # Queryset for listing items, ordered by product's updated_at
        ordered_queryset = (
            core_models.BasketItem.objects.filter(basket=basket)
            .select_related("product")
            .order_by("-product__updated_at")
        )

        # Separate queryset for shop breakdown, without the ordering
        shop_breakdown_queryset = (
            core_models.BasketItem.objects.filter(basket=basket)
            .select_related("product")
            .annotate(total_price=F("product__price") * F("quantity"))
        )

        # Group by shop name and aggregate total quantity and price
        shop_breakdown = shop_breakdown_queryset.values("product__shop_name").annotate(
            total_quantity=Coalesce(
                Sum("quantity", output_field=IntegerField()),
                Value(0, output_field=IntegerField()),
            ),
            total_price=Coalesce(
                Sum(
                    "total_price",
                    output_field=DecimalField(max_digits=100, decimal_places=2),
                ),
                Value(0, output_field=DecimalField(max_digits=100, decimal_places=2)),
            ),
        )
        # Transform the shop_breakdown QuerySet into a list of dictionaries
        shop_breakdown_list = [
            {
                "name": item["product__shop_name"],
                "total_price": item["total_price"].quantize(
                    Decimal("0.01"), rounding=ROUND_HALF_UP
                ),
                "total_quantity": item["total_quantity"],
            }
            for item in shop_breakdown
        ]

        # Calculating the total quantity and price across all items
        aggregated_data = shop_breakdown_queryset.aggregate(
            total_quantity_all=Coalesce(
                Sum("quantity", output_field=IntegerField()),
                Value(0, output_field=IntegerField()),
            ),
            total_price_all=Coalesce(
                Sum(
                    "total_price",
                    output_field=DecimalField(max_digits=100, decimal_places=2),
                ),
                Value(0, output_field=DecimalField(max_digits=100, decimal_places=2)),
            ),
        )
        total_quantity_all = aggregated_data.get("total_quantity_all", 0)
        total_price_all = aggregated_data.get("total_price_all", 0)

        shop_name = request.query_params.get("shop", None)
        selected_shop = shop_name if shop_name in core_models.ShopName.values else "ALL"

        if selected_shop != "ALL":
            queryset = ordered_queryset.filter(product__shop_name=shop_name)
        else:
            queryset = ordered_queryset

        # Get page number from request query params
        page_number = request.query_params.get("page", 1)
        paginator = Paginator(queryset, self.pagination_class.page_size)
        page_obj = paginator.get_page(page_number)

        serializer = core_serializers.BasketItem(page_obj, many=True)

        # Serialize the metadata
        metadata_serializer = core_serializers.BasketItemMetadata(
            data={
                "total_items": queryset.count(),
                "total_quantity": total_quantity_all,
                "total_price": total_price_all.quantize(
                    Decimal("0.01"), rounding=ROUND_HALF_UP
                ),
                "shop_breakdown": shop_breakdown_list,
                "page": page_obj.number,
                "total_pages": paginator.num_pages,
                "selected_shop": selected_shop,
            }
        )
        metadata_serializer.is_valid(raise_exception=True)

        return Response(
            {
                "data": serializer.data,
                "metadata": metadata_serializer.data,
            }
        )

    @action(detail=False, methods=["post"])
    def add_item_quantity(self, request, pk=None):
        if "pk" in request.data:
            return self._update_item_quantity(request)
        else:
            return self._add_or_update_item_in_basket(request)

    def _update_item_quantity(self, request):
        try:
            basket_item, error_response = self._get_basket_item(
                request, request.data["pk"]
            )
            if error_response:
                return error_response
            basket_item.quantity += 1
            basket_item.save()

            basket_item_serializer = core_serializers.BasketItem(basket_item)
            return Response(basket_item_serializer.data, status=status.HTTP_200_OK)
        except core_models.BasketItem.DoesNotExist:
            return Response(
                {"error": "Item not found in basket"},
                status=status.HTTP_404_NOT_FOUND,
            )

    def _add_or_update_item_in_basket(self, request):
        customer = request.user.customer
        basket, _ = core_models.Basket.objects.get_or_create(customer=customer)
        serializer = core_serializers.BasketProductCreateOrUpdate(data=request.data)
        if serializer.is_valid():
            product = serializer.save()
            basket_item, item_created = core_models.BasketItem.objects.get_or_create(
                basket=basket, product=product
            )
            if not item_created:
                basket_item.quantity += 1
                basket_item.save()

            basket_item_serializer = core_serializers.BasketItem(basket_item)
            return Response(basket_item_serializer.data, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["post"])
    def decrease_item_quantity(self, request, pk=None):
        basket_item, error_response = self._get_basket_item(request, pk)
        if error_response:
            return error_response

        # Decrease count or remove item
        if basket_item.quantity > 1:
            basket_item.quantity -= 1
            basket_item.save()
            return Response(
                {"item_id": basket_item.pk, "quantity": basket_item.quantity},
                status=status.HTTP_200_OK,
            )
        else:
            basket_item.delete()
            return Response(
                {"status": "Item removed from basket", "item_id": basket_item.pk},
                status=status.HTTP_200_OK,
            )

    @action(detail=True, methods=["delete"])
    def remove_product_items(self, request, pk=None):
        basket_item, error_response = self._get_basket_item(request, pk)
        if error_response:
            return error_response

        basket_item.delete()
        return Response(
            {"status": "Item removed from basket", "item_id": basket_item.pk},
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["delete"])
    def clear_all(self, request, pk=None):
        customer = request.user.customer
        basket = core_models.Basket.objects.get(customer=customer)
        if not basket:
            return Response(
                {"error": "Basket not found."}, status=status.HTTP_404_NOT_FOUND
            )
        # Delete all items related to the basket
        basket.items.all().delete()
        return Response({"status": "basket cleared"}, status=status.HTTP_200_OK)
