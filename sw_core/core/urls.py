from django.urls import path, include
import core.views as core_views

from rest_framework.routers import DefaultRouter


# Create a router and register our viewsets with it.
router = DefaultRouter()
router.register("basket_items", core_views.BasketItemViewSet, basename="basket_item")


urlpatterns = [
    path(
        "products/",
        core_views.SearchedProductViewSet.as_view({"get": "list"}),
    ),
    path("", include(router.urls)),
]
