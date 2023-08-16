from django.shortcuts import render
from rest_framework import status, viewsets, mixins
from dynamic_rest.viewsets import DynamicModelViewSet, WithDynamicViewSetMixin
from rest_framework.response import Response

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
        query_param = self.request.query_params.get("query", None)
        page_param = self.request.query_params.get("page", None)

        serializer = self.get_serializer(
            data={"query": query_param, "page": page_param}
        )
        serializer.is_valid(raise_exception=True)

        query_param = serializer.validated_data["query"]
        page_param = serializer.validated_data["page"]

        # Check if we have cached data for this query
        cached_pages = core_models.CachedProductsPage.objects.filter(
            query=query_param
        ).order_by("-page")
        if not cached_pages.exists():
            # Start the scraping process
            # scrape_data(query_param)  # This would be your scraping function
            return Response(
                {"detail": "Results were not saved."}, status=status.HTTP_202_ACCEPTED
            )

        # If requested page is greater than the greatest cached page, return the latest available page
        if page_param > cached_pages.first().page:
            page_param = cached_pages.first().page

        # Now, retrieve the data for the specific page and return it
        cached_page_data = cached_pages.filter(page=page_param).first()
        serializer = self.get_serializer(cached_page_data)
        return Response(serializer.data)
