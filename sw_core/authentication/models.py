from django.db import models

import core.models as core_models


class BlacklistActions(models.TextChoices):
    VALIDATE_EMAIL = "VALIDATE_EMAIL", "Validate Email"
    RESET_PASSWORD = "RESET_PASSWORD", "Reset Password"


class CustomerRequestBlacklist(models.Model):
    customer = models.ForeignKey(core_models.Customer, on_delete=models.CASCADE)
    action = models.CharField(max_length=50, choices=BlacklistActions.choices)
    request_count = models.IntegerField(default=0)

    def __str__(self) -> str:
        return f"{self.customer.user.email}: {self.request_count} ({self.get_action_display()})"


class IPRequestBlacklist(models.Model):
    ip_address = models.GenericIPAddressField()
    action = models.CharField(max_length=50, choices=BlacklistActions.choices)
    request_count = models.IntegerField(default=0)

    def __str__(self) -> str:
        return f"{self.ip_address}: {self.request_count} ({self.get_action_display()})"
