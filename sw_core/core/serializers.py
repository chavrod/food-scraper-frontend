from rest_framework import serializers
from dynamic_rest.serializers import DynamicModelSerializer
import core.models as core_models


class CachedProductsPageSerializer(DynamicModelSerializer):
    # Define the query and page fields explicitly
    query = serializers.CharField(max_length=30, required=True)
    page = serializers.IntegerField(required=True)

    class Meta:
        model = core_models.CachedProductsPage
        exclude = []

    def to_internal_value(self, data):
        # Restrict the data to only accept 'query' and 'page'
        data = {key: data[key] for key in ["query", "page"] if key in data}

        try:
            internal_value = super().to_internal_value(data)
        except Exception as e:
            print(f"Exception raised during super call: {e}")
            raise e  # re-raise the exception for normal handling

        # Ensure 'page' defaults to 1 if it's less than 1 or not an integer
        try:
            page_value = int(internal_value["page"])
            if page_value != float(data["page"]) or page_value < 1:
                raise ValueError
        except (ValueError, TypeError, KeyError) as e:
            internal_value["page"] = 1
            print(f"Error setting page value: {e}")

        return internal_value
