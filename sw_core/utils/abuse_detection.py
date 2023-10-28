import json
from typing import Union, Optional


import authentication.models as authentication_models
from shop_wiz.settings import EMAIL_RESEND_LIMIT, ENV


def _get_client_ip(request):
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        ip = x_forwarded_for.split(",")[0]
        return ip
    ip = request.META.get("REMOTE_ADDR")
    if ip:
        return ip
    return None


def check_rate_limit(request, customer):
    """
    Check if the email or IP is blacklisted and if they've exceeded the rate limit.
    Returns a tuple: (is_rate_limited, email_entry, ip_entry)
    """

    client_ip = _get_client_ip(request)

    # Check if the email or IP is blacklisted
    (
        customer_entry,
        _,
    ) = authentication_models.CustomerRequestBlacklist.objects.get_or_create(
        customer=customer
    )
    if client_ip:
        (
            ip_entry,
            _,
        ) = authentication_models.IPRequestBlacklist.objects.get_or_create(
            ip_address=client_ip
        )

    if customer_entry.request_count >= EMAIL_RESEND_LIMIT or (
        ip_entry.request_count >= EMAIL_RESEND_LIMIT and ENV != "DEV"
    ):
        return True, customer_entry, ip_entry
    else:
        return False, customer_entry, ip_entry


def add_to_rate_limit(
    ip_entry: Optional[authentication_models.IPRequestBlacklist],
    customer_entry: authentication_models.CustomerRequestBlacklist,
):
    """
    Increment the count for email and IP
    """
    if ip_entry is not None:
        ip_entry.request_count += 1
        ip_entry.save()
    if customer_entry is not None:
        customer_entry.request_count += 1
        customer_entry.save()
