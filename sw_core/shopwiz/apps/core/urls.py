from django.urls import path, include

from .views import SearchedProductViewSet, BasketItemViewSet

from rest_framework.routers import DefaultRouter


# Create a router and register our viewsets with it.
router = DefaultRouter()
router.register("basket_items", BasketItemViewSet, basename="basket_item")


urlpatterns = [
    path(
        "products/",
        SearchedProductViewSet.as_view({"get": "list"}),
    ),
    path("", include(router.urls)),
]
