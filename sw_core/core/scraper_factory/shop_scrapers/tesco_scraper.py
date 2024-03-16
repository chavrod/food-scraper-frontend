import re
import math
import time

from playwright.sync_api import sync_playwright, Page

from .shop_scraper import ShopScraper
import core.models as core_models


class TescoScraper(ShopScraper):
    def __init__(self):
        self.shop_name = core_models.ShopName.TESCO
        self.start_time = 0
        self.products = []
        self.total_number_of_items = 0
        self.total_number_of_pages = 0
        self.current_page = 1
        self.items_per_page = core_models.ShopPageCount.TESCO_LONG

    def _build_url(self, query: str, is_relevant_only: bool):
        if is_relevant_only:
            return f"https://www.tesco.ie/groceries/en-IE/search?query={query}&count={self.items_per_page}"
        else:
            return f"https://www.tesco.ie/groceries/en-IE/search?query={query}&sortBy=price-ascending&page={self.current_page}&count={self.items_per_page}"

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

                    page.wait_for_selector(".product-list-container")

                    if not is_relevant_only and self.total_number_of_pages:
                        self.total_number_of_items = self._get_number_of_pages(page)

                    self._parse_page(page)

                    self.current_page += 1
                    if (
                        is_relevant_only
                        or self.current_page > self.total_number_of_pages
                    ):
                        break

            except (AssertionError, Exception) as e:
                print(f"Error fetching and parsing data from Tesco: {e}")
            finally:
                browser.close()
                return self._format_result()

    def _get_number_of_pages(self, page: Page):
        strong_element_with_total_count = page.query_selector(
            "div.pagination__items-displayed > strong:nth-child(2)"
        )

        if strong_element_with_total_count:
            # Get the text content from the element
            text_content_with_total_count = (
                strong_element_with_total_count.text_content()
            )

            # Use regular expression to extract the number
            match = re.search(r"(\d+)", text_content_with_total_count)
            total_number_of_items = int(match.group(1)) if match else 0
        else:
            total_number_of_items = 0
        assert (
            total_number_of_items != 0
        ), "AssertionError: No items found for the given query"

        return math.ceil(total_number_of_items / self.items_per_page)

    def _parse_page(self, page: Page):
        rows = page.query_selector_all("li.product-list--list-item")

        for prod in rows:
            product = {
                "name": "",
                "price": 0,
                "img_src": None,
                "product_url": None,
                "shop_name": self.shop_name,
            }

            # Get the product name
            name_element = prod.query_selector("div.product-details--wrapper h3 span")
            if name_element:
                product["name"] = name_element.text_content().strip()

            # Get the product price
            price_element = prod.query_selector("div.product-details--wrapper form p")
            if price_element:
                price_text = price_element.text_content().strip() or ""
                cleaned_price_text = re.sub(r"[^\d.]+", "", price_text)
                product["price"] = (
                    round(float(cleaned_price_text), 2) if cleaned_price_text else 0
                )

            # Get the product image source
            img_element = prod.query_selector("div.product-image__container img")
            if img_element:
                img_srcset = img_element.get_attribute("srcset")
                if img_srcset:
                    first_image_from_srcset = (
                        img_srcset.split(",")[0].strip().split(" ")[0]
                    )
                    product["img_src"] = first_image_from_srcset

            # Get the link to the product
            internal_url_path_el = prod.query_selector("a")
            if internal_url_path_el:
                internal_url_path = internal_url_path_el.get_attribute("href")
                if internal_url_path:
                    full_url = "https://www.tesco.ie" + internal_url_path
                    product["product_url"] = full_url

            # If product has name and price, add to the list
            if product["name"] and product["price"] > 0:
                self.products.append(product)

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
