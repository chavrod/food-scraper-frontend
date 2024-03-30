import django_filters

import core.models as core_models


class NumberRangeFilter(django_filters.BaseRangeFilter, django_filters.NumberFilter):
    pass


class SearchedProductFilter(django_filters.FilterSet):
    price_range = NumberRangeFilter(field_name="price", lookup_expr="range")
    unit_measurement_range = NumberRangeFilter(
        field_name="unit_measurement", lookup_expr="range"
    )
    unit_type = django_filters.CharFilter(field_name="unit_type", lookup_expr="exact")
    order_by = django_filters.OrderingFilter(
        fields=(("price", "price"), ("price_per_unit", "value")),
    )

    class Meta:
        model = core_models.SearchedProduct
        fields = ["price"]


# http://127.0.0.1:3000/?query=chicken&unit_type=KG&unit_measurement_range=0.2,0.25
