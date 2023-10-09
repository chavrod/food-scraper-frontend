from dj_rest_auth.registration.views import SocialLoginView
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.views import LogoutView as DefaultLogoutView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.response import Response


class GoogleLogin(SocialLoginView):
    adapter_class = GoogleOAuth2Adapter
    callback_url = "http://127.0.0.1:3000/"
    client_class = OAuth2Client


class LogoutView(DefaultLogoutView):
    def post(self, request):
        refresh_token = RefreshToken(request.data["refresh"])
        refresh_token.blacklist()
        return Response(status=200)
