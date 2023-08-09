import { load } from "cheerio";
import { chromium, Browser, Page } from "playwright-core";

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

  // results.push(await scrapeSuprvalue(query));
  // results.push(await scrapeLidl(query));

  const allResultsUnsorted = [
    ...tescoResults.products,
    ...aldiResults.products,
  ];
  const allResultsSorted = allResultsUnsorted.sort((a, b) => a.price - b.price);
  const sortedResultsSliced = allResultsSorted.slice(0, 30);

  // console.log(sortedResultsSliced);

  results.products.push(...tescoResults.products);

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
    const $ = load(html);

    // Extract the total number of items
    const itemsDisplayed = $(
      'div.pagination__items-displayed[data-auto="product-bin-count"] strong'
    );
    const totalItems =
      itemsDisplayed.length > 1 ? parseInt(itemsDisplayed.last().text()) : 0;

    let products: Product[] = [];

    $("li.product-list--list-item").each((index, item) => {
      let product: Product = {
        name: "",
        price: 0,
        imgSrc: undefined,
        shopName: ShopName.TESCO,
      };

      const productDetails = $(item).find("div.product-details--wrapper");

      const nameTag = productDetails.find("h3");
      if (nameTag.length) {
        const nameSpan = nameTag.find("span");
        if (nameSpan.length) {
          product.name = nameSpan.text();
        }
      }

      const formTag = productDetails.find("form");
      if (formTag.length) {
        const priceTag = formTag.find("p").first();
        if (priceTag.length) {
          const priceText = priceTag.text();
          const priceValue = parseFloat(priceText.replace(/[^0-9.-]+/g, "")); // Strip non-numeric characters
          product.price = priceValue;
        }
      }

      const imgSrcset = $(item)
        .find("div.product-image__container img")
        .attr("srcset");
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
      summary: { count: totalItems, shopName: ShopName.TESCO },
    };
  } catch (error) {
    console.error("Error fetching and parsing data:", error);
    return { products: [], summary: { count: 0, shopName: ShopName.TESCO } };
  }
}

async function scrapeSuprvalue(query: string) {
  // Code to scrape Suprvalue
  // Return { products, summary }
}

async function scrapeAldi(query: string) {
  const url = `https://groceries.aldi.ie/en-GB/Search?keywords=${query}`;
  const headers = {
    // ... your headers here ...
  };

  try {
    const response = await axios.get(url, { headers });

    const dom = new JSDOM(response.data);
    const document = dom.window.document;

    const totalItems = (() => {
      const productTab = document.querySelector(
        "li#ProductSearchMenuTab a.active"
      );
      const resultText = productTab?.textContent || "";
      const match = resultText.match(/\d+/);
      return match ? parseInt(match[0]) : 0;
    })();

    const products = (() => {
      const rows = document.querySelectorAll("div#vueSearchResults .row");
      let products: Product[] = [];

      rows.forEach((prod) => {
        let product: Product = {
          name: "",
          price: 0,
          imgSrc: undefined,
          shopName: ShopName.ALDI, // Assuming you have this enum defined
        };

        const nameElement = prod.querySelector(
          '[data-qa="search-product-title"]'
        );
        const priceElement = prod.querySelector(".product-tile-price .h4 span");
        const imageElement = prod.querySelector("img");

        product.name = nameElement
          ? nameElement.getAttribute("title") || ""
          : "";
        product.price = priceElement
          ? parseFloat(priceElement.textContent?.trim() || "0")
          : 0;
        product.imgSrc = imageElement
          ? imageElement.getAttribute("src") || undefined
          : undefined;

        if (product.name !== "" && product.price > 0) {
          products.push(product);
        }
      });

      return products;
    })();

    console.log(products);

    return {
      products: products,
      summary: { count: totalItems, shopName: ShopName.ALDI },
    };
  } catch (error) {
    console.error("Error fetching and parsing data:", error);
    return { products: [], summary: { count: 0, shopName: ShopName.ALDI } };
  }
}

