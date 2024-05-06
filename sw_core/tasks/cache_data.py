from typing import List, Dict
from decimal import Decimal
import os
import sys
from datetime import timedelta
import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed

import time

from celery import shared_task

import django

sys.path.append("/Users/dmitry/projects/shopping_wiz/sw_core")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "shop_wiz.settings")
django.setup()

from django.core.cache import cache
from django.utils import timezone
from django.db import transaction

from shop_wiz.settings import (
    ENABLED_SCRAPERS,
    CACHE_SHOP_SCRAPE_EXECUTION_SECONDS,
)
import core.models as core_models
from core.scraper_factory import ScraperFactory
from core.scraper_factory.shop_scrapers import ShopScraper


factory = ScraperFactory()


def begin_scraping(query_param):
    cache_key = f"scrape_query_{query_param}"
    last_update = cache.get(cache_key)

    if last_update and (
        (timezone.now() - last_update)
        < timedelta(seconds=CACHE_SHOP_SCRAPE_EXECUTION_SECONDS)
    ):
        return
    else:
        # TODO: Rethink
        is_relevant_only_param = True
        cache_data.delay(query_param, is_relevant_only_param)
        cache.set(
            cache_key,
            timezone.now(),
            timeout=CACHE_SHOP_SCRAPE_EXECUTION_SECONDS,
        )


@shared_task
def cache_data(query: str, is_relevant_only: bool):
    print(f"Passing to cache_data query: {query}; is_relevant_only: {is_relevant_only}")

    scraped_data = scrape_data(query, is_relevant_only)
    print("data scraped")
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
    with transaction.atomic():
        batch_instance = core_models.BatchUpload.objects.create(query=query)

        products_to_create = []
        for product in products_list:
            product_instance = core_models.SearchedProduct(
                batch=batch_instance,
                name=product["name"],
                price=product["price"],
                price_per_unit=product["price_per_unit"],
                unit_type=product["unit_type"],
                unit_measurement=product["unit_measurement"],
                img_src=product["img_src"],
                product_url=product["product_url"],
                shop_name=product["shop_name"],
            )
            products_to_create.append(product_instance)

        core_models.SearchedProduct.objects.bulk_create(products_to_create)


if __name__ == "__main__":
    # Argument parser setup
    parser = argparse.ArgumentParser(
        description="Scrape data based on a query and relevance."
    )
    # Add argument for query
    parser.add_argument("query", type=str, help="The query to search for.")
    # Parse the arguments
    args = parser.parse_args()

    is_relevant_only = True

    # Call the function with parsed arguments
    result = scrape_data(args.query, is_relevant_only)

    # Display the desired results
    for shop in result["summaryPerShop"]:
        print(f'{shop["shop_name"]} RESULTS:', shop["count"])
