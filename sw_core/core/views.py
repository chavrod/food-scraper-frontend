from django.views.decorators.csrf import csrf_protect
from django.middleware.csrf import get_token

from django.db.models import Avg, Sum, F, FloatField
from django.core.paginator import Paginator
from django.http import JsonResponse

from rest_framework import status, viewsets, mixins
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated

from tasks.cache_data import cache_data
import core.serializers as core_serializers
import core.models as core_models
import core.pagination as core_paginaton


@csrf_protect
def ping(request):
    csrf_token = get_token(request)
    response = JsonResponse({"status": "OK", "csrfToken": csrf_token})
    response.set_cookie("csrftoken", csrf_token)
    return response


class CachedProductsPageViewSet(
    viewsets.GenericViewSet,
):
    serializer_class = core_serializers.CachedProductsPage
    queryset = core_models.CachedProductsPage.objects.all()

    def retrieve(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)

        query_param = serializer.validated_data["query"]
        page_param = serializer.validated_data["page"]
        # is_relevant_only_param = serializer.validated_data["is_relevant_only"]
        is_relevant_only_param = True

        # Check if we have cached data for this query
        cached_pages = self.get_queryset().filter(query=query_param).order_by("-page")
        if not cached_pages.exists():
            print("RESULTS WERE NOT CACHED. STARTING THE SCRAPING....")
            # Start the scraping process
            cache_data.delay(query_param, is_relevant_only_param)

            # COUNT HERE
            average_time = core_models.ScrapeSummaryTotal.objects.aggregate(
                avg_time=Avg("total_execution_time")
            )["avg_time"]
            if (
                average_time is None
            ):  # This handles the case when there are no records in ScrapeSummary
                average_time = 30  # Default to 30 if no data exists

            return Response(
                data={"averageTimeSeconds": average_time},
                status=status.HTTP_206_PARTIAL_CONTENT,
            )
        print("FOUND CACHED RESULTS!!! SENDING RESPONSE....")
        # If requested page is greater than the greatest cached page, return the latest available page
        if page_param > cached_pages.first().page:
            page_param = cached_pages.first().page

        # Now, retrieve the data for the specific page and return it
        cached_page_data = cached_pages.filter(page=page_param).first()
        serializer = self.get_serializer(cached_page_data)
        data = serializer.data

        total_pages = cached_pages.count()

        # Append the current page and total pages to the response data
        data.update({"total_pages": total_pages})

        return Response(data)


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

        # Annotate each item with total price (price * quantity)
        queryset = (
            core_models.BasketItem.objects.filter(basket=basket)
            .select_related("product")
            .annotate(total_price=F("product__price") * F("quantity"))
        )

        # Group by shop name and aggregate total quantity and price
        shop_breakdown = queryset.values("product__shop_name").annotate(
            total_quantity=Sum("quantity"),
            total_price=Sum("total_price", output_field=FloatField()),
        )

        # Calculating the total quantity and price across all items
        total_quantity_all = (
            queryset.aggregate(total_quantity_all=Sum("quantity"))["total_quantity_all"]
            or 0
        )
        total_price_all = (
            queryset.aggregate(total_price_all=Sum("total_price"))["total_price_all"]
            or 0
        )

        shop_name = request.query_params.get("shop", None)
        selected_shop = shop_name if shop_name in core_models.ShopName.values else "ALL"
        if shop_name in core_models.ShopName.values:
            print("shop_name", shop_name)
            queryset = queryset.filter(product__shop_name=shop_name)

        # Get page number from request query params
        page_number = request.query_params.get("page", 1)
        paginator = Paginator(queryset, self.pagination_class.page_size)
        page_obj = paginator.get_page(page_number)

        serializer = core_serializers.BasketItem(page_obj, many=True)

        return Response(
            {
                "results": serializer.data,
                "metadata": {
                    "total_items": queryset.count(),
                    "total_quantity": total_quantity_all,
                    "total_price": total_price_all,
                    "shop_breakdown": shop_breakdown,
                    "page": page_obj.number,
                    "total_pages": paginator.num_pages,
                    "selected_shop": selected_shop,
                },
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
        serializer = core_serializers.ProductCreateOrUpdate(data=request.data)
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
