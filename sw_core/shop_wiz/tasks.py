from celery import shared_task

import logging

logger = logging.getLogger(__name__)

from datetime import timedelta
from django.utils import timezone

from core.models import CachedProductsPage
from allauth.account.models import EmailAddress
from django.contrib.auth import get_user_model

User = get_user_model()


@shared_task
def delete_old_cached_products():
    one_day_ago = timezone.now() - timedelta(days=1)
    old_products = CachedProductsPage.objects.filter(created__lte=one_day_ago)
    count = old_products.count()
    old_products.delete()
    logger.info(f"Deleted {count} CachedProductsPage entries older than 1 day")


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
