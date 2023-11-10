import os
import sys
import django

sys.path.append("/Users/dmitry/projects/shopping_wiz/sw_core")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "shop_wiz.settings")
django.setup()

from django.db import transaction

from shop_wiz.settings import RESULTS_PER_PAGE
import core.models as core_models
from core.serializers import CachedProductsPageSerializer

import argparse
import requests
import re
from typing import List, Dict
import math
import time

from celery import shared_task
from playwright.sync_api import sync_playwright


@shared_task
def cache_data(query: str, is_relevant_only: bool):
    print(
        f"PASSING ARGS TO THE SCRAPING FNS: query: {query}, is_relevant_only: {is_relevant_only}"
    )
    scraped_data = scrape_data(query, is_relevant_only)

    # TODO: If count is zero, do something else!
    unsorted_results = scraped_data["products"]

    sorted_and_paginated_data = sort_and_paginate(unsorted_results)

    print("RESULTS SORTED AND PAGINATED")
    print("TOTAL RESULTS:", len(unsorted_results))
    for shop in scraped_data["summaryPerShop"]:
        print(f'{shop["shopName"]} RESULTS:', shop["count"])
    print("NUMBER OF PAGES:", len(sorted_and_paginated_data))

    save_results_to_db(
        query=query,
        sorted_and_paginated_data=sorted_and_paginated_data,
        is_relevant_only=is_relevant_only,
    )
    print("RESULTS SAVED!")


def scrape_data(query: str, is_relevant_only: bool) -> Dict:
    results = {
        "products": [],
        "summaryPerShop": [],
    }

    # Dictionary of scraping methods with their corresponding shop names
    scrape_methods = {
        core_models.ShopName.TESCO: scrape_tesco,
        core_models.ShopName.ALDI: scrape_aldi,
        core_models.ShopName.SUPERVALU: scrape_supervalu,
    }

    # TODO: Move to the higher up function
    total_results_count = 0
    total_execution_time = 0.0

    for shop_name, method in scrape_methods.items():
        scrape_result = method(query=query, is_relevant_only=is_relevant_only)

        # Append products and summary per shop to the results
        results["products"].extend(scrape_result["products"])
        results["summaryPerShop"].append(scrape_result["summaryPerShop"])

        # Aggregating the results and time for ScrapeSummaryTotal
        total_results_count += scrape_result["summaryPerShop"]["count"]
        total_execution_time += scrape_result["summaryPerShop"]["exec_time"]

    # TODO: Move to the higher up function
    # Create ScrapeSummaryTotal instance
    total_summary = core_models.ScrapeSummaryTotal.objects.create(
        query=query,
        is_relevant_only=is_relevant_only,
        total_results_count=total_results_count,
        total_execution_time=total_execution_time,
    )

    for shop in results["summaryPerShop"]:
        summarise_scraping(
            shop=shop["shopName"],
            results_count=shop["count"],
            execution_time=shop["exec_time"],
            total_summary=total_summary,
        )

    return results


def summarise_scraping(shop, results_count, execution_time, total_summary):
    if results_count == 0:
        return
    summary = core_models.ScrapeSummaryPerShop.objects.create(
        shop=shop,
        results_count=results_count,
        execution_time=execution_time,
        summary_total=total_summary,
    )
    print(
        f"SCRAPPED SUMMARY FOR {summary.summary_total.query} in {summary.shop}: {summary.execution_time} seconds"
    )


def sort_and_paginate(data):
    sorted_results = sorted(data, key=lambda x: x["price"])

    sorted_results_paginated = [
        sorted_results[i : i + RESULTS_PER_PAGE]
        for i in range(0, len(sorted_results), RESULTS_PER_PAGE)
    ]

    return sorted_results_paginated


def save_results_to_db(query, sorted_and_paginated_data, is_relevant_only):
    print(f"SAVING  RESULTS FOR {query} TO THE DB")
    with transaction.atomic():
        for index, page_data in enumerate(sorted_and_paginated_data, start=1):
            serializer = CachedProductsPageSerializer(
                data={
                    "query": query,
                    "page": index,
                    "results": page_data,
                    "is_relevant_only": is_relevant_only,
                }
            )
            print(f"SAVING PAGE {index}")
            serializer.is_valid(raise_exception=True)
            serializer.save()


