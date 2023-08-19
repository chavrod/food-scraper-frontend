import os
import sys
import django

sys.path.append("/Users/dmitry/projects/shopping_wiz/sw_core")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "shop_wiz.settings")
django.setup()

from shop_wiz.settings import RESULTS_PER_PAGE
import core.models as core_modes

# from playwright.async_api import async_playwright
from playwright.sync_api import sync_playwright
import argparse
import requests
import re
from typing import List, Dict
import math

from bs4 import BeautifulSoup

from celery import shared_task


@shared_task
def cache_data(query: str, page: str, is_relevant_only: bool, is_ascending: bool):
    data = scrape_data(query, page, is_relevant_only)


def scrape_data(query: str, page: str, is_relevant_only: bool) -> Dict:
    serialised_page = int(page) if page else 1

    results = {
        "products": [],
        "summaryPerShop": [],
        "searchMetaData": {"currentPage": 0, "totalPages": 0, "keyword": query},
    }

    tesco_results = scrape_tesco(query=query, is_relevant_only=is_relevant_only)
    aldi_results = scrape_aldi(query=query, is_relevant_only=is_relevant_only)
    super_value_results = scrape_supervalu(
        query=query, is_relevant_only=is_relevant_only
    )

    all_results_unsorted = (
        tesco_results["products"]
        + aldi_results["products"]
        + super_value_results["products"]
    )

    results["summaryPerShop"] = [
        tesco_results["summaryPerShop"],
        aldi_results["summaryPerShop"],
        super_value_results["summaryPerShop"],
    ]

    # Sorting and paginating results
    all_results_sorted = sorted(all_results_unsorted, key=lambda x: x["price"])

    sorted_results_paginated = [
        all_results_sorted[i : i + RESULTS_PER_PAGE]
        for i in range(0, len(all_results_sorted), RESULTS_PER_PAGE)
    ]

    print("RESULTS SORTED AND PAGINATED")
    print("TOTAL RESULTS:", len(all_results_sorted))
    for shop in results["summaryPerShop"]:
        print(f'{shop["shopName"]} RESULTS:', shop["count"])
    print("NUMBER OF PAGES:", len(sorted_results_paginated))

    total_pages = len(sorted_results_paginated)
    page_to_display = min(total_pages, serialised_page)

    results["products"].extend(sorted_results_paginated[page_to_display - 1])
    results["searchMetaData"]["currentPage"] = page_to_display
    results["searchMetaData"]["totalPages"] = total_pages

    # await cache_results({
    #     "keyword": query,
    #     "page": "totalPages",
    #     "results": total_pages
    # })

    # # Using asyncio.gather for caching multiple results concurrently
    # await asyncio.gather(
    #     *[cache_results({"keyword": query, "page": shop["shopName"], "results": shop["count"]}) for shop in results["summaryPerShop"]],
    #     *[cache_results({"keyword": query, "page": index + 1, "results": page_content}) for index, page_content in enumerate(sorted_results_paginated)]
    # )

    return results


