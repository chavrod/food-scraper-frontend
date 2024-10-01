from celery import shared_task

import logging

logger = logging.getLogger(__name__)

from datetime import timedelta
from django.utils import timezone

from allauth.account.models import EmailAddress
from django.contrib.auth import get_user_model

import models as authentication_models

User = get_user_model()


@shared_task
def delete_unverified_emails():
    one_day_ago = timezone.now() - timedelta(days=1)

    # Get unverified email addresses
    unverified_emails = EmailAddress.objects.filter(verified=False)

    # Get associated user accounts whose date_joined is within the timeframe
    users_to_delete = User.objects.filter(
        emailaddress__in=unverified_emails, date_joined__lte=one_day_ago
    )

    # Delete users
    users_to_delete.delete()


@shared_task
def reset_password_request_counts():
    # Filter CustomerRequestBlacklist entries with action RESET_PASSWORD
    customer_entries = authentication_models.CustomerRequestBlacklist.objects.filter(
        action=authentication_models.BlacklistActions.RESET_PASSWORD
    )
    customer_entries.update(request_count=0)

    # Filter IPRequestBlacklist entries with action RESET_PASSWORD
    ip_entries = authentication_models.IPRequestBlacklist.objects.filter(
        action=authentication_models.BlacklistActions.RESET_PASSWORD
    )
    ip_entries.update(request_count=0)
