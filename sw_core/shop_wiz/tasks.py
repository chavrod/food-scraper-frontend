from celery import shared_task

import logging

logger = logging.getLogger(__name__)

from datetime import datetime, timedelta

from core.models import CachedProductsPage


@shared_task
def delete_old_cached_products():
    one_day_ago = datetime.now() - timedelta(days=1)
    old_products = CachedProductsPage.objects.filter(created__lte=one_day_ago)
    count = old_products.count()
    old_products.delete()
    logger.info(f"Deleted {count} CachedProductsPage entries older than 1 day")