def scrape_tesco(query: str, is_relevant_only: bool):
    headers = {
        "authority": "www.tesco.ie",
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "accept-language": "en-GB,en;q=0.9",
        "cache-control": "max-age=0",
        "cookie": "consumer=default; trkid=536e8783-56dd-4760-942b-aae504a6a182; atrc=ff8c60a2-25ef-4cb7-8ca5-bafbf3d4ba82; DCO=sdc; _csrf=88g490P13QcYBNYmXNGG4IYf; ighs-sess=eyJhbmFseXRpY3NTZXNzaW9uSWQiOiIxN2RhYjQ4NmRiNDQ5NmIyZGQ1NTA2YTEyYzgzMGQ4ZSIsInN0b3JlSWQiOiI1NzkwIn0=; ighs-sess.sig=kHEnpovJkzgXtTCBzGEQPsnJVqY; bm_sz=5CB52AB3EAD74B0F8CEE7BACAA043392~YAAQ5ZrYFxL9l4eJAQAASialuxTrE+j0AId+MbToL134ba3ATSzxGmnBi5AsPK87oxKCZhkjW6M+Cz3O8D5HyrAihLBuq3uvGChSvsj57mxjJ0GqqEIkO2Hrz/xAI6gSQRPurF5Pi5Q+RqNio6U5U/fepbjIW5VSqru9CKCc20NujQgEsXq4W7t1eheoFLtBM0JmEqSuRxVXjqpziV6He6HHHYrvP04/ZVv9OQE/utL8ImUbg6ByzE831TomXdJJ8zQq/tiN/3alyL3dY4ECXOTvXTGun9r6694vg7nfgVNF~3749186~4273731; bm_mi=C7739D2F1676564964DEA3CFBD170351~YAAQ5ZrYF9/9l4eJAQAAviqluxSANs3CYenF/NOI/pCwUvun3slTi30wW7yZ/m+gow83S8lqer6d8y3ofgdJCk4Pa9M9XXrGJVvC7+varEEfiNIho1uVtK5ajXE9ksIbW4Apzzzx8rjDSDwBY/eAUmkopb0zObzn5+oSojvtg7gwrrFHbayUL+e2aZCrP1OwLqlONefycxJitMwQ7D9/mzkPPhupC6cButuOg1l7/6dLuoGEy3ZEPaR/M8yERMgWqjrCg1Q9+xefkswPTEkGWDpbL4jVHGxvY/cCNv7XU1qQf80mB+2oYD/H2RiRUId9e5igldUAlnkAJu6h0xtuWz6gtkgqETrKlS51ark=~1; akavpau_tesco_ie=1691070612~id=31aea7f1ae987e5e4777f1dda9ce4397; ak_bmsc=4BAEF27E93A04CA5906554F54C0A8790~000000000000000000000000000000~YAAQ5ZrYFyb/l4eJAQAAwzCluxRC6NutXLf3a6OOGIbxAGBG5Tmfbb6n14NB/iFFHTp4xD+hmzQJz+fNE2kFbH7ThPtCS0x1OMF0vewhi8dlbXgqz+225Wvj56iLTlpHCNkyK2w3FmB4YaUsGCmEle9fWBE+F4Q96LoplLvJbOhHcC3BI10Uy/jK6jMFnxhcE5LT9HjTT6DtMR/b72/CqJp/YqyXKVR3jQePCEz8bF+jRpNw1X2EGtkg4zh+D9b2ShcxsvAGwkcTXmnhIDma+SS3NsXz+X8UfdAehhpmbbzuE5HuClyv30Dm1+oR96sXoB7a2XTOxdYs+WTAC7W92vY4qUExCfLaIUrmQoP84b6OXoW+n+5bIYMzZyKqNAxg3nd+ARLdlBHBtoFi2TMxl4I5g7MDR1FT6DKxJ4IWwy2qn2zdeihvbUW75RbjCcgm4pDoqVBMvqRkHRjLPBST3g6NHO6m+fSVWGyQkZBTK1lfIHML2zB5935wJAvWSZbtf3ZmoI4wM32a4Zv0DG+9WioWIzC14YXjRMNbHmOtfX0VAKSo+My4KFEwoMxM5IabQBSgxyNjsJUv//o4KlUgUNOmm1hq9D8PFkIh3aU22Uzi9D8Yw/GV3G4t; _abck=2C723A35A7D02DA7CB7381C75E9CC2A4~0~YAAQ5ZrYF2D/l4eJAQAAsDGluwpcvzav4Tt+2LtrtZ3w4xeRJT+1pJSBGo9Taq72W/DS7RhHN4whjz7HX9ca6q+jYkE5JtmGJos7yKRoHNvocjQMf9xpnOhTrDLQI786MBWpQvXyzxga+Maio0cHdWgbnxr834v0WX9TQDSroq19W7hNwNpUKao4JYOMBtdZWmG3Vlj9mfx/IQPAvHlHE6EfEJIbex8KIrp6KBXsq1IR21jP6T36VnYFYDDqYBp35L/gGBJy/p4/s0f82kottoaTgpEtUcYBYxpNAlIek+skIqGhjIwAMQv6VmXM/VJR6f6jnhNXANmUB7NhvcvpL2vI+R1YYZ9IUehFZo5XDcMwMZ392HxmJ9boasjNs0cRC/IMYeJlwegH+GY3/eYw8GMm100sPw==~-1~-1~1691073875; akavpau_tesco_ie_groceries=1691070847~id=1f23f63c3dd33de9554fb0eaa1930609; bm_sv=C0D43BBD175466E5C3F12CA3E6C8CE63~YAAQbbATAuLD362JAQAACciouxR9Wqh0hHlML8yMqv5F/ul4DKGlfsr6gX8DyCM8Ldn/M96zR0lStyGmHmF4SFbfqgPpD4HM108z1FIJcOn+fR+2AlMjXgqoiTXguGOKJvwcaudIHNWNp0QS5/SfKzBsdTIB5Hg2XRE7qVinVZSFbyikd93LzuKLQYu+jO9Idfj9CqxL5I655Tar6PSjnbVC2Pvl/Qjx1jmO3o3dMJ8Ue9HPT9J9p4b4EySMhg==~1",
        "sec-ch-ua": '"Not/A)Brand";v="99", "Google Chrome";v="115", "Chromium";v="115"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "none",
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": "1",
        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
    }
    try:
        products = []
        if is_relevant_only:
            url = f"https://www.tesco.ie/groceries/en-IE/search?query={query}"
            response = requests.get(url, headers=headers)
            html = response.text
            soup = BeautifulSoup(html, "html.parser")

            for item in soup.select("li.product-list--list-item"):
                product = {
                    "name": "",
                    "price": 0,
                    "imgSrc": None,
                    "shopName": core_modes.ShopName.TESCO,
                }

                name_span = item.select_one("div.product-details--wrapper h3 span")
                product["name"] = name_span.get_text() if name_span else ""

                price_tag = item.select_one("div.product-details--wrapper form p")
                if price_tag:
                    price_text = price_tag.get_text() or ""
                    product["price"] = float(re.sub(r"[^0-9.-]+", "", price_text))

                img_srcset = item.select_one("div.product-image__container img")[
                    "srcset"
                ]
                if img_srcset:
                    first_image_from_srcset = (
                        img_srcset.split(",")[0].strip().split(" ")[0]
                    )
                    product["imgSrc"] = first_image_from_srcset

                if product["name"] and product["price"]:
                    products.append(product)
        else:
            url = f"https://www.tesco.ie/groceries/en-IE/search?query={query}&sortBy=price-ascending&page=1&count={core_modes.ShopPageCount.TESCO_LONG}"
            response = requests.get(url, headers=headers)
            html = response.text
            soup = BeautifulSoup(html, "html.parser")

            strong_element_with_total_count = soup.select_one(
                "div.pagination__items-displayed > strong:nth-child(2)"
            )
            text_content_with_total_count = (
                strong_element_with_total_count.get_text()
                if strong_element_with_total_count
                else ""
            )
            match = re.search(r"(\d+)", text_content_with_total_count)
            total_number_of_items = int(match.group(1)) if match else 0

            if total_number_of_items == 0:
                return {
                    "products": [],
                    "summaryPerShop": {
                        "count": 0,
                        "shopName": core_modes.ShopName.TESCO,
                    },
                }

            total_pages = math.ceil(
                total_number_of_items / core_modes.ShopPageCount.TESCO_LONG
            )

            for i in range(1, total_pages + 1):
                print(f"TESCO PAGE NO: {i}")
                page_url = f"https://www.tesco.ie/groceries/en-IE/search?query={query}&sortBy=price-ascending&page={i}&count={core_modes.ShopPageCount.TESCO_LONG}"
                page_response = requests.get(page_url, headers=headers)
                page_html = page_response.text
                page_soup = BeautifulSoup(page_html, "html.parser")

                for item in page_soup.select("li.product-list--list-item"):
                    product = {
                        "name": "",
                        "price": 0,
                        "imgSrc": None,
                        "shopName": core_modes.ShopName.TESCO,
                    }

                    name_span = item.select_one("div.product-details--wrapper h3 span")
                    product["name"] = name_span.get_text() if name_span else ""

                    price_tag = item.select_one("div.product-details--wrapper form p")
                    if price_tag:
                        price_text = price_tag.get_text() or ""
                        product["price"] = float(re.sub(r"[^0-9.-]+", "", price_text))

                    img_srcset = item.select_one("div.product-image__container img")[
                        "srcset"
                    ]
                    if img_srcset:
                        first_image_from_srcset = (
                            img_srcset.split(",")[0].strip().split(" ")[0]
                        )
                        product["imgSrc"] = first_image_from_srcset

                    if product["name"] and product["price"]:
                        products.append(product)

        return {
            "products": products,
            "summaryPerShop": {
                "count": len(products),
                "shopName": core_modes.ShopName.TESCO,
            },
        }
    except Exception as e:
        print(f"Error fetching and parsing data from {core_modes.ShopName.TESCO}: {e}")
        return {
            "products": [],
            "summaryPerShop": {
                "count": 0,
                "shopName": core_modes.ShopName.TESCO,
            },
        }