def scrape_tesco(query: str, is_relevant_only: bool):
    start_time = time.time()

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch()

            context = browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36"
            )

            page = context.new_page()

            products = []
            total_number_of_items = 0
            total_number_of_pages = 0
            items_per_page = core_models.ShopPageCount.TESCO_LONG

            current_page = 1

            def build_url(query: str, current_page: int):
                if is_relevant_only:
                    return f"https://www.tesco.ie/groceries/en-IE/search?query={query}&count={core_models.ShopPageCount.TESCO_LONG}"
                else:
                    return f"https://www.tesco.ie/groceries/en-IE/search?query={query}&sortBy=price-ascending&page={current_page}&count={core_models.ShopPageCount.TESCO_LONG}"

            while True:
                print(f"TESCO PAGE: {current_page}")
                page.goto(build_url(query=query, current_page=current_page))

                # Wait for the search results to load
                page.wait_for_selector(".product-list-container")

                if not is_relevant_only or total_number_of_items == 0:
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

                    total_number_of_pages = math.ceil(
                        total_number_of_items / items_per_page
                    )

                rows = page.query_selector_all("li.product-list--list-item")

                for prod in rows:
                    product = {
                        "name": "",
                        "price": 0,
                        "imgSrc": None,
                        "productUrl": None,
                        "shopName": core_models.ShopName.TESCO,
                    }

                    # Get the product name
                    name_element = prod.query_selector(
                        "div.product-details--wrapper h3 span"
                    )
                    if name_element:
                        product["name"] = name_element.text_content().strip()

                    # Get the product price
                    price_element = prod.query_selector(
                        "div.product-details--wrapper form p"
                    )
                    if price_element:
                        price_text = price_element.text_content().strip() or ""
                        product["price"] = float(re.sub(r"[^\d.]+", "", price_text))

                    # Get the product image source
                    img_element = prod.query_selector(
                        "div.product-image__container img"
                    )
                    if img_element:
                        img_srcset = img_element.get_attribute("srcset")
                        if img_srcset:
                            first_image_from_srcset = (
                                img_srcset.split(",")[0].strip().split(" ")[0]
                            )
                            product["imgSrc"] = first_image_from_srcset

                    # Get the link to the product
                    internal_url_path_el = prod.query_selector("a")
                    if internal_url_path_el:
                        internal_url_path = internal_url_path_el.get_attribute("href")
                        if internal_url_path:
                            full_url = "https://www.tesco.ie" + internal_url_path
                            product["productUrl"] = full_url

                    # If product has name and price, add to the list
                    if product["name"] and product["price"] > 0:
                        products.append(product)

                current_page += 1
                if is_relevant_only or current_page > total_number_of_pages:
                    break

            browser.close()

            end_time = time.time()
            elapsed_time = end_time - start_time

            return {
                "products": products,
                "summaryPerShop": {
                    "count": len(products),
                    "exec_time": elapsed_time,
                    "shopName": core_models.ShopName.TESCO,
                },
            }
    except (AssertionError, Exception) as e:
        print(f"Error fetching and parsing data from {core_models.ShopName.TESCO}: {e}")

        return {
            "products": [],
            "summaryPerShop": {
                "count": 0,
                "exec_time": 0,
                "shopName": core_models.ShopName.TESCO,
            },
        }


def scrape_aldi(query: str, is_relevant_only: bool):
    start_time = time.time()

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page()

            products = []
            total_number_of_items = 0
            total_number_of_pages = 0
            items_per_page = core_models.ShopPageCount.ALDI

            current_page = 1

            def build_url(query: str, current_page: int):
                if is_relevant_only:
                    return f"https://groceries.aldi.ie/en-GB/Search?keywords={query}"
                else:
                    return f"https://groceries.aldi.ie/en-GB/Search?keywords={query}&sortBy=DisplayPrice&sortDirection=asc&page={current_page}"

            while True:
                print(f"ALDI PAGE: {current_page}")
                page.goto(build_url(query=query, current_page=current_page))

                # Wait for the search results to load
                page.wait_for_selector('[data-qa="search-results"]')

                if not is_relevant_only or total_number_of_items == 0:
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
                    assert (
                        total_number_of_items != 0
                    ), "AssertionError: No items found for the given query"

                    total_number_of_pages = math.ceil(
                        total_number_of_items / items_per_page
                    )

                rows = page.query_selector_all('[data-qa="search-results"]')

                for prod in rows:
                    product = {
                        "name": "",
                        "price": 0,
                        "imgSrc": None,
                        "productUrl": None,
                        "shopName": core_models.ShopName.ALDI,
                    }

                    # Extracting elements
                    name_element = prod.query_selector(
                        '[data-qa="search-product-title"]'
                    )
                    price_element = prod.query_selector(".product-tile-price .h4 span")
                    image_element = prod.query_selector("img")

                    # Extracting relevant data
                    product["name"] = name_element.text_content() or ""

                    price_text = price_element.text_content()
                    price_match = re.search(r"(\d+\.\d+)", price_text)
                    product["price"] = float(price_match.group(1)) if price_match else 0

                    product["imgSrc"] = image_element.get_attribute("src") or None

                    # Get the link to the product
                    internal_url_path_el = prod.query_selector("a")
                    if internal_url_path_el:
                        internal_url_path = internal_url_path_el.get_attribute("href")
                        if internal_url_path:
                            full_url = "https://groceries.aldi.ie" + internal_url_path
                            product["productUrl"] = full_url

                    if product["name"] and product["price"] > 0:
                        products.append(product)

                current_page += 1
                if is_relevant_only or current_page > total_number_of_pages:
                    break

            browser.close()

            end_time = time.time()
            elapsed_time = end_time - start_time

            return {
                "products": products,
                "summaryPerShop": {
                    "count": len(products),
                    "exec_time": elapsed_time,
                    "shopName": core_models.ShopName.ALDI,
                },
            }
    except (AssertionError, Exception) as e:
        print(f"Error fetching and parsing data from {core_models.ShopName.ALDI}: {e}")
        return {
            "products": [],
            "summaryPerShop": {
                "count": 0,
                "exec_time": 0,
                "shopName": core_models.ShopName.ALDI,
            },
        }


