from rest_framework import serializers
from dynamic_rest.serializers import DynamicModelSerializer
import core.models as core_models
import authentication.models as auth_models

from rest_framework import serializers


class CustomerSerializer(serializers.ModelSerializer):
    email_resend_attempts = serializers.SerializerMethodField()

    class Meta:
        model = core_models.Customer
        fields = "__all__"

    def get_email_resend_attempts(self, obj):
        try:
            return auth_models.CustomerRequestBlacklist.objects.get(
                customer=obj
            ).request_count
        except auth_models.CustomerRequestBlacklist.DoesNotExist:
            return 0


class CachedProductsPageSerializer(DynamicModelSerializer):
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
