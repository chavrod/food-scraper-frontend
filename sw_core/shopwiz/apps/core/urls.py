from django.urls import path, include

from rest_framework.routers import DefaultRouter

from .views import SearchedProductViewSet, BasketItemViewSet, ping


# Create a router and register our viewsets with it.
router = DefaultRouter()
router.register("basket_items", BasketItemViewSet, basename="basket_item")


urlpatterns = [
    path(
        "products/",
        SearchedProductViewSet.as_view({"get": "list"}),
    ),
    path("ping/", ping, name="ping"),
    path("", include(router.urls)),
]