def scrape_aldi(query: str, is_relevant_only: bool):
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page()

            products = []
            total_number_of_items = 0
            total_number_of_pages = 0
            items_per_page = core_modes.ShopPageCount.ALDI

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
                    total_number_of_pages = math.ceil(
                        total_number_of_items / items_per_page
                    )

                rows = page.query_selector_all('[data-qa="search-results"]')

                for prod in rows:
                    product = {
                        "name": "",
                        "price": 0,
                        "imgSrc": None,
                        "shopName": core_modes.ShopName.ALDI,
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

                    print("ALDI product: ", product)

                    if product["name"] and product["price"] > 0:
                        products.append(product)

                current_page += 1
                if is_relevant_only or current_page > total_number_of_pages:
                    break

            browser.close()

            return {
                "products": products,
                "summaryPerShop": {
                    "count": len(products),
                    "shopName": core_modes.ShopName.ALDI,
                },
            }
    except Exception as e:
        print(f"Error fetching and parsing data from {core_modes.ShopName.ALDI}: {e}")
        return {
            "products": [],
            "summaryPerShop": {"count": 0, "shopName": core_modes.ShopName.ALDI},
        }


from playwright.sync_api import sync_playwright


def scrape_supervalu(query: str, is_relevant_only: bool):
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page()

            products = []
            total_number_of_items = 0
            total_number_of_pages = 0
            items_per_page = core_modes.ShopPageCount.SUPERVALU

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
                    total_number_of_pages = math.ceil(
                        total_number_of_items / items_per_page
                    )

                rows = page.query_selector_all('[class^="ColListing"]')

                for prod in rows:
                    product = {
                        "name": "",
                        "price": 0,
                        "imgSrc": None,
                        "shopName": core_modes.ShopName.SUPERVALU,
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
                        name_element.text_content() if name_element else ""
                    )
                    price_text = price_element.text_content() if price_element else None

                    # Extracting the float value from the price text
                    match = re.search(r"(\d+\.\d+)", price_text) if price_text else None
                    product["price"] = float(match.group(1)) if match else 0

                    product["imgSrc"] = (
                        image_element.get_attribute("src") if image_element else None
                    )

                    if product["name"] and product["price"] > 0:
                        products.append(product)

                current_page += 1
                skip_index += items_per_page

                if is_relevant_only or current_page > total_number_of_pages:
                    break

            browser.close()

            return {
                "products": products,
                "summaryPerShop": {
                    "count": len(products),
                    "shopName": core_modes.ShopName.SUPERVALU,
                },
            }
    except Exception as e:
        print(
            f"Error fetching and parsing data from {core_modes.ShopName.SUPERVALU}: {e}"
        )
        return {
            "products": [],
            "summaryPerShop": {"count": 0, "shopName": core_modes.ShopName.SUPERVALU},
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
