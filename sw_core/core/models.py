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
    ALL = "ALL"


class ShopPageCount(models.IntegerChoices):
    ALDI = 36
    TESCO_SHORT = 24
    TESCO_LONG = 48
    SUPERVALU = 30


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


class Product(models.Model):
    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=100, decimal_places=2)
    img_src = models.URLField(blank=True, null=True)
    product_url = models.URLField(blank=True, null=True)
    shop_name = models.CharField(max_length=50, choices=ShopName.choices)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} for {self.price}"


class Basket(models.Model):
    customer = models.OneToOneField(
        Customer, on_delete=models.CASCADE, related_name="basket"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.customer.user.username}'s Basket"


class BasketItem(models.Model):
    basket = models.ForeignKey(Basket, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1, validators=[MinValueValidator(1)])

    def __str__(self):
        return f"{self.quantity} x {self.product.name}"
