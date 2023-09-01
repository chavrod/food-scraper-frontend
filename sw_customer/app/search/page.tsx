// Intenral Components
import Pagination from "./Pagination";
import SearchResults from "./SearchResults";
// Intenral Utils
import getData from "@/api/getData";
import customerApi from "@/api/customerApi";
import {
  Product,
  ScrapeSummary,
  ScrapeStats,
  ShopName,
  SearchMetaData,
} from "@/utils/types";

type SearchProps = {
  searchParams?: {
    query?: string | undefined;
    page?: string | undefined;
    is_relevant_only?: string | undefined;
  };
};

export default async function Home(params: SearchProps) {
  const searchText = params.searchParams?.query;
  const searchPage = params.searchParams?.page;
  const isRelevantOnly = params.searchParams?.is_relevant_only;

  const { data, error } = await getData({
    params: {
      query: searchText || "",
      page: searchPage || "1",
      isRelevantOnly: isRelevantOnly || "true",
    },
    apiFunc: customerApi.getProducts,
    unpackName: "cached_products_page",
  });

  let products: Product[] | undefined;
  let searchMetaData: SearchMetaData = {
    currentPage: 0,
    totalPages: 0,
    keyword: "",
    isRelevantOnly: true,
  };
  let summaryPerShop: ScrapeSummary[] = [];
  let scrapeStats: ScrapeStats = { averageTimeSeconds: null };

  if (data && "results" in data && "metadata" in data) {
    products = data.results;
    searchMetaData = {
      currentPage: data.metadata.currentPage,
      totalPages: data.metadata.totalPages,
      keyword: data.metadata.keyword,
      isRelevantOnly: data.metadata.isRelevantOnly,
    };
  } else if (data && "averageTimeSeconds" in data) {
    scrapeStats.averageTimeSeconds = data.averageTimeSeconds;
  }

  return (
    <>
      {/* <SearchForm searchText={searchText || ""} /> */}
      <SearchResults
        searchText={searchText || ""}
        products={products}
        summaryPerShop={summaryPerShop}
        searchMetaData={searchMetaData}
        averageScrapingTime={scrapeStats.averageTimeSeconds}
      />
      <Pagination searchMetaData={searchMetaData} />
    </>
  );
}
