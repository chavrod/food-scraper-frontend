import { load } from "cheerio";
import { JSDOM } from "jsdom";
import { chromium } from "playwright";

import { Product, ScrapeSummary, ShopName } from "@/utils/types";

export default async function FetchData({
  query,
}: {
  query: string;
}): Promise<{ products: Product[]; summary: ScrapeSummary[] }> {
  // Return array
  const results: { products: Product[]; summary: ScrapeSummary[] } = {
    products: [],
    summary: [],
  };

  // Add the scraping from different shops
  const tescoResults = await scrapeTesco(query);
  const aldiResults = await scrapeAldi(query);
  const superValuResults = await scrapeSuprvalue(query);

  const allResultsUnsorted = [
    ...tescoResults.products,
    ...aldiResults.products,
    ...superValuResults.products,
  ];
  const allResultsSorted = allResultsUnsorted.sort((a, b) => a.price - b.price);
  const sortedResultsSliced = allResultsSorted.slice(0, 30);

  // console.log(sortedResultsSliced);

  results.products.push(...sortedResultsSliced);

  return results;
}

async function scrapeTesco(query: string) {
  const headers = {
    authority: "www.tesco.ie",
    accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "accept-language": "en-GB,en;q=0.9",
    "cache-control": "max-age=0",
    cookie:
      "consumer=default; trkid=536e8783-56dd-4760-942b-aae504a6a182; atrc=ff8c60a2-25ef-4cb7-8ca5-bafbf3d4ba82; DCO=sdc; _csrf=88g490P13QcYBNYmXNGG4IYf; ighs-sess=eyJhbmFseXRpY3NTZXNzaW9uSWQiOiIxN2RhYjQ4NmRiNDQ5NmIyZGQ1NTA2YTEyYzgzMGQ4ZSIsInN0b3JlSWQiOiI1NzkwIn0=; ighs-sess.sig=kHEnpovJkzgXtTCBzGEQPsnJVqY; bm_sz=5CB52AB3EAD74B0F8CEE7BACAA043392~YAAQ5ZrYFxL9l4eJAQAASialuxTrE+j0AId+MbToL134ba3ATSzxGmnBi5AsPK87oxKCZhkjW6M+Cz3O8D5HyrAihLBuq3uvGChSvsj57mxjJ0GqqEIkO2Hrz/xAI6gSQRPurF5Pi5Q+RqNio6U5U/fepbjIW5VSqru9CKCc20NujQgEsXq4W7t1eheoFLtBM0JmEqSuRxVXjqpziV6He6HHHYrvP04/ZVv9OQE/utL8ImUbg6ByzE831TomXdJJ8zQq/tiN/3alyL3dY4ECXOTvXTGun9r6694vg7nfgVNF~3749186~4273731; bm_mi=C7739D2F1676564964DEA3CFBD170351~YAAQ5ZrYF9/9l4eJAQAAviqluxSANs3CYenF/NOI/pCwUvun3slTi30wW7yZ/m+gow83S8lqer6d8y3ofgdJCk4Pa9M9XXrGJVvC7+varEEfiNIho1uVtK5ajXE9ksIbW4Apzzzx8rjDSDwBY/eAUmkopb0zObzn5+oSojvtg7gwrrFHbayUL+e2aZCrP1OwLqlONefycxJitMwQ7D9/mzkPPhupC6cButuOg1l7/6dLuoGEy3ZEPaR/M8yERMgWqjrCg1Q9+xefkswPTEkGWDpbL4jVHGxvY/cCNv7XU1qQf80mB+2oYD/H2RiRUId9e5igldUAlnkAJu6h0xtuWz6gtkgqETrKlS51ark=~1; akavpau_tesco_ie=1691070612~id=31aea7f1ae987e5e4777f1dda9ce4397; ak_bmsc=4BAEF27E93A04CA5906554F54C0A8790~000000000000000000000000000000~YAAQ5ZrYFyb/l4eJAQAAwzCluxRC6NutXLf3a6OOGIbxAGBG5Tmfbb6n14NB/iFFHTp4xD+hmzQJz+fNE2kFbH7ThPtCS0x1OMF0vewhi8dlbXgqz+225Wvj56iLTlpHCNkyK2w3FmB4YaUsGCmEle9fWBE+F4Q96LoplLvJbOhHcC3BI10Uy/jK6jMFnxhcE5LT9HjTT6DtMR/b72/CqJp/YqyXKVR3jQePCEz8bF+jRpNw1X2EGtkg4zh+D9b2ShcxsvAGwkcTXmnhIDma+SS3NsXz+X8UfdAehhpmbbzuE5HuClyv30Dm1+oR96sXoB7a2XTOxdYs+WTAC7W92vY4qUExCfLaIUrmQoP84b6OXoW+n+5bIYMzZyKqNAxg3nd+ARLdlBHBtoFi2TMxl4I5g7MDR1FT6DKxJ4IWwy2qn2zdeihvbUW75RbjCcgm4pDoqVBMvqRkHRjLPBST3g6NHO6m+fSVWGyQkZBTK1lfIHML2zB5935wJAvWSZbtf3ZmoI4wM32a4Zv0DG+9WioWIzC14YXjRMNbHmOtfX0VAKSo+My4KFEwoMxM5IabQBSgxyNjsJUv//o4KlUgUNOmm1hq9D8PFkIh3aU22Uzi9D8Yw/GV3G4t; _abck=2C723A35A7D02DA7CB7381C75E9CC2A4~0~YAAQ5ZrYF2D/l4eJAQAAsDGluwpcvzav4Tt+2LtrtZ3w4xeRJT+1pJSBGo9Taq72W/DS7RhHN4whjz7HX9ca6q+jYkE5JtmGJos7yKRoHNvocjQMf9xpnOhTrDLQI786MBWpQvXyzxga+Maio0cHdWgbnxr834v0WX9TQDSroq19W7hNwNpUKao4JYOMBtdZWmG3Vlj9mfx/IQPAvHlHE6EfEJIbex8KIrp6KBXsq1IR21jP6T36VnYFYDDqYBp35L/gGBJy/p4/s0f82kottoaTgpEtUcYBYxpNAlIek+skIqGhjIwAMQv6VmXM/VJR6f6jnhNXANmUB7NhvcvpL2vI+R1YYZ9IUehFZo5XDcMwMZ392HxmJ9boasjNs0cRC/IMYeJlwegH+GY3/eYw8GMm100sPw==~-1~-1~1691073875; akavpau_tesco_ie_groceries=1691070847~id=1f23f63c3dd33de9554fb0eaa1930609; bm_sv=C0D43BBD175466E5C3F12CA3E6C8CE63~YAAQbbATAuLD362JAQAACciouxR9Wqh0hHlML8yMqv5F/ul4DKGlfsr6gX8DyCM8Ldn/M96zR0lStyGmHmF4SFbfqgPpD4HM108z1FIJcOn+fR+2AlMjXgqoiTXguGOKJvwcaudIHNWNp0QS5/SfKzBsdTIB5Hg2XRE7qVinVZSFbyikd93LzuKLQYu+jO9Idfj9CqxL5I655Tar6PSjnbVC2Pvl/Qjx1jmO3o3dMJ8Ue9HPT9J9p4b4EySMhg==~1",
    "sec-ch-ua":
      '"Not/A)Brand";v="99", "Google Chrome";v="115", "Chromium";v="115"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"macOS"',
    "sec-fetch-dest": "document",
    "sec-fetch-mode": "navigate",
    "sec-fetch-site": "none",
    "sec-fetch-user": "?1",
    "upgrade-insecure-requests": "1",
    "user-agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
  };

  try {
    const response = await fetch(
      `https://www.tesco.ie/groceries/en-IE/search?query=${query}`,
      {
        headers: headers,
        cache: "no-store",
      }
    );

    const html = await response.text();
    const { window } = new JSDOM(html);
    const $ = (selector: string) => window.document.querySelectorAll(selector);

    // Extract the total number of items
    let products: Product[] = [];

    $("li.product-list--list-item").forEach((item) => {
      let product: Product = {
        name: "",
        price: 0,
        imgSrc: undefined,
        shopName: ShopName.TESCO,
      };

      const productDetails = item.querySelector("div.product-details--wrapper");

      const nameTag = productDetails?.querySelector("h3");
      if (nameTag) {
        const nameSpan = nameTag.querySelector("span");
        if (nameSpan) {
          product.name = nameSpan.textContent || "";
        }
      }

      const formTag = productDetails?.querySelector("form");
      if (formTag) {
        const priceTag = formTag.querySelector("p");
        if (priceTag) {
          const priceText = priceTag.textContent || "";
          const priceValue = parseFloat(priceText.replace(/[^0-9.-]+/g, "")); // Strip non-numeric characters
          product.price = priceValue;
        }
      }

      const imgSrcset = item
        .querySelector("div.product-image__container img")
        ?.getAttribute("srcset");
      if (imgSrcset) {
        const firstImageFromSrcset = imgSrcset
          .split(",")[0]
          .trim()
          .split(" ")[0];
        product.imgSrc = firstImageFromSrcset;
      }

      if (product.name && product.price) {
        products.push(product);
      }
    });

    return {
      products,
      summary: { count: products.length, shopName: ShopName.TESCO },
    };
  } catch (error) {
    console.error("Error fetching and parsing data:", error);
    return { products: [], summary: { count: 0, shopName: ShopName.TESCO } };
  }
}

