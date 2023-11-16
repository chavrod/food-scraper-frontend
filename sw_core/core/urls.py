from django.urls import path, include
import core.views as core_views

from rest_framework.routers import DefaultRouter


# Create a router and register our viewsets with it.
router = DefaultRouter()
router.register(r"baskets", core_views.BasketViewSet, basename="basket")


urlpatterns = [
    path(
        "cached_products_page/",
        core_views.CachedProductsPageViewSet.as_view({"get": "retrieve"}),
    ),
    path("", include(router.urls)),
]
