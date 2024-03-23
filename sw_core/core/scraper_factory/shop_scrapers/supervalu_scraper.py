import re
import math
import time

from playwright.sync_api import sync_playwright, Page

from .shop_scraper import ShopScraper
import core.models as core_models
import core.serializers as core_serializers


class SuperValuScraper(ShopScraper):
    def __init__(self):
        self.shop_name = core_models.ShopName.SUPERVALU
        self.start_time = 0
        self.products = []
        self.total_number_of_items = 0
        self.total_number_of_pages = 0
        self.current_page = 1
        self.skip_index = 0
        self.items_per_page = core_models.ShopPageCount.SUPERVALU

    def _build_url(self, query: str, is_relevant_only: bool):
        if is_relevant_only:
            return f"https://shop.supervalu.ie/sm/delivery/rsid/5550/results?q={query}"
        else:
            return f"https://shop.supervalu.ie/sm/delivery/rsid/5550/results?q={query}&sort=price&page={self.current_page}&skip={self.skip_index}"

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

                    page.wait_for_selector('[class^="Listing"]')

                    if not is_relevant_only and self.total_number_of_pages:
                        self.total_number_of_items = self._get_number_of_pages(page)

                    self._parse_page(page, query)

                    self.current_page += 1
                    self.skip_index += self.items_per_page
                    if (
                        is_relevant_only
                        or self.current_page > self.total_number_of_pages
                    ):
                        break

            except (AssertionError, Exception) as e:
                print(f"Error fetching and parsing data from SuperValu: {e}")
            finally:
                browser.close()
                return self._format_result()

    def _get_number_of_pages(self, page: Page):
        total_items_element = page.query_selector('h4[class^="Subtitle"]')
        total_items_text = (
            total_items_element.text_content() if total_items_element else None
        )
        match = re.search(r"(\d+)", total_items_text) if total_items_text else None
        total_number_of_items = int(match.group(1)) if match else 0
        assert (
            total_number_of_items != 0
        ), "AssertionError: No items found for the given query"

        return math.ceil(total_number_of_items / self.items_per_page)

    def _parse_page(self, page: Page, query: str):
        rows = page.query_selector_all('[class^="ColListing"]')

        for prod in rows:
            product = {
                "query": query,
                "name": "",
                "price": 0,
                "img_src": None,
                "product_url": None,
                "shop_name": self.shop_name,
            }

            name_element = prod.query_selector('span[class^="ProductCardTitle"] > div')
            price_element = prod.query_selector(
                '[class^="ProductCardPricing"] > span > span'
            )
            image_element = prod.query_selector(
                '[class^="ProductCardImageWrapper"] > div > img'
            )

            product["name"] = (
                name_element.text_content().strip() if name_element else ""
            )

            price_text = price_element.text_content() if price_element else None

            # Extracting the float value from the price text
            match = re.search(r"(\d+\.\d+)", price_text) if price_text else None
            product["price"] = round(float(match.group(1)), 2) if match else 0

            product["img_src"] = (
                image_element.get_attribute("src") if image_element else None
            )

            # Get the link to the product
            internal_url_path_el = prod.query_selector("a")
            if internal_url_path_el:
                internal_url_path = internal_url_path_el.get_attribute("href")
                if internal_url_path:
                    product["product_url"] = internal_url_path

            # Create an instance of the serializer with the product data
            serializer = core_serializers.SearchedProduct(data=product)
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