async function scrapeSuprvalue(query: string) {
  try {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    const url = `https://shop.supervalu.ie/sm/delivery/rsid/5550/results?q=${query}`;
    await page.goto(url);

    // Wait for the search results to load
    await page.waitForSelector('[class^="Listing"]');

    // const text = await page.$eval(
    //   '[class^="Listing"]',
    //   (element) => element.textContent
    // );
    // console.log(text);

    const rows = await page.$$('[class^="ColListing"]');

    const products: Product[] = [];
    for (const prod of rows) {
      let product: Product = {
        name: "",
        price: 0,
        imgSrc: undefined,
        shopName: ShopName.SUPERVALU,
      };

      const nameElement = await prod.$('span[class^="ProductCardTitle"] > div');
      const priceElement = await prod.$(
        '[class^="ProductCardPricing"] > span > span'
      );
      const imageElement = await prod.$(
        '[class^="ProductCardImageWrapper"] > div > img'
      );

      // product.name = (await nameElement?.textContent()) || "";
      if (nameElement) {
        product.name = await nameElement.evaluate(
          (el) => el.childNodes[0]?.nodeValue?.trim() ?? ""
        );
      } else {
        product.name = "";
      }
      const priceText = await priceElement?.textContent();
      product.price = priceText
        ? parseFloat(priceText.replace(/[^0-9.-]+/g, ""))
        : 0;
      product.imgSrc = (await imageElement?.getAttribute("src")) || undefined;

      if (product.name !== "" && product.price > 0) {
        products.push(product);
      }
    }

    await browser.close();
    console.log(products);
    return {
      products: products,
      summary: { count: products.length, shopName: ShopName.SUPERVALU },
    };
  } catch (error) {
    console.error("Error fetching and parsing data:", error);
    return {
      products: [],
      summary: { count: 0, shopName: ShopName.SUPERVALU },
    };
  }
}

