import json
from django.shortcuts import redirect, render
from django.http import HttpResponseRedirect
from django.contrib.auth import get_user_model
from django.http import HttpResponse, HttpResponseBadRequest
from django.shortcuts import render
from django.views import View

from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
)
from rest_framework import status

from allauth.account.views import ConfirmEmailView, EmailAddress
from allauth.account.utils import send_email_confirmation
from dj_rest_auth.registration.views import RegisterView
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView
from dj_rest_auth.views import (
    LogoutView as DefaultLogoutView,
    PasswordResetConfirmView,
    PasswordResetView,
    PasswordResetConfirmView,
)

from authentication.serializers import CustomPasswordResetConfirmSerializer
import authentication.models as authentication_models
from core.models import Customer
from shop_wiz.settings import BASE_DOMAIN_NAME
import utils.abuse_detection as abuse_detection


User = get_user_model()


class CustomRegisterView(RegisterView):
    def perform_create(self, serializer):
        user = super().perform_create(serializer)
        Customer.objects.create(user=user)
        return user


class GoogleLogin(SocialLoginView):
    adapter_class = GoogleOAuth2Adapter
    callback_url = "http://127.0.0.1:3000/"
    client_class = OAuth2Client


class LogoutView(DefaultLogoutView):
    def post(self, request):
        refresh_token = RefreshToken(request.data["refresh"])
        refresh_token.blacklist()
        return Response(status=200)


class CustomConfirmEmailView(ConfirmEmailView):
    def post(self, *args, **kwargs):
        super_response = super().post(*args, **kwargs)

        # You can check if the returned response from super() call was a redirect response.
        # This is because, in case of errors or other conditions, the base class might not return a redirect.
        if isinstance(super_response, HttpResponseRedirect):
            # Replace the super response's redirect URL with 'example.com'
            return redirect(f"{BASE_DOMAIN_NAME}?login=successful-email-confirmation")

        return super_response


def is_user_email_verified(user, email):
    """
    returns True if EmailAddress exists and is already verified, otherwise returns False
    """
    result = False
    try:
        emailaddress = EmailAddress.objects.get_for_user(user, email)
        result = emailaddress.verified
    except EmailAddress.DoesNotExist:
        pass
    return result


class SendValidationEmailView(View):
    """
    Implement requests to manually send confirmation email in case it hasn't been received
    """

    def post(self, request, *args, **kwargs):
        """
        request for validation email sending
        """
        payload = json.loads(request.body)
        email = payload.get("email")
        if email is None:
            return HttpResponseBadRequest("No email provided")

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # avoid leaking information about user existence
            return HttpResponse(status=200)

        (
            is_rate_limited,
            customer_entry,
            ip_entry,
        ) = abuse_detection.check_rate_limit(
            request=request,
            customer=user.customer,
            action=authentication_models.BlacklistActions.VALIDATE_EMAIL,
        )
        if is_rate_limited:
            return HttpResponse(status=429)  # 429 Too Many Requests

        if is_user_email_verified(user, email):
            raise ValidationError("Email is already verified.")

        send_email_confirmation(request, user, email)
        abuse_detection.add_to_rate_limit(
            ip_entry=ip_entry, customer_entry=customer_entry
        )

        return HttpResponse(status=200)


class CustomPasswordResetView(PasswordResetView):
    def post(self, request, *args, **kwargs):
        payload = json.loads(request.body)
        email = payload.get("email")
        if email is None:
            return HttpResponseBadRequest("No email provided")

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # avoid leaking information about user existence
            return HttpResponse(status=200)

        (
            is_rate_limited,
            customer_entry,
            ip_entry,
        ) = abuse_detection.check_rate_limit(
            request=request,
            customer=user.customer,
            action=authentication_models.BlacklistActions.RESET_PASSWORD,
        )
        if is_rate_limited:
            return HttpResponse(status=429)  # 429 Too Many Requests

        # Call the post method of the original PasswordResetView
        response = super().post(request, *args, **kwargs)

        abuse_detection.add_to_rate_limit(
            ip_entry=ip_entry, customer_entry=customer_entry
        )

        return response


class CustomPasswordResetConfirmView(PasswordResetConfirmView):
    serializer_class = CustomPasswordResetConfirmSerializer

    def get(self, request, *args, **kwargs):
        context = {"uid": kwargs.get("uidb64"), "token": kwargs.get("token")}
        return render(request, "account/password_reset_confirm.html", context)

    def post(self, request, *args, **kwargs):
        try:
            response = super().post(request, *args, **kwargs)

            # If the reset was successful, redirect to a success page or login page.
            if response.status_code == 200:
                return redirect(
                    f"{BASE_DOMAIN_NAME}?password-reset=successful-password-reset"
                )
            else:
                raise ValueError("Unexpected response status.")
        except Exception as e:
            print("Exception occurred.")

            # Capture all errors from the exception
            if hasattr(e, "detail"):
                errors = e.detail
            elif isinstance(e, dict):
                errors = "; ".join(
                    [f"{key}: {' '.join(val)}" for key, val in e.items()]
                )
            else:
                errors = str(e)

            print(f"Errors: {errors}")

            context = {
                "uid": request.POST.get("uid"),
                "token": request.POST.get("token"),
                "errors": errors,
            }
            return render(request, "account/password_reset_confirm.html", context)


@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def delete_account(request):
    user = request.user
    if user.is_authenticated:
        user.delete()
        return Response({"message": "Account deleted successfully."})
    else:
        return Response({"error": "Unauthorized user."}, status=401)
