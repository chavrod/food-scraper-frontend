from django.db import models


class EmailRequestBlacklist(models.Model):
    email = models.EmailField(unique=True)
    request_count = models.IntegerField(default=0)


class IPRequestBlacklist(models.Model):
    ip_address = models.GenericIPAddressField(unique=True)
    request_count = models.IntegerField(default=0)
