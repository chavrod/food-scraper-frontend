from dj_rest_auth.serializers import PasswordResetConfirmSerializer
from dj_rest_auth.serializers import UserDetailsSerializer, JWTSerializer
from allauth.account.adapter import get_adapter

from core.serializers import CustomerSerializer


class CustomUserDetailsSerializer(UserDetailsSerializer):
    customer = CustomerSerializer(read_only=True)

    class Meta(UserDetailsSerializer.Meta):
        fields = UserDetailsSerializer.Meta.fields + ("customer",)
        read_only_fields = UserDetailsSerializer.Meta.read_only_fields + ("customer",)


class CustomPasswordResetConfirmSerializer(PasswordResetConfirmSerializer):
    def custom_validation(self, attrs):
        # Call the existing validation
        super().custom_validation(attrs)

        # Add your password validations
        password = attrs.get("new_password1")
        get_adapter().clean_password(password)
