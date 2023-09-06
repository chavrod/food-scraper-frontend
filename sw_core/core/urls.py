from django.urls import path
from dynamic_rest.routers import DynamicRouter
import core.views as core_views

router = DynamicRouter()
# router.register(
#     "cached_products_page/<query>/<page>/", core_views.CachedProductsPageViewSet
# )

# urlpatterns = router.urls

urlpatterns = [
    path("register/", core_views.RegisterViewSet.as_view()),
    path(
        "cached_products_page/",
        core_views.CachedProductsPageViewSet.as_view({"get": "retrieve"}),
    ),
]
