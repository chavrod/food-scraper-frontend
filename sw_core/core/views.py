from decimal import Decimal, ROUND_HALF_UP
from datetime import timedelta

from django.views.decorators.csrf import csrf_protect
from django.middleware.csrf import get_token
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
        serializer = core_serializers.SearchedProductParams(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        validated_params = serializer.validated_data

        # Check if we have up to date data for this query
        recent_products = core_models.SearchedProduct.objects.all().recent_products(
            validated_params["query"]
        )
        if not recent_products.exists():
            return self._begin_scraping_and_notify_client(validated_params["query"])

        # If recent products exists, gather relevant data
        filtered_products = core_filters.SearchedProductFilter(
            validated_params, recent_products
        ).qs

        # Paginate and serilize results
        paginator = Paginator(filtered_products, self.pagination_class.page_size)
        page_obj = paginator.get_page(validated_params["page"])
        serializer = core_serializers.SearchedProduct(page_obj, many=True)

        # Get range summaries
        price_range_info = (
            core_models.SearchedProduct.objects.get_selected_price_range_info(
                recent_products, validated_params.get("price_range")
            )
        )
        total_unit_range_info_list = (
            core_models.SearchedProduct.objects.get_selected_unit_range_info_list(
                recent_products,
                validated_params.get("unit_type"),
                validated_params.get("unit_measurement_range"),
            )
        )

        metadata_serializer = core_serializers.SearchedProductMetadata(
            data={
                "page": page_obj.number,
                "total_pages": paginator.num_pages,
                "order_by": validated_params["order_by"],
                "total_results": filtered_products.count(),
                "active_unit": validated_params.get("unit_type"),
                "units_range_list": total_unit_range_info_list,
                "price_range_info": price_range_info,
                "filter_count": core_models.SearchedProduct.objects.count_filters(
                    price_range_info,
                    validated_params.get("unit_type"),
                    total_unit_range_info_list,
                ),
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
        # Get customers basket
        customer = request.user.customer
        basket, created = core_models.Basket.objects.get_or_create(customer=customer)
        # Validated search params
        serializer = core_serializers.BasketItemParams(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        validated_params = serializer.validated_data

        # Get the queryset, paginate, and serialize
        queryset = core_models.BasketItem.objects.customer_ordered_basket(
            basket=basket
        ).filtered_by_shop(validated_params.get("shop"))

        paginator = Paginator(queryset, self.pagination_class.page_size)
        page_obj = paginator.get_page(validated_params.get("page"))

        serializer = core_serializers.BasketItem(page_obj, many=True)

        # Aggregated total qty and price
        total_qty, total_price = (
            core_models.BasketItem.objects.customer_basket_total_qty_and_price(
                basket=basket
            )
        )
        # Serialize the metadata
        metadata_serializer = core_serializers.BasketItemMetadata(
            data={
                "total_items": queryset.count(),
                "total_quantity": total_qty,
                "total_price": total_price.quantize(
                    Decimal("0.01"), rounding=ROUND_HALF_UP
                ),
                "shop_breakdown": core_models.BasketItem.objects.customer_basket_summary_by_shop(
                    basket
                ),
                "page": page_obj.number,
                "total_pages": paginator.num_pages,
                "selected_shop": validated_params.get("shop", "ALL"),
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
