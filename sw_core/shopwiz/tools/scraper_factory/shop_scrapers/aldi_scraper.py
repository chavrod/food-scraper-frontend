import re
import math
import time

from playwright.sync_api import sync_playwright, Page

from shopwiz.apps.core.models import ShopName, ShopPageCount
from shopwiz.apps.core.serializers import SearchedProductSerialiser
from .shop_scraper import ShopScraper
from . import util as scraper_util


class AldiScraper(ShopScraper):
    def __init__(self):
        self.shop_name = ShopName.ALDI
        self.start_time = 0
        self.products = []
        self.total_number_of_items = 0
        self.total_number_of_pages = 0
        self.current_page = 1
        self.items_per_page = ShopPageCount.ALDI

    def _build_url(self, query: str, is_relevant_only: bool):
        if is_relevant_only:
            return f"https://groceries.aldi.ie/en-GB/Search?keywords={query}"
        else:
            return f"https://groceries.aldi.ie/en-GB/Search?keywords={query}&sortBy=DisplayPrice&sortDirection=asc&page={self.current_page}"

    def get_products(self, query: str, is_relevant_only: bool):
        self.start_time = time.time()
        with sync_playwright() as p:
            try:
                browser = p.chromium.launch()
                context = browser.new_context(
                    user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36"
                )

                page: Page = context.new_page()

                while True:
                    page.goto(self._build_url(query, is_relevant_only))

                    # Check if anything was found was this search
                    total_number_of_items_element = page.query_selector(
                        "div#vueSearchSummary"
                    )
                    total_number_of_items_attribute = (
                        total_number_of_items_element.get_attribute("data-totalcount")
                    )
                    total_number_of_items = (
                        int(total_number_of_items_attribute)
                        if total_number_of_items_attribute
                        else 0
                    )
                    if total_number_of_items == 0:
                        break

                    page.wait_for_selector('[data-qa="search-results"]')

                    if not is_relevant_only and self.total_number_of_pages:
                        self.total_number_of_items = self._get_number_of_pages(page)

                    self._parse_page(page, query)

                    self.current_page += 1

                    if (
                        is_relevant_only
                        or self.current_page > self.total_number_of_pages
                    ):
                        break

            except (AssertionError, Exception) as e:
                print(f"Error fetching and parsing data from Aldi: {e}")
            finally:
                browser.close()
                return self._format_result()

    def _get_number_of_pages(self, page: Page):
        total_number_of_items_element = page.query_selector("div#vueSearchSummary")
        total_number_of_items_attribute = total_number_of_items_element.get_attribute(
            "data-totalcount"
        )
        total_number_of_items = (
            int(total_number_of_items_attribute)
            if total_number_of_items_attribute
            else 0
        )
        assert (
            total_number_of_items != 0
        ), "AssertionError: No items found for the given query"

        return math.ceil(total_number_of_items / self.items_per_page)

    def _parse_page(self, page: Page, query: str):
        rows = page.query_selector_all('[data-qa="search-results"]')

        for prod in rows:
            product = {
                "query": query,
                "name": "",
                "price": 0,
                "price_per_unit": 0,
                "unit_type": "",
                "unit_measurment": 0,
                "img_src": None,
                "product_url": None,
                "shop_name": self.shop_name,
            }

            # Extracting elements
            name_element = prod.query_selector('[data-qa="search-product-title"]')
            price_element = prod.query_selector(".product-tile-price .h4 span")
            price_per_unit_element = prod.query_selector(
                '[data-qa="product-price"] > span'
            )
            image_element = prod.query_selector("img")

            # Extracting relevant data
            product["name"] = name_element.text_content() or ""

            # Get the product price
            price_text = price_element.text_content()
            price_match = re.search(r"(\d+\.\d+)", price_text)
            product["price"] = (
                round(float(price_match.group(1)), 2) if price_match else 0
            )

            # Get unit_type and price_per_unit
            if price_per_unit_element:
                price_per_unit_text = (
                    price_per_unit_element.text_content().strip() or ""
                )
                parts = price_per_unit_text.split("per")

                unit_type, price_per_unit, unit_measurement = (
                    scraper_util.get_unit_data(parts, product["price"])
                )

                product["unit_type"] = unit_type
                product["price_per_unit"] = price_per_unit
                product["unit_measurement"] = unit_measurement

            product["img_src"] = image_element.get_attribute("src") or None

            # Get the link to the product
            internal_url_path_el = prod.query_selector("a")
            if internal_url_path_el:
                internal_url_path = internal_url_path_el.get_attribute("href")
                if internal_url_path:
                    full_url = "https://groceries.aldi.ie" + internal_url_path
                    product["product_url"] = full_url

            # Create an instance of the serializer with the product data
            serializer = SearchedProductSerialiser(data=product)
            if serializer.is_valid():
                self.products.append(serializer.validated_data)
            else:
                print(f"Invalid product data: {serializer.errors}")

    def _format_result(self):
        end_time = time.time()
        elapsed_time = end_time - self.start_time

        return {
            "products": self.products,
            "summaryPerShop": {
                "count": len(self.products),
                "exec_time": elapsed_time,
                "shop_name": self.shop_name,
            },
        }
