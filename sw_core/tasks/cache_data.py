from typing import List, Dict
import os
import sys
import django
import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed

from celery import shared_task

from shop_wiz.settings import ENABLED_SCRAPERS
import core.models as core_models
import core.serializers as core_serializers
from core.scraper_factory import ScraperFactory
from core.scraper_factory.shop_scrapers import ShopScraper

sys.path.append("/Users/dmitry/projects/shopping_wiz/sw_core")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "shop_wiz.settings")
django.setup()

factory = ScraperFactory()


@shared_task
def cache_data(query: str, is_relevant_only: bool):
    print(f"Passing to cache_data query: {query}; is_relevant_only: {is_relevant_only}")

    scraped_data = scrape_data(query, is_relevant_only)
    products = scraped_data["products"]
    if not products:
        return

    save_results_to_db(
        query,
        products,
    )


def scrape_with_scraper(scraper_name, query, is_relevant_only):
    scraper_instance: ShopScraper = factory.create(scraper_name)
    return scraper_instance.get_products(query, is_relevant_only)


def scrape_data(query: str, is_relevant_only: bool) -> Dict:
    results = {
        "products": [],
        "summaryPerShop": [],
    }

    # Using ThreadPoolExecutor to run scrapers in parallel
    with ThreadPoolExecutor(max_workers=len(ENABLED_SCRAPERS)) as executor:
        # Submitting all scraper tasks to the executor
        future_to_scraper = {
            executor.submit(
                scrape_with_scraper, scraper_name, query, is_relevant_only
            ): scraper_name
            for scraper_name in ENABLED_SCRAPERS
        }

        for future in as_completed(future_to_scraper):
            scraper_name = future_to_scraper[future]
            try:
                scrape_result = future.result()

                results["products"].extend(scrape_result["products"])
                results["summaryPerShop"].append(scrape_result["summaryPerShop"])

            except Exception as exc:
                print(f"{scraper_name} generated an exception: {exc}")

    return results


def save_results_to_db(query, products_list):
    products_to_create = []  # List to hold unsaved SearchedProduct instances

    for product in products_list:
        product_instance = core_models.SearchedProduct(
            query=query,
            name=product["name"],
            price=product["price"],
            img_src=product["img_src"],
            product_url=product["product_url"],
            shop_name=product["shop_name"],
        )
        products_to_create.append(product_instance)

    core_models.SearchedProduct.objects.bulk_create(products_to_create)


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
        print(f'{shop["shop_name"]} RESULTS:', shop["count"])
