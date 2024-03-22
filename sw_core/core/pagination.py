from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class BasketItemsPagination(PageNumberPagination):
    page_size = 10
    max_page_size = 10


class SearchedProductsPagination(PageNumberPagination):
    page_size = 24
    max_page_size = 24
