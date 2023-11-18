from django.views.decorators.csrf import csrf_protect
from django.middleware.csrf import get_token

from django.db.models import Avg
from django.http import JsonResponse

from rest_framework import status, viewsets, mixins
from rest_framework.response import Response
from rest_framework.decorators import action

from tasks.cache_data import cache_data
import core.serializers as core_serializers
import core.models as core_models

from django.contrib.auth.models import User
from myapp.serializers import UserSerializer
from rest_framework import generics
from rest_framework.permissions import IsAdminUser


class UserList(generics.ListCreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]


@csrf_protect
def ping(request):
    csrf_token = get_token(request)
    response = JsonResponse({"status": "OK", "csrfToken": csrf_token})
    response.set_cookie("csrftoken", csrf_token)
    return response


class CachedProductsPageViewSet(
    mixins.RetrieveModelMixin,
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
    def add_item(self, request, pk=None):
        customer = request.user.customer
        # TODO: Add auth and menigful response msg
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
    def remove_item(self, request, pk=None):
        pass

    @action(detail=False, methods=["post"])
    def clear_all(self, request, pk=None):
        customer = request.user.customer
        core_models.Basket.objects.filter(customer=customer).delete()
        return Response({"status": "basket cleared"}, status=status.HTTP_204_NO_CONTENT)
