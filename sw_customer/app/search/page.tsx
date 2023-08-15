// Intenral Components
import Pagination from "./Pagination";
import SearchForm from "./SearchForm";
import SearchResults from "./SearchResults";
// Intenral Utils
import scrapeData from "@/utils/scrapeData";
import checkCache from "@/utils/checkCache";
import {
  Product,
  ScrapeSummary,
  ShopName,
  SearchMetaData,
} from "@/utils/types";

async function searchProducts(searchText = "", page = "") {
  if (searchText === "") return;
  return scrapeData({ query: searchText, page: page });
}

type Props = {
  searchParams?: {
    q?: string | undefined;
    p?: string | undefined;
    cached?: string | undefined;
  };
};

export default async function Home(params: Props) {
  const isCached = params.searchParams?.cached;
  const searchText = params.searchParams?.q;
  const searchPage = params.searchParams?.p;

  let products: Product[] = [];
  let summaryPerShop: ScrapeSummary[] = [];
  let searchMetaData = {};

  let cachedResults;

  if (searchText && searchText !== "") {
    cachedResults = await checkCache({
      query: searchText,
      page: searchPage || "1",
    });

    if (cachedResults) {
      ({ products, summaryPerShop, searchMetaData } = cachedResults);
    } else {
      const results = await scrapeData({
        query: searchText,
        page: searchPage || "1",
      });

      if (results) {
        ({ products, summaryPerShop, searchMetaData } = results);
      }
    }
  }

  return (
    <>
      {/* <SearchForm searchText={searchText || ""} /> */}
      <SearchResults
        searchText={searchText || ""}
        isCachedResults={cachedResults ? true : false}
        products={products}
        summaryPerShop={summaryPerShop}
        searchMetaData={searchMetaData}
      />
      <Pagination searchMetaData={searchMetaData} />
    </>
  );
}
