from rest_framework import serializers
import re

from django_typomatic import ts_interface, generate_ts

from shop_wiz.settings import ENV
import core.models as core_models
import authentication.models as authentication_models


@ts_interface()
class Customer(serializers.ModelSerializer):
    password_reset_attempts = serializers.SerializerMethodField()

    class Meta:
        model = core_models.Customer
        fields = "__all__"

    def get_password_reset_attempts(self, obj):
        try:
            # Specifically filter by the RESET_PASSWORD action
            return authentication_models.CustomerRequestBlacklist.objects.get(
                customer=obj,
                action=authentication_models.BlacklistActions.RESET_PASSWORD,
            ).request_count
        except authentication_models.CustomerRequestBlacklist.DoesNotExist:
            return 0


@ts_interface()
class SearchParams(serializers.Serializer):
    query = serializers.CharField(max_length=30, required=True)
    page = serializers.IntegerField(default=1)
    order_by = serializers.CharField(default="price", required=False)

    def validate_query(self, value):
        """
        Trim whitespaces, replace multiple spaces with a single space, and convert to lowercase.
        """
        # Remove leading and trailing whitespaces, replace multiple spaces with one, and convert to lowercase
        cleaned_query = re.sub(r"\s+", " ", value.strip()).lower()

        # Additional validation logic if needed
        if not cleaned_query:
            raise serializers.ValidationError("Query cannot be empty.")

        return cleaned_query

    def validate_order_by(self, value):
        # Validate the order field to ensure it's one of the acceptable options
        if value not in ["price", "-price", "price_per_unit", "-price_per_unit"]:
            raise serializers.ValidationError(
                "Order must be 'price', '-price', 'price_per_unit', or '-price_per_unit'."
            )
        return value


@ts_interface()
class SearchedProduct(serializers.Serializer):
    query = serializers.CharField(max_length=30, required=True, allow_blank=False)
    name = serializers.CharField(required=True, allow_blank=False)
    price = serializers.FloatField(required=True)
    price_per_unit = serializers.FloatField(required=True)
    unit_type = serializers.ChoiceField(
        required=True, allow_blank=False, choices=core_models.UnitType.choices
    )
    unit_measurement = serializers.FloatField(required=True)
    img_src = serializers.CharField(required=True, allow_null=True)
    product_url = serializers.CharField(required=True, allow_null=True)
    shop_name = serializers.ChoiceField(
        required=True, allow_blank=False, choices=core_models.ShopName.choices
    )

    def validate_price(self, value):
        if value <= 0:
            raise serializers.ValidationError("Price must be greater than 0")
        return value

    class Meta:
        model = core_models.SearchedProduct
        exclude = ["id"]


@ts_interface()
class SearchedProductMetadata(serializers.Serializer):
    page = serializers.IntegerField()
    total_pages = serializers.IntegerField()
    order_by = serializers.CharField()
    total_results = serializers.IntegerField()


@ts_interface()
class ScrapeStatsForCustomer(serializers.Serializer):
    average_time_seconds = serializers.DecimalField(
        max_digits=100, decimal_places=0, coerce_to_string=False
    )


@ts_interface()
class BasketProduct(serializers.ModelSerializer):
    class Meta:
        model = core_models.BasketProduct
        fields = "__all__"


class BasketProductCreateOrUpdate(serializers.ModelSerializer):
    name = serializers.CharField(trim_whitespace=True, required=False)

    def validate(self, attrs):
        name = attrs.get("name")
        price = attrs.get("price")
        img_src = attrs.get("img_src")
        product_url = attrs.get("product_url")
        shop_name = attrs.get("shop_name")

        if not all([price, img_src, product_url, shop_name]):
            raise serializers.ValidationError(
                {
                    "error": "All fields 'name', 'price', 'img_src', 'product_url', 'shop_name' must be provided together"
                }
            )

        return attrs

    def create(self, validated_data):
        name = validated_data.get("name")
        shop_name = validated_data.get("shop_name")

        if name and shop_name:
            product, created = core_models.BasketProduct.objects.get_or_create(
                name=name, shop_name=shop_name, defaults=validated_data
            )
            if not created:
                # Update product if already exists
                for key, value in validated_data.items():
                    setattr(product, key, value)
                product.save()
            return product
        else:
            raise serializers.ValidationError(
                "Must provide product id or name and shop_name"
            )

    class Meta:
        model = core_models.BasketProduct
        fields = ["name", "price", "img_src", "product_url", "shop_name"]
        extra_kwargs = {
            "name": {"required": False},
            "price": {"required": False},
            "img_src": {"required": False},
            "product_url": {"required": False},
            "shop_name": {"required": False},
        }


@ts_interface()
class BasketItem(serializers.ModelSerializer):
    product = BasketProduct(read_only=True)

    class Meta:
        model = core_models.BasketItem
        fields = ["id", "product", "quantity"]


@ts_interface()
class BasketItemShopBreakdown(serializers.Serializer):
    name = serializers.ChoiceField(
        source="product__shop_name", choices=core_models.ShopName.choices
    )
    total_price = serializers.DecimalField(
        max_digits=100, decimal_places=2, coerce_to_string=False
    )
    total_quantity = serializers.IntegerField()


@ts_interface()
class BasketItemMetadata(serializers.Serializer):
    total_items = serializers.IntegerField()
    total_quantity = serializers.IntegerField()
    total_price = serializers.DecimalField(
        max_digits=100, decimal_places=2, coerce_to_string=False
    )
    shop_breakdown = BasketItemShopBreakdown(many=True)
    page = serializers.IntegerField()
    total_pages = serializers.IntegerField()
    selected_shop = serializers.ChoiceField(choices=core_models.ShopName.choices)


@ts_interface()
class Basket(serializers.ModelSerializer):
    items = BasketItem(many=True, read_only=True)

    class Meta:
        model = core_models.Basket
        fields = ["items"]


if ENV == "DEV":
    generate_ts("../sw_customer/types/customer_types.ts")
