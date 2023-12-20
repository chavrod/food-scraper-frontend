from rest_framework import serializers
from rest_framework.exceptions import ValidationError

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
class CachedProductsPage(serializers.ModelSerializer):
    query = serializers.CharField(max_length=30, required=True)
    page = serializers.IntegerField(default=1)
    is_relevant_only = serializers.BooleanField(required=True)

    class Meta:
        model = core_models.CachedProductsPage
        exclude = []

    def to_internal_value(self, data):
        # Preprocess the 'page' value first
        try:
            page_value = int(data["page"])
            if page_value != float(data["page"]) or page_value < 1:
                raise ValueError
        except (ValueError, TypeError, KeyError) as e:
            data["page"] = 1
            print(f"Error setting page value: {e}")

        internal_value = super().to_internal_value(data)

        return internal_value


@ts_interface()
class Product(serializers.ModelSerializer):
    class Meta:
        model = core_models.Product
        fields = "__all__"


class ProductCreateOrUpdate(serializers.ModelSerializer):
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
            product, created = core_models.Product.objects.get_or_create(
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
        model = core_models.Product
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
    product = Product(read_only=True)

    class Meta:
        model = core_models.BasketItem
        fields = ["id", "product", "quantity"]


@ts_interface()
class Basket(serializers.ModelSerializer):
    items = BasketItem(many=True, read_only=True)

    class Meta:
        model = core_models.Basket
        fields = ["items"]


if ENV == "DEV":
    generate_ts("../sw_customer/types/customer_types.ts")
