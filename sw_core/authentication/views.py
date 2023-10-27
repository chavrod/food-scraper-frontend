import json
from django.shortcuts import redirect, render
from django.http import HttpResponseRedirect
from django.contrib.auth import get_user_model
from django.http import HttpResponse, HttpResponseBadRequest
from django.views import View

from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.response import Response

from allauth.account.views import ConfirmEmailView, EmailAddress
from allauth.account.utils import send_email_confirmation
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView
from dj_rest_auth.views import LogoutView as DefaultLogoutView, PasswordResetConfirmView

import authentication.models as authentication_models
from authentication.serializers import CustomPasswordResetConfirmSerializer

User = get_user_model()

from shop_wiz.settings import BASE_DOMAIN_NAME, EMAIL_VERIFICATION_RESEND_LIMIT


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


def get_client_ip(request):
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        ip = x_forwarded_for.split(",")[0]
        return ip
    ip = request.META.get("REMOTE_ADDR")
    if ip:
        return ip
    return None


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

        client_ip = get_client_ip(request)

        # Check if the email or IP is blacklisted
        (
            email_entry,
            _,
        ) = authentication_models.EmailRequestBlacklist.objects.get_or_create(
            email=email
        )
        if client_ip:
            (
                ip_entry,
                _,
            ) = authentication_models.IPRequestBlacklist.objects.get_or_create(
                ip_address=client_ip
            )

        if (
            email_entry.request_count >= EMAIL_VERIFICATION_RESEND_LIMIT
            or ip_entry.request_count >= EMAIL_VERIFICATION_RESEND_LIMIT
        ):
            return HttpResponse(status=429)  # 429 Too Many Requests

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # avoid leaking information about user existence
            return HttpResponse(status=200)

        if not is_user_email_verified(user, email):
            send_email_confirmation(request, user, email)
            # Increment the count for email and IP
            email_entry.request_count += 1
            email_entry.save()
            ip_entry.request_count += 1
            ip_entry.save()

        return HttpResponse(status=200)


from dj_rest_auth.views import (
    PasswordResetConfirmView as OriginalPasswordResetConfirmView,
)
from django.shortcuts import render
from django.urls import reverse_lazy
from django.http import HttpResponseRedirect


class CustomPasswordResetConfirmView(OriginalPasswordResetConfirmView):
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
