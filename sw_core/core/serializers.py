from rest_framework import serializers
import re
import math

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


class CaseInsensitiveChoiceField(serializers.ChoiceField):
    def to_internal_value(self, data):
        data_lower = str(data).lower()
        for choice, _ in self.choices.items():
            if choice.lower() == data_lower:
                return choice
        return super().to_internal_value(data)


@ts_interface()
class SearchedProductParams(serializers.Serializer):
    query = serializers.CharField(max_length=60, required=True)
    page = serializers.IntegerField(default=1)
    order_by = serializers.CharField(default="price", required=False)
    price_range = serializers.CharField(required=False)
    unit_type = CaseInsensitiveChoiceField(
        choices=core_models.UnitType.choices, required=False
    )
    unit_measurement_range = serializers.CharField(required=False)

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
        if value not in ["price", "-price", "value", "-value"]:
            raise serializers.ValidationError(
                "Order must be 'price', '-price', 'value', or '-value'."
            )
        return value

    # TODO: Abstract to validate_range so it can be reused
    def validate_price_range(self, value):
        """
        Ensure that price_range is a comma-separated string of two numbers and
        the first number is less than or equal to the second.
        """
        parts = value.split(",")
        if len(parts) != 2:
            raise serializers.ValidationError(
                "Price range must consist of two numbers separated by a comma."
            )

        try:
            min_price, max_price = float(parts[0]), float(parts[1])
        except ValueError:
            raise serializers.ValidationError(
                "Both values in price range must be numbers."
            )

        if min_price > max_price:
            raise serializers.ValidationError(
                "The first number in the price range must be less than or equal to the second."
            )

        return value

    def validate_unit_measurement_range(self, value):
        # This validation only makes sense if unit_type is provided, so we check for it
        if "unit_type" not in self.initial_data:
            raise serializers.ValidationError(
                "Unit type must be provided to filter by unit measurement range."
            )

        parts = value.split(",")
        if len(parts) != 2:
            raise serializers.ValidationError(
                "Measurement range must consist of two numbers separated by a comma."
            )

        try:
            min_measurement, max_measurement = float(parts[0]), float(parts[1])
        except ValueError:
            raise serializers.ValidationError(
                "Both values in measurement range must be numbers."
            )

        if min_measurement > max_measurement:
            raise serializers.ValidationError(
                "The first number in the measurement range must be less than or equal to the second."
            )

        return value


@ts_interface()
class SearchedProduct(serializers.Serializer):
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


# @ts_interface()
# class BatchUpload(serializers.Serializer):
#     query = serializers.CharField(max_length=30, required=True, allow_blank=False)
#     upload_date = serializers.DateField()

#     class Meta:
#         model = core_models.BatchUpload
#         exclude = ["id"]


@ts_interface()
class SearchedProductAvailableUnitRangesInfo(serializers.Serializer):
    name = serializers.ChoiceField(
        allow_blank=False, choices=core_models.UnitType.choices
    )
    count = serializers.IntegerField()
    min = serializers.FloatField()
    max = serializers.FloatField()
    min_selected = serializers.FloatField(allow_null=True)
    max_selected = serializers.FloatField(allow_null=True)

    @staticmethod
    def round_up_to_1_decimal(value):
        """Always round up the value to 1 decimal place."""
        return math.ceil(value * 10) / 10

    @staticmethod
    def round_down_to_1_decimal(value):
        """Round down the value to 1 decimal place."""
        return math.floor(value * 10) / 10

    def to_representation(self, instance):
        ret = super().to_representation(instance)

        # Define the fields to apply rounding
        rounding_fields = ["min", "max", "min_selected", "max_selected"]

        # Apply rounding logic based on unit type and field name
        for field in rounding_fields:
            if (
                ret.get(field) is not None
            ):  # Check if the field value exists and is not None
                if ret["name"] in [core_models.UnitType.KG, core_models.UnitType.L]:
                    if "min" in field:
                        # For KG or L and 'min' fields, round down to 1 decimal place
                        ret[field] = self.round_down_to_1_decimal(ret[field])
                    else:
                        # For KG or L and 'max' fields, round up to 1 decimal place
                        ret[field] = self.round_up_to_1_decimal(ret[field])
                else:
                    if "min" in field:
                        # For other unit types and 'min' fields, round down to the nearest whole number
                        ret[field] = math.floor(ret[field])
                    else:
                        # For other unit types and 'max' fields, round up to the nearest whole number
                        ret[field] = math.ceil(ret[field])
        return ret


@ts_interface()
class SearchedProductPriceRangeInfo(serializers.Serializer):
    name = serializers.CharField(max_length=50)
    min = serializers.FloatField()
    max = serializers.FloatField()
    min_selected = serializers.FloatField(allow_null=True)
    max_selected = serializers.FloatField(allow_null=True)

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret["min"] = math.floor(ret["min"])
        ret["max"] = math.ceil(ret["max"])
        return ret


@ts_interface()
class SearchedProductMetadata(serializers.Serializer):
    query = serializers.CharField(max_length=60, required=True)
    is_full_metadata = serializers.BooleanField(required=True)
    is_update_needed = serializers.BooleanField(required=True)
    update_date = serializers.DateField(allow_null=True)
    page = serializers.IntegerField()
    total_pages = serializers.IntegerField()
    order_by = serializers.CharField()
    total_results = serializers.IntegerField()
    active_unit = serializers.ChoiceField(
        choices=core_models.UnitType.choices, allow_null=True
    )
    units_range_list = serializers.ListField(
        child=SearchedProductAvailableUnitRangesInfo()
    )
    price_range_info = SearchedProductPriceRangeInfo()
    filter_count = serializers.IntegerField()


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
class BasketItemParams(serializers.Serializer):
    page = serializers.IntegerField(default=1)
    shop = CaseInsensitiveChoiceField(
        choices=core_models.ShopName.choices, required=False
    )


@ts_interface()
class BasketItem(serializers.Serializer):
    id = serializers.IntegerField(required=True)
    product = BasketProduct(required=True)
    quantity = serializers.IntegerField(required=True)
    checked = serializers.BooleanField(required=True)

    class Meta:
        model = core_models.BasketItem
        exclude = []


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
