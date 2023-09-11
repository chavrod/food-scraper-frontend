from rest_framework import serializers
from dynamic_rest.serializers import DynamicModelSerializer
import core.models as core_models

from rest_framework import serializers


# class UserSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = core_models.User
#         fields = ["id", "name", "email", "password"]
#         extra_kwargs = {"password": {"write_only": True}}

#     def create(self, validated_data):
#         password = validated_data.pop("password", None)
#         instance = self.Meta.model(**validated_data)
#         if password is not None:
#             instance.set_password(password)
#         instance.save()
#         return instance


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
