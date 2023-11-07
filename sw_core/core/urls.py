from django.urls import path
import core.views as core_views


# urlpatterns = router.urls

urlpatterns = [
    # path("register/", core_views.RegisterView.as_view()),
    # path("login/", core_views.LoginView.as_view()),
    # path("user/", core_views.UserView.as_view()),
    # path("logout/", core_views.LogoutView.as_view()),
    path(
        "cached_products_page/",
        core_views.CachedProductsPageViewSet.as_view({"get": "retrieve"}),
    ),
]
