from django.db import models, transaction
from django.core.validators import MinValueValidator
from django.conf import settings


class Customer(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    phone_number = models.CharField(max_length=15, blank=True, null=True)

    def __str__(self):
        return self.user.username


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


# All products are sorted in ascending order
class CachedProductsPage(models.Model):
    query = models.CharField(max_length=30)
    page = models.IntegerField(validators=[MinValueValidator(1)])
    results = models.JSONField(default=list)
    is_relevant_only = models.BooleanField()
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["query"]

    def __str__(self) -> str:
        return f"{self.query}: {self.page} page"


class ScrapeSummaryTotal(models.Model):
    query = models.CharField(max_length=30)
    is_relevant_only = models.BooleanField()
    total_results_count = models.IntegerField(validators=[MinValueValidator(0)])
    total_execution_time = models.DecimalField(max_digits=10, decimal_places=2)
    created = models.DateTimeField(auto_now_add=True)


class ScrapeSummaryPerShop(models.Model):
    shop = models.CharField(max_length=30, choices=ShopName.choices)
    results_count = models.IntegerField(validators=[MinValueValidator(0)])
    execution_time = models.DecimalField(max_digits=10, decimal_places=2)
    created = models.DateTimeField(auto_now_add=True)
    summary_total = models.ForeignKey(
        ScrapeSummaryTotal, on_delete=models.CASCADE, related_name="shop_summaries"
    )
