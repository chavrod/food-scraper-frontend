from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from django.db.models import Sum, FloatField


class BasketItemsPagination(PageNumberPagination):
    page_size = 2
    max_page_size = 2
    page_size_query_param = "page_size"

    def paginate_queryset(self, queryset, request, view=None):
        # Ensure that page number defaults to 1 if not specified
        page_number = request.query_params.get(self.page_query_param, 1)
        self.page = self.paginator.paginate_queryset(queryset, request, view=view)
        return self.page

    def get_paginated_response(self, data):
        basket_items = self.request.user.customer.basket.items.all()

        # Group by shop name and aggregate total quantity and price
        shop_breakdown = basket_items.values("product__shop_name").annotate(
            total_quantity=Sum("quantity"),
            total_price=Sum("total_price", output_field=FloatField()),
        )

        # Calculating the total quantity and price across all items
        total_quantity_all = (
            basket_items.aggregate(total_quantity_all=Sum("quantity"))[
                "total_quantity_all"
            ]
            or 0
        )
        total_price_all = (
            basket_items.aggregate(total_price_all=Sum("total_price"))[
                "total_price_all"
            ]
            or 0
        )

        return Response(
            {
                "next": self.get_next_link(),
                "previous": self.get_previous_link(),
                "count": self.page.paginator.count,
                "results": data,
                "metadata": {
                    "total_quantity": total_quantity_all,
                    "total_price": total_price_all,
                    "shop_breakdown": shop_breakdown,
                },
            }
        )
