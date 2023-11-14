from rest_framework import serializers
import core.models as core_models
import authentication.models as authentication_models

from rest_framework import serializers

from django_typomatic import ts_interface, generate_ts

from shop_wiz.settings import ENV


@ts_interface()
class CustomerSerializer(serializers.ModelSerializer):
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
class CachedProductsPageSerializer(serializers.ModelSerializer):
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
class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = core_models.Product
        fields = ["name", "price", "imgSrc", "productUrl", "shop_name"]


@ts_interface()
class BasketItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)

    class Meta:
        model = core_models.BasketItem
        fields = ["product", "quantity"]


@ts_interface()
class BasketSerializer(serializers.ModelSerializer):
    items = BasketItemSerializer(many=True, read_only=True)

    class Meta:
        model = core_models.Basket
        fields = ["id", "items"]


if ENV == "DEV":
    generate_ts("../sw_customer/types/customer_types.ts")
