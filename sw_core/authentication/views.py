from django.shortcuts import redirect, render
from django.http import HttpResponseRedirect

from dj_rest_auth.registration.views import SocialLoginView
from allauth.account.views import ConfirmEmailView
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.views import LogoutView as DefaultLogoutView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.response import Response

from shop_wiz.settings import BASE_DOMAIN_NAME


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
            return redirect(f"https://{BASE_DOMAIN_NAME}")

        return super_response
