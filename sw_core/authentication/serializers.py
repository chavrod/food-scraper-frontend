from dj_rest_auth.serializers import PasswordResetConfirmSerializer
from allauth.account.adapter import get_adapter


class CustomPasswordResetConfirmSerializer(PasswordResetConfirmSerializer):
    def custom_validation(self, attrs):
        # Call the existing validation
        super().custom_validation(attrs)

        # Add your password validations
        password = attrs.get("new_password1")
        get_adapter().clean_password(password)
