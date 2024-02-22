import re
from allauth.account.adapter import DefaultAccountAdapter
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from django.core.exceptions import ValidationError
from django.contrib.auth.password_validation import validate_password
from core.models import Customer, Basket


class MyAccountAdapter(DefaultAccountAdapter):
    def clean_password(self, password, user=None):
        # Use Django's built-in validators
        validate_password(password, user)

        # Your custom validations:

        # Minimum length
        if len(password) < 8:
            raise ValidationError("Password must be at least 8 characters long.")

        # At least one uppercase letter
        if not any(char.isupper() for char in password):
            raise ValidationError(
                "Password must contain at least one uppercase letter."
            )

        # At least one lowercase letter
        if not any(char.islower() for char in password):
            raise ValidationError(
                "Password must contain at least one lowercase letter."
            )

        # At least one number
        if not any(char.isdigit() for char in password):
            raise ValidationError("Password must contain at least one digit.")

        # At least one special character
        if not any(char in "!@#$%^&*" for char in password):
            raise ValidationError(
                "Password must contain at least one special character from !@#$%^&*."
            )

        # No repeated characters
        repeats_regex = re.compile(r"(.)\1{3,}")
        if repeats_regex.search(password):
            raise ValidationError(
                "Password must not contain repeated characters in sequence."
            )

        return super().clean_password(password, user)


class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    def save_user(self, request, sociallogin, form):
        user = super(CustomSocialAccountAdapter, self).save_user(
            request, sociallogin, form
        )

        customer = Customer.objects.create(user=user)
        Basket.objects.create(customer=customer)

        return user
