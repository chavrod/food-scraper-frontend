from django.shortcuts import render
from rest_framework import status, viewsets, mixins
from dynamic_rest.viewsets import DynamicModelViewSet, WithDynamicViewSetMixin
from rest_framework.response import Response
from tasks.cache_data import cache_data
import core.serializers as core_serializers
import core.models as core_models


# Create your views here.
class CachedProductsPageViewSet(
    WithDynamicViewSetMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = core_serializers.CachedProductsPageSerializer
    queryset = core_models.CachedProductsPage.objects.all()

    def retrieve(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=kwargs)
        serializer.is_valid(raise_exception=True)

        query_param = serializer.validated_data["query"]
        page_param = serializer.validated_data["page"]
        is_relevant_only = serializer.validated_data["is_relevant_only"]

        # Check if we have cached data for this query
        cached_pages = self.queryset.filter(query=query_param).order_by("-page")
        if not cached_pages.exists():
            # Start the scraping process
            cache_data(
                query_param, is_relevant_only
            )  # This would be your scraping function
            return Response(
                data={"averageTimeSeconds": 50}, status=status.HTTP_206_PARTIAL_CONTENT
            )

        # If requested page is greater than the greatest cached page, return the latest available page
        if page_param > cached_pages.first().page:
            page_param = cached_pages.first().page

        # Now, retrieve the data for the specific page and return it
        cached_page_data = cached_pages.filter(page=page_param).first()
        serializer = self.get_serializer(cached_page_data)
        data = serializer.data

        total_pages = cached_pages.count()

        # Append the current page and total pages to the response data
        data.update({"current_page": page_param, "total_pages": total_pages})

        return Response(data)
