import re

from django.core.exceptions import ValidationError
from django.contrib.auth.password_validation import validate_password

from allauth.account.adapter import DefaultAccountAdapter
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter

from config.settings import BASE_DOMAIN
from shopwiz.apps.core.models import Customer, Basket


class MyAccountAdapter(DefaultAccountAdapter):
    def clean_password(self, password, user=None):
        password_errors = []

        # Minimum length
        if len(password) < 8:
            password_errors.append("Password must be at least 8 characters long")

        # At least one uppercase letter
        if not any(char.isupper() for char in password):
            password_errors.append(
                "Password must contain at least one uppercase letter"
            )

        # At least one lowercase letter
        if not any(char.islower() for char in password):
            password_errors.append(
                "Password must contain at least one uppercase letter"
            )

        # At least one number
        if not any(char.isdigit() for char in password):
            password_errors.append("Password must contain at least one digit")

        # At least one special character
        if not any(char in "!@#$%^&*" for char in password):
            password_errors.append(
                "Password must contain at least one special character from !@#$%^&*"
            )

        if password_errors:
            raise ValidationError(password_errors)

        # TODO: Add 'No repeated characters'
        # repeats_regex = re.compile(r"(.)\1{3,}")
        # if repeats_regex.search(password):
        #     raise ValidationError(
        #         "Password must not contain repeated characters in sequence four times or more."
        #     )

        return super().clean_password(password, user)

    def get_email_verification_redirect_url(self, email_address):
        print("Redirecting....")
        return f"{BASE_DOMAIN}?login=successful-email-confirmation"


class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    def save_user(self, request, sociallogin, form):
        print("HELLO CustomSocialAccountAdapter save_user")
        user = super(CustomSocialAccountAdapter, self).save_user(
            request, sociallogin, form
        )

        customer = Customer.objects.create(user=user)
        Basket.objects.create(customer=customer)

        return user