async function scrapeAldi(query: string) {
  try {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    const url = `https://groceries.aldi.ie/en-GB/Search?keywords=${query}`;
    await page.goto(url);

    // Wait for the search results to load
    await page.waitForSelector('[data-qa="search-results"]');

    // const html = await page.content();
    // console.log(html);

    const rows = await page.$$('[data-qa="search-results"]');
    const products: Product[] = [];
    for (const prod of rows) {
      let product: Product = {
        name: "",
        price: 0,
        imgSrc: undefined,
        shopName: ShopName.ALDI,
      };

      const nameElement = await prod.$('[data-qa="search-product-title"]');
      const priceElement = await prod.$(".product-tile-price .h4 span");
      const imageElement = await prod.$("img");

      product.name = (await nameElement?.textContent()) || "";
      const priceText = await priceElement?.textContent();
      product.price = priceText
        ? parseFloat(priceText.replace(/[^0-9.-]+/g, ""))
        : 0;
      product.imgSrc = (await imageElement?.getAttribute("src")) || undefined;

      if (product.name !== "" && product.price > 0) {
        products.push(product);
      }
    }

    await browser.close();

    return {
      products: products,
      summary: { count: products.length, shopName: ShopName.ALDI },
    };
  } catch (error) {
    console.error("Error fetching and parsing data:", error);
    return { products: [], summary: { count: 0, shopName: ShopName.ALDI } };
  }
}