// async function scrapeAldi(query: string) {
//   const headers = {
//     authority: "groceries.aldi.ie",
//     accept:
//       "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
//     "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
//     "cache-control": "max-age=0",
//     cookie:
//       'ak_bmsc=0FBB0E31BE850178F2D31F827C6BB78C~000000000000000000000000000000~YAAQzyRIF0xCF8+JAQAAHr1v2hSwB026R9UTLOjb3yoA2jrVtn7KSK6OQdgXsZQmKHaxVRlQm+xfnjHLQf0RB1O/jQZFZdntSzLpR/gjiHcuVzJR+pIhQD2ZoG3WUgkJQ2mrDxVeVc3fRHQ/KjVoE6yry9wTzUtJTpJijXpSL0KUgue86wyOJcbZ5zy86Bwx6dWa7TKRowGj4jDAwaAlIJmBu+SSsc3/c8+xJ8g9k/smHkI5j3PzMgQ7aHsiAR1KMrGIcz0Hd0tz0jiA9RcTqa3fPlxklewZ+fSAa1e6tYyXOOWd2oxuH6N65QXMqBD5LmRbQgTuZjEiieDjmMpPQUf2lS6+CncdfvlWrAi4jJZRXOHpyfbaR/h48G9Rc9k/q4oZXg4FUjwSLukvnvUtMNIO8EnF8/UPchybxf1dglOq0/euqLBfkWzc3XFVNeAg7eXrCkIIzxiAxwzLWAzJMzzhuQ6TimqngGMPFCIb/JsH1x3ysWYP; adobeujs-optin=%7B%22aam%22%3Atrue%2C%22adcloud%22%3Atrue%2C%22aa%22%3Atrue%2C%22campaign%22%3Atrue%2C%22ecid%22%3Atrue%2C%22livefyre%22%3Atrue%2C%22target%22%3Atrue%2C%22mediaaa%22%3Atrue%7D; OptanonAlertBoxClosed=2023-08-09T13:15:05.720Z; _gcl_au=1.1.1972710460.1691586906; AMCVS_95446750574EBBDF7F000101%40AdobeOrg=1; _ga=GA1.2.1005301742.1691586906; _gid=GA1.2.1447183757.1691586906; s_cc=true; aam_uuid=68164202567709005542337412241962537642; AMCV_95446750574EBBDF7F000101%40AdobeOrg=-1124106680%7CMCMID%7C67754901530110785602373258956633617728%7CMCAAMLH-1692191722%7C6%7CMCAAMB-1692191722%7CRKhpRz8krg2tLO6pguXWp5olkAcUniQYPHaMWWgdJ3xzPWQmdj0y%7CMCOPTOUT-1691594122s%7CNONE%7CMCAID%7CNONE%7CvVersion%7C5.2.0%7CMCIDTS%7C19579; visid_incap_2476515=qI8knzfdR2iryTbpOyHby6eR02QAAAAAQUIPAAAAAABZXTbrUpvzMLn6MU93XYQP; nlbi_2476515=nXlYDWgYjD8as3DDKHuTygAAAABXsvQqXrZJrWx3UFNJJL6X; aam_uuid=68164202567709005542337412241962537642; .CUST_a763fb4a-0224-4ca8-bdaa-a33a4b47a026=1|uoVdSy2XBNSmV/m+9qRGBjzGXxgxaFOEtqTAw21hD+aQBKNozm0y78LupZUhtq3iU1QBR+yeblhaWm7XAWz7PnC3PpgEyNZ2BGJh34RQm9yc4mEtSokVlmiQEFvGMqkBF3iE+zbVtIUdh+Jd3J8DHJ7Ewe9wST2uknUNzJ1fr9JKnZEE3L84x1jYzwP9vqFIu6VVeFjqjKI8Eidxftr5hOKkJMINFhxJL6oe5gb8q58He/NNsxJ8U2juks/owO+fCRq0ZlMuGKCHVvz/hovw8u2zA+1JsVmUEVCECC8X5wkUyasVLc7DZ/V23q5suS1wRr341fMV3mgYHjg5IsdcYTr2Glp4VYcTvdKq74lWk7F2GqvKVVJxuhkn9HrS44odWtQigYP60JVMkUOpEPLUSspZNjuYb3b+Yz87ry5pMgU5dz85wWgekKKlF71GRg3mZo5PCDfR9n86aM3Q1HqxUB6knuD7dj3KBkiDxcDAMIosehT54lMyp4iVr9nhkmBXq2cOpH8/D1s7ONiBuO3b40lv05SGLyZAt/n1Dc7sAprshdq1HjSw7uWjWrO4ppPPVmAS4PG8BFZ2gF5cHQ8wKOZdelgDJp8SzEOPbemWSoJpY4tXvFKR42SQf4kOEjxK; _hjSessionUser_2365630=eyJpZCI6IjZkNjI2MDIzLTg2MDAtNWNmMy05MDUwLTVhMGY3MzNhYjM5ZCIsImNyZWF0ZWQiOjE2OTE1ODY5ODU0MjgsImV4aXN0aW5nIjp0cnVlfQ==; s_ips=965; s_tp=1100; RT="z=1&dm=aldi.ie&si=tcpneopjuc&ss=ll3r5zf7&sl=0&tt=0"; bm_sv=4C7F1587AD4A9915E385B3CC345E95DF~YAAQrSVIF9jfx9CJAQAAcf902hQVMpI0YQPlPoduPijSrbvN2Ieb/cNWv5yfrnWXHfHQT+sNWjjXo6nM2frhg5qk9+iqGCMTD/YBDvGmUkmvOcBthpA4wkwg92wBuZN1zIlwFJMDJdfb39/6lVRiJSq4w782D4SKYOusjZw/H8RPjTE/hKHTKfPUNeINp3kpLWBCLW5iVesKbh/zsTbm42wlQXrfNN2IAZQT9bWZxI3GPEdV7dpDo6QFFmdEww==~1; s_ppv=%2Fsearch%2C88%2C88%2C965%2C1%2C1; _hjIncludedInSessionSample_2365630=0; OptanonConsent=isIABGlobal=false&datestamp=Wed+Aug+09+2023+14%3A22%3A08+GMT%2B0100+(Irish+Standard+Time)&version=6.7.0&hosts=&consentId=5dfddb8d-2cf5-42eb-9e94-c1df372577bc&interactionCount=1&landingPath=NotLandingPage&groups=C0001%3A1%2CC0002%3A1%2CC0003%3A1%2CC0004%3A1&geolocation=%3B&AwaitingReconsent=false; s_sq=%5B%5BB%5D%5D; gpv_pn=%2Fen-GB%2FSearch; s_vnum=1723122906110%26vn%3D2; s_invisit=true; s_nr=1691589570482-Repeat; _hjMinimizedPolls=910308; incap_ses_1381_2476515=UMCtQNBCimKKPyU5Yk0qE8Sb02QAAAAA8yo+nGrC52chqPtMnG4h6g==',
//     "sec-ch-ua":
//       '"Not/A)Brand";v="99", "Google Chrome";v="115", "Chromium";v="115"',
//     "sec-ch-ua-mobile": "?0",
//     "sec-ch-ua-platform": '"macOS"',
//     "sec-fetch-dest": "document",
//     "sec-fetch-mode": "navigate",
//     "sec-fetch-site": "none",
//     "sec-fetch-user": "?1",
//     "upgrade-insecure-requests": "1",
//     "user-agent":
//       "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
//   };
//   try {
//     const response = await fetch(
//       `https://groceries.aldi.ie/en-GB/Search?keywords=${query}`,
//       {
//         headers: headers,
//         cache: "no-store",
//       }
//     );

