from rest_framework import serializers
from dj_rest_auth.serializers import PasswordResetConfirmSerializer
from dj_rest_auth.serializers import UserDetailsSerializer, JWTSerializer
from allauth.account.adapter import get_adapter
from allauth.socialaccount.models import SocialAccount

from core.serializers import Customer

from django_typomatic import ts_interface, generate_ts

from shop_wiz.settings import ENV


@ts_interface()
class SocialAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = SocialAccount
        fields = ("provider",)


@ts_interface()
class CustomUserDetailsSerializer(UserDetailsSerializer):
    customer = Customer(read_only=True)
    social_accounts = SocialAccountSerializer(
        source="socialaccount_set", many=True, read_only=True
    )

    class Meta(UserDetailsSerializer.Meta):
        fields = UserDetailsSerializer.Meta.fields + ("customer", "social_accounts")
        read_only_fields = UserDetailsSerializer.Meta.read_only_fields + (
            "customer",
            "social_accounts",
        )


class CustomPasswordResetConfirmSerializer(PasswordResetConfirmSerializer):
    def custom_validation(self, attrs):
        # Call the existing validation
        super().custom_validation(attrs)

        # Add your password validations
        password = attrs.get("new_password1")
        get_adapter().clean_password(password)


# if ENV == "DEV":
#     generate_ts("../sw_customer/types/customer_types.ts")
