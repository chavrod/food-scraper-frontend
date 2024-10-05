import json
from typing import Union, Optional


from config.settings import EMAIL_RESEND_LIMIT, ENV
from shopwiz.apps.users.models import (
    BlacklistActions,
    CustomerRequestBlacklist,
    IPRequestBlacklist,
)


def _get_client_ip(request):
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        ip = x_forwarded_for.split(",")[0]
        return ip
    ip = request.META.get("REMOTE_ADDR")
    if ip:
        return ip
    return None


def check_rate_limit(request, customer, action: BlacklistActions):
    """
    Check if the email or IP exceeded the rate limit.
    Returns a tuple: (is_rate_limited, email_entry, ip_entry)
    """
    # Assert that the provided action is valid
    assert action in BlacklistActions.values, f"Invalid action: {action}"

    client_ip = _get_client_ip(request)

    # Get or create relevant records
    (
        customer_entry,
        _,
    ) = CustomerRequestBlacklist.objects.get_or_create(customer=customer, action=action)
    if client_ip:
        (
            ip_entry,
            _,
        ) = IPRequestBlacklist.objects.get_or_create(
            ip_address=client_ip, action=action
        )

    if customer_entry.request_count >= EMAIL_RESEND_LIMIT or (
        ip_entry.request_count >= EMAIL_RESEND_LIMIT and ENV != "DEV"
    ):
        return True, customer_entry, ip_entry
    else:
        return False, customer_entry, ip_entry


def add_to_rate_limit(
    ip_entry: Optional[IPRequestBlacklist],
    customer_entry: CustomerRequestBlacklist,
):
    """
    Increment the count for email and IP entries
    """
    if ip_entry is not None:
        ip_entry.request_count += 1
        ip_entry.save()
    if customer_entry is not None:
        customer_entry.request_count += 1
        customer_entry.save()
