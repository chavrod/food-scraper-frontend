import django_filters

import core.models as core_models


class SearchedProductFilter(django_filters.FilterSet):
    price_ordering = django_filters.OrderingFilter(
        # tuple-mapping retains order
        fields=(("price", "price"),),
        # labels do not need to retain order
        field_labels={
            "price": "Price",
        },
    )

    class Meta:
        model = core_models.SearchedProduct
        fields = ["price"]
