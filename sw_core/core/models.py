from django.db import models, transaction
from django.core.validators import MinValueValidator

# Create your models here.


class ShopName(models.TextChoices):
    ALDI = "ALDI"
    TESCO = "TESCO"
    SUPERVALU = "SUPERVALU"


class ShopPageCount(models.IntegerChoices):
    ALDI = 36
    TESCO_SHORT = 24
    TESCO_LONG = 48
    SUPERVALU = 30


class CachedRelevantProduct(models.Model):
    name = models.CharField(max_length=100)
    shop = models.CharField(max_length=30, choices=ShopName.choices)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    image_url = models.URLField(blank=True, null=True)

    def __str__(self) -> str:
        return f"{self.shop}: {self.name} {self.price}"


class CachedAllProduct(models.Model):
    name = models.CharField(max_length=100)
    shop = models.CharField(max_length=30, choices=ShopName.choices)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    image_url = models.URLField(blank=True, null=True)

    def __str__(self) -> str:
        return f"{self.shop}: {self.name} {self.price}"


class CachedProductsPage(models.Model):
    query = models.CharField(max_length=30)
    page = models.IntegerField(validators=[MinValueValidator(1)])
    results = models.JSONField(default=dict)
    is_relevant_only = models.BooleanField(default=True)
    is_ascending = models.BooleanField(default=True)
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["query"]

    def __str__(self) -> str:
        return f"{self.query}: {self.page} page"