from playwright.sync_api import sync_playwright


def scrape_supervalu(query: str, is_relevant_only: bool):
    start_time = time.time()

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page()

            products = []
            total_number_of_items = 0
            total_number_of_pages = 0
            items_per_page = core_models.ShopPageCount.SUPERVALU

            current_page = 1
            skip_index = 0

            def build_url(query: str, current_page: int, skip_index: int):
                if is_relevant_only:
                    return f"https://shop.supervalu.ie/sm/delivery/rsid/5550/results?q={query}"
                else:
                    return f"https://shop.supervalu.ie/sm/delivery/rsid/5550/results?q={query}&sort=price&page={current_page}&skip={skip_index}"

            while True:
                print(f"SUPERVALU PAGE: {current_page}")
                page.goto(
                    build_url(
                        query=query, current_page=current_page, skip_index=skip_index
                    )
                )

                # Wait for the search results to load
                page.wait_for_selector('[class^="Listing"]')

                # Extract the total number of items once if it hasn't been done yet
                if not is_relevant_only or total_number_of_items == 0:
                    total_items_element = page.query_selector('h4[class^="Subtitle"]')
                    total_items_text = (
                        total_items_element.text_content()
                        if total_items_element
                        else None
                    )
                    match = (
                        re.search(r"(\d+)", total_items_text)
                        if total_items_text
                        else None
                    )
                    total_number_of_items = int(match.group(1)) if match else 0
                    assert (
                        total_number_of_items != 0
                    ), "AssertionError: No items found for the given query"

                    total_number_of_pages = math.ceil(
                        total_number_of_items / items_per_page
                    )

                rows = page.query_selector_all('[class^="ColListing"]')

                for prod in rows:
                    product = {
                        "name": "",
                        "price": 0,
                        "imgSrc": None,
                        "productUrl": None,
                        "shopName": core_models.ShopName.SUPERVALU,
                    }

                    name_element = prod.query_selector(
                        'span[class^="ProductCardTitle"] > div'
                    )
                    price_element = prod.query_selector(
                        '[class^="ProductCardPricing"] > span > span'
                    )
                    image_element = prod.query_selector(
                        '[class^="ProductCardImageWrapper"] > div > img'
                    )

                    product["name"] = (
                        page.eval_on_selector(
                            'span[class^="ProductCardTitle"] > div',
                            "div => div.firstChild.textContent.trim()",
                        )
                        if name_element
                        else ""
                    )

                    price_text = price_element.text_content() if price_element else None

                    # Extracting the float value from the price text
                    match = re.search(r"(\d+\.\d+)", price_text) if price_text else None
                    product["price"] = float(match.group(1)) if match else 0

                    product["imgSrc"] = (
                        image_element.get_attribute("src") if image_element else None
                    )

                    # Get the link to the product
                    internal_url_path_el = prod.query_selector("a")
                    if internal_url_path_el:
                        internal_url_path = internal_url_path_el.get_attribute("href")
                        if internal_url_path:
                            product["productUrl"] = internal_url_path

                    if product["name"] and product["price"] > 0:
                        products.append(product)

                current_page += 1
                skip_index += items_per_page

                if is_relevant_only or current_page > total_number_of_pages:
                    break

            browser.close()

            end_time = time.time()
            elapsed_time = end_time - start_time

            return {
                "products": products,
                "summaryPerShop": {
                    "count": len(products),
                    "exec_time": elapsed_time,
                    "shopName": core_models.ShopName.SUPERVALU,
                },
            }
    except (AssertionError, Exception) as e:
        print(
            f"Error fetching and parsing data from {core_models.ShopName.SUPERVALU}: {e}"
        )
        return {
            "products": [],
            "summaryPerShop": {
                "count": 0,
                "exec_time": 0,
                "shopName": core_models.ShopName.SUPERVALU,
            },
        }


if __name__ == "__main__":
    # Argument parser setup
    parser = argparse.ArgumentParser(
        description="Scrape data based on a query and page number."
    )

    # Add arguments for query and page
    parser.add_argument("query", type=str, help="The query to search for.")
    parser.add_argument("page", type=str, help="The page number to retrieve.")
    parser.add_argument(
        "is_relevant_only",
        type=str,
        help="Only scrape first page of most relevant searches.",
    )

    # Parse the arguments
    args = parser.parse_args()

    # Call the function with parsed arguments
    result = scrape_data(args.query, args.page, args.is_relevant_only)

    # Display the desired results
    for shop in result["summaryPerShop"]:
        print(f'{shop["shopName"]} RESULTS:', shop["count"])
