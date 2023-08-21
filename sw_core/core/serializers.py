from rest_framework import serializers
from dynamic_rest.serializers import DynamicModelSerializer
import core.models as core_models


class CachedProductsPageSerializer(DynamicModelSerializer):
    query = serializers.CharField(max_length=30, required=True)
    page = serializers.IntegerField(default=1)
    is_relevant_only = serializers.BooleanField(required=True)

    class Meta:
        model = core_models.CachedProductsPage
        exclude = []

    def to_internal_value(self, data):
        is_relevant_only_str = data.get("is_relevant_only", "").lower()
        data["is_relevant_only"] = is_relevant_only_str == "true"

        internal_value = super().to_internal_value(data)

        # Ensure 'page' defaults to 1 if it's less than 1 or not an integer
        try:
            page_value = int(internal_value["page"])
            if page_value != float(data["page"]) or page_value < 1:
                raise ValueError
        except (ValueError, TypeError, KeyError) as e:
            internal_value["page"] = 1
            print(f"Error setting page value: {e}")

        return internal_value
