from decimal import Decimal, ROUND_HALF_UP

from django.views.decorators.csrf import csrf_protect
from django.middleware.csrf import get_token
from django.core.paginator import Paginator
from django.http import JsonResponse

from rest_framework import status, viewsets, mixins
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated

from tasks.update_products import begin_updating_products
import core.serializers as core_serializers
import core.models as core_models
import core.pagination as core_paginaton
import core.filters as core_filters


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

    def list(self, request, *args, **kwargs):
        serializer = core_serializers.SearchedProductParams(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        validated_params = serializer.validated_data

        # Check if we have up to date data for this query
        recent_batch, recent_products, update_date, update_needed = (
            core_models.SearchedProduct.objects.get_most_recent_and_check_freshness(
                validated_params["query"]
            )
        )

        # Potential scenarios
        # 1. no recent_batch -> no products -> yes update_needed
        # 2. yes recent_batch -> yes products -> yes update_needed
        # 3. yes recent_batch -> yes products -> no update_needed
        # 4. yes recent_batch -> no products -> yes update_needed
        # 5. yes recent_batch -> no products -> no update_needed

        # 1. no recent_batch -> no products -> yes update_needed
        if not recent_batch:
            begin_updating_products(validated_params["query"])
            return Response(
                {
                    "data": [],
                    "metadata": {
                        "is_full_metadata": False,
                        "first_time_search": True,
                        "is_update_needed": True,
                    },
                }
            )
        # 4. yes recent_batch -> no products -> yes update_needed
        # 5. yes recent_batch -> no products -> no update_needed
        if not recent_products:
            if update_needed:
                begin_updating_products(validated_params["query"])
            return Response(
                {
                    "data": [],
                    "metadata": {
                        "is_full_metadata": False,
                        "first_time_search": False,
                        "is_update_needed": update_needed,
                    },
                }
            )

        # LOGIC BELOW COVERS THOSE 2 CASES
        # 2. yes recent_batch -> yes products -> yes update_needed
        # 3. yes recent_batch -> yes products -> no update_needed

        if update_needed:
            begin_updating_products(validated_params["query"])

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
                "is_full_metadata": True,
                "query": validated_params["query"],
                "is_update_needed": update_needed,
                "update_date": update_date,
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
        except core_models.Basket.DoesNotExist:
            return (
                None,
                Response(
                    {"error": "Basket not found."}, status=status.HTTP_404_NOT_FOUND
                ),
            )

        try:
            basket_item = core_models.BasketItem.objects.get(pk=pk, basket=basket)
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

    @action(detail=True, methods=["post"])
    def toggle_checked(self, request, pk=None):
        basket_item, error_response = self._get_basket_item(request, pk)
        if error_response:
            return error_response

        basket_item.checked = not basket_item.checked
        basket_item.save()
        return Response(
            {"status": "Item checked", "item_id": basket_item.pk},
            status=status.HTTP_200_OK,
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
        # Validated shop name if present
        serializer = core_serializers.BasketItemParams(data=request.data)
        serializer.is_valid(raise_exception=True)
        validated_shop_name = serializer.validated_data.get("shop", None)

        if validated_shop_name != "ALL":
            # Delete only items from a specific shop
            basket.items.filter(product__shop_name=validated_shop_name).delete()
        else:
            # Delete all items related to the basket
            basket.items.all().delete()

        return Response({"status": "basket items cleared"}, status=status.HTTP_200_OK)
