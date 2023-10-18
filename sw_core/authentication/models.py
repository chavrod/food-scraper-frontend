from django.db import models


class EmailRequestBlacklist(models.Model):
    email = models.EmailField(unique=True)
    request_count = models.IntegerField(default=0)

    def __str__(self) -> str:
        return f"{self.email}: {self.request_count}"


class IPRequestBlacklist(models.Model):
    ip_address = models.GenericIPAddressField(unique=True)
    request_count = models.IntegerField(default=0)

    def __str__(self) -> str:
        return f"{self.ip_address}: {self.request_count}"
