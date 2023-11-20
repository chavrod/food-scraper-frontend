from django.views.decorators.csrf import csrf_protect
from django.middleware.csrf import get_token

from django.db.models import Avg
from django.http import JsonResponse

from rest_framework import status, viewsets, mixins
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated

from tasks.cache_data import cache_data
import core.serializers as core_serializers
import core.models as core_models


@csrf_protect
def ping(request):
    csrf_token = get_token(request)
    response = JsonResponse({"status": "OK", "csrfToken": csrf_token})
    response.set_cookie("csrftoken", csrf_token)
    return response


class CachedProductsPageViewSet(
    viewsets.GenericViewSet,
):
    serializer_class = core_serializers.CachedProductsPageSerializer
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
    permission_classes = [IsAuthenticated]

    # TODO: Make this available to admin only
    def list(self, request):
        pass

    @action(detail=False, methods=["get"])
    def get_items(self, request, pk=None):
        customer = request.user.customer
        basket, created = core_models.Basket.objects.get_or_create(customer=customer)
        serializer = core_serializers.BasketSerializer(basket)
        return Response(serializer.data)

    @action(detail=False, methods=["post"])
    def add_item_quantity(self, request, pk=None):
        customer = request.user.customer
        (basket,) = core_models.Basket.objects.get_or_create(customer=customer)

        serializer = core_serializers.ProductCreateOrUpdateSerializer(data=request.data)
        if serializer.is_valid():
            product = serializer.save()
            # Logic to add product to the basket
            basket_item, item_created = core_models.BasketItem.objects.get_or_create(
                basket=basket, product=product
            )
            if not item_created:
                # Increment the quantity if the item is already in the basket
                basket_item.quantity += 1
                basket_item.save()

            basket_item_serializer = core_serializers.BasketItemSerializer(basket_item)
            return Response(basket_item_serializer.data, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["post"])
    def decrease_item_quantity(self, request, pk=None):
        customer = request.user.customer
        basket = core_models.Basket.objects.get(customer=customer)
        if not basket:
            return Response(
                {"error": "Basket not found."}, status=status.HTTP_404_NOT_FOUND
            )
        item_id = request.data.get("item_id")
        if not item_id:
            return Response(
                {"error": "Item ID is required."}, status=status.HTTP_404_NOT_FOUND
            )

        # Find the basket item
        try:
            basket_item = core_models.BasketItem.objects.get(pk=item_id, basket=basket)
        except core_models.BasketItem.DoesNotExist:
            return Response(
                {"error": "Item not found in basket"}, status=status.HTTP_404_NOT_FOUND
            )

        # Decrease count or remove item
        if basket_item.quantity > 1:
            basket_item.quantity -= 1
            basket_item.save()
            return Response(
                {"item_id": item_id, "quantity": basket_item.quantity},
                status=status.HTTP_200_OK,
            )
        else:
            basket_item.delete()
            return Response(
                {"status": "Item removed from basket", "item_id": item_id},
                status=status.HTTP_200_OK,
            )

    @action(detail=False, methods=["post"])
    def clear_all(self, request, pk=None):
        customer = request.user.customer
        core_models.Basket.objects.filter(customer=customer).delete()
        return Response({"status": "basket cleared"}, status=status.HTTP_204_NO_CONTENT)