//     const html = await response.text();
//     const $ = load(html);

//     // Extract the total number of items
//     const productTab = $("li#ProductSearchMenuTab a.active");
//     const resultText = productTab.text();
//     const match = resultText.match(/\d+/);
//     const totalItems = match ? parseInt(match[0]) : 0;

//     // Extract the items
//     let products: Product[] = [];

//     const rows = $("div#vueSearchResults .row");
//     rows.each((index, prod) => {
//       let product: Product = {
//         name: "",
//         price: 0,
//         imgSrc: undefined,
//         shopName: ShopName.ALDI,
//       };

//       const nameElement = $(prod).find('[data-qa="search-product-title"]');
//       const priceElement = $(prod).find(".product-tile-price .h4 span");
//       const imageElement = $(prod).find("img");

//       console.log(nameElement.text());
//       product.name = nameElement ? nameElement.attr("title") || "" : "";
//       product.price = priceElement ? parseFloat(priceElement.text().trim()) : 0;
//       product.imgSrc = imageElement ? imageElement.attr("src") : undefined;

//       if (product.name !== "" && product.price > 0) {
//         products.push(product);
//       }
//     });
//     console.log(products);
//     return {
//       products: products,
//       summary: { count: totalItems, shopName: ShopName.ALDI },
//     };
//   } catch (error) {
//     console.error("Error fetching and parsing data:", error);
//     return { products: [], summary: { count: 0, shopName: ShopName.ALDI } };
//   }
// }
