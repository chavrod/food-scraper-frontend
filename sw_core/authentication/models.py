from django.db import models

import core.models as core_models


class CustomerRequestBlacklist(models.Model):
    customer = models.OneToOneField(core_models.Customer, on_delete=models.CASCADE)
    request_count = models.IntegerField(default=0)

    def __str__(self) -> str:
        return f"{self.email}: {self.request_count}"


class IPRequestBlacklist(models.Model):
    ip_address = models.GenericIPAddressField(unique=True)
    request_count = models.IntegerField(default=0)

    def __str__(self) -> str:
        return f"{self.ip_address}: {self.request_count}"
