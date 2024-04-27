from datetime import timedelta
from collections import OrderedDict

from django.db import models
from django.core.validators import MinValueValidator
from django.conf import settings
from django.utils import timezone
from django.db.models import (
    Sum,
    F,
    Value,
    IntegerField,
    DecimalField,
    Min,
    Max,
    QuerySet,
    Count,
)

from shop_wiz.settings import RESULTS_EXPIRY_DAYS


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
    M2 = "M2"
    EACH = "EACH"
    HUNDRED_SHEETS = "HUNDRED_SHEETS"


class SearchedProductQuerySet(models.QuerySet):
    def recent_products(self, query):
        filter_created_date = timezone.now() - timedelta(days=RESULTS_EXPIRY_DAYS)
        return self.filter(query=query, created__gte=filter_created_date)


class SearchedProductManager(models.Manager):
    def get_queryset(self):
        return SearchedProductQuerySet(self.model)

    def get_selected_price_range_info(self, all_recent_products, selected_price_range):
        price_ranges = all_recent_products.aggregate(Min("price"), Max("price"))
        min_selected_price, max_selected_price = None, None
        if selected_price_range:
            parts = selected_price_range.split(",")
            min_selected_price, max_selected_price = float(parts[0]), float(parts[1])
        return {
            "name": "euros",
            "min": round(price_ranges["price__min"], 2),
            "max": round(price_ranges["price__max"], 2),
            "min_selected": min_selected_price,
            "max_selected": max_selected_price,
        }

    def get_selected_unit_range_info_list(
        self, all_recent_products, selected_unit_type, selected_unit_range
    ):
        # Pre-populate an ordered dictionary with placeholders for each unit type
        ordered_unit_type_values = [unit_type.value for unit_type in UnitType]
        ordered_unit_range_info_dict = OrderedDict(
            (unit_type, None) for unit_type in ordered_unit_type_values
        )
        # Get unit types present in recent_products
        unit_types_present = (
            all_recent_products.values("unit_type")
            .annotate(total=Count("id"))
            .order_by()
        )
        # Loop through each unit_type and calculate the min and max unit_measurement values
        for entry in unit_types_present:
            unit_type = entry["unit_type"]
            unit_type_products = all_recent_products.filter(unit_type=unit_type)
            ranges = unit_type_products.aggregate(Max("unit_measurement"))
            unit_range_info = {
                "name": unit_type,
                "count": entry["total"],
                "min": 0,
                "max": round(ranges["unit_measurement__max"], 2),
                "min_selected": None,
                "max_selected": None,
            }
            # If this unit_type is the selected type, add the selected ranges
            if unit_type == selected_unit_type:
                min_selected = 0
                max_selected = round(ranges["unit_measurement__max"], 2)
                if selected_unit_range:
                    parts = selected_unit_range.split(",")
                    min_selected, max_selected = float(parts[0]), float(parts[1])
                unit_range_info["min_selected"] = min_selected
                unit_range_info["max_selected"] = max_selected

            # Update the placeholder in the ordered dictionary with actual data
            if unit_type in ordered_unit_range_info_dict:
                ordered_unit_range_info_dict[unit_type] = unit_range_info

        # Convert the dictionary back to a list, filtering out placeholders
        total_unit_range_info_list = [
            info for info in ordered_unit_range_info_dict.values() if info is not None
        ]
        return total_unit_range_info_list

    def count_filters(
        self, price_range_info, active_unit, total_unit_range_info_list
    ) -> int:
        filter_count = 0
        # Condition 1: In "price_range_info", check if "min" != "min_selected" or "max" != "max_selected"
        if (
            price_range_info["min_selected"] is not None
            and price_range_info["max_selected"] is not None
        ):
            if (
                price_range_info["min_selected"] != 0
                or price_range_info["max"] > price_range_info["max_selected"]
            ):
                print(price_range_info["min"], price_range_info["min_selected"])
                print(price_range_info["max"], price_range_info["max_selected"])
                filter_count += 1

        # Condition 2: Check if "active_unit" is not None
        if active_unit:
            filter_count += 1

            for unit_info in total_unit_range_info_list:
                if unit_info["name"] == active_unit:
                    min_selected = unit_info.get("min_selected")
                    max_selected = unit_info.get("max_selected")
                    if min_selected is not None and max_selected is not None:
                        if min_selected != 0 or unit_info["max"] > max_selected:
                            filter_count += 1
                            break  # Since we found the active unit and checked it, we can break the loop

        return filter_count


class SearchedProduct(models.Model):
    objects = SearchedProductManager()

    query = models.CharField(max_length=30)
    name = models.CharField(max_length=300)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    price_per_unit = models.DecimalField(max_digits=10, decimal_places=2)
    unit_type = models.CharField(max_length=50, choices=UnitType.choices)
    unit_measurement = models.DecimalField(max_digits=10, decimal_places=3)
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
        return f"{self.query}: {self.price} for {self.unit_measurement} {self.unit_type} ({self.price_per_unit}) {self.name} - {self.created}"


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
