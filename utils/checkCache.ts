// Intenral Utils
import {
  Product,
  ScrapeSummary,
  ShopName,
  SearchMetaData,
} from "@/utils/types";
import { getCachedResults } from "@/utils/cache";

type ScrapeDataResult =
  | {
      products: Product[];
      summaryPerShop: ScrapeSummary[];
      searchMetaData: SearchMetaData;
    }
  | false;

export default async function checkCache({
  query,
  page,
}: {
  query: string;
  page: string;
}): Promise<ScrapeDataResult> {
  const serialisedPage = page || "1";
  const cachedProducts = await getCachedResults(query, serialisedPage);
  const cachedTotalPages = await getCachedResults(query, "totalPages");

  const cachedSummaryPerShop = await Promise.all(
    Object.values(ShopName).map(async (shopName) => {
      const count = await getCachedResults(query, shopName);
      return { shopName, count };
    })
  );

  if (cachedProducts && cachedTotalPages) {
    console.log("FOUND CACHED RESULTS!");
    console.log("cachedProducts", cachedProducts);
    console.log("cachedTotalPages", cachedTotalPages);
    console.log("cachedSummaryPerShop", cachedSummaryPerShop);
    return {
      products: cachedProducts,
      summaryPerShop: cachedSummaryPerShop,
      searchMetaData: {
        currentPage: Number(serialisedPage),
        totalPages: cachedTotalPages,
        keyword: query,
      },
    };
  }
  console.log("CACHED RESULTS NOT FOUND!");
  return false; // return false if the cached results are not found
}
