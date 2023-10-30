from django.urls import path

from dj_rest_auth.jwt_auth import get_refresh_view
from dj_rest_auth.registration.views import RegisterView
from dj_rest_auth.views import (
    LoginView,
    UserDetailsView,
    PasswordResetView,
)

from rest_framework_simplejwt.views import TokenVerifyView

from authentication.views import (
    GoogleLogin,
    LogoutView,
    SendValidationEmailView,
    CustomPasswordResetView,
    CustomRegisterView,
    delete_account,
)

app_name = "accounts"

urlpatterns = [
    path("register/", CustomRegisterView.as_view(), name="rest_register"),
    path("login/", LoginView.as_view(), name="rest_login"),
    path("logout/", LogoutView.as_view(), name="rest_logout"),
    path("user/", UserDetailsView.as_view(), name="rest_user_details"),
    path("token/verify/", TokenVerifyView.as_view(), name="token_verify"),
    path("token/refresh/", get_refresh_view().as_view(), name="token_refresh"),
    path("google/", GoogleLogin.as_view(), name="google_login"),
    path(
        "send-validation-email/",
        SendValidationEmailView.as_view(),
        name="send_validation_email",
    ),
    path("password-reset/", CustomPasswordResetView.as_view(), name="password_reset"),
    path("delete-account/", delete_account),
]
