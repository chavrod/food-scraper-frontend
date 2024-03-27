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


class UnitType(models.TextChoices):
    KG = "KG"
    L = "L"
    M = "M"
    EACH = "EACH"
    HUNDRED_SHEETS = "HUNDRED_SHEETS"
    M2 = "M2"


class SearchedProduct(models.Model):
    query = models.CharField(max_length=30)
    name = models.CharField(max_length=300)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    price_per_unit = models.DecimalField(max_digits=10, decimal_places=2)
    unit_type = models.CharField(max_length=50, choices=UnitType.choices)
    unit_measurement = models.FloatField()
    img_src = models.URLField(null=True)
    product_url = models.URLField(null=True)
    shop_name = models.CharField(max_length=300, choices=ShopName.choices)
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.CheckConstraint(check=models.Q(price__gt=0), name="price_gt_0"),
            models.CheckConstraint(
                check=models.Q(price_per_unit__gt=0), name="price_per_unit_gt_0"
            ),
            models.CheckConstraint(
                check=~models.Q(unit_type=""), name="unit_type_not_empty"
            ),
            models.CheckConstraint(
                check=models.Q(unit_measurement__gt=0), name="unit_measurement_gt_0"
            ),
            models.CheckConstraint(check=~models.Q(name=""), name="name_not_empty"),
            models.CheckConstraint(check=~models.Q(query=""), name="query_not_empty"),
            models.CheckConstraint(
                check=~models.Q(shop_name=""), name="shop_name_not_empty"
            ),
        ]

    def __str__(self) -> str:
        return f"{self.query}: {self.name} ({self.created})"


class BasketProduct(models.Model):
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
    product = models.ForeignKey(BasketProduct, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1, validators=[MinValueValidator(1)])

    def __str__(self):
        return f"{self.quantity} x {self.product.name}"
