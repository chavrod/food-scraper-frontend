// Intenral Components
import Pagination from "./Pagination";
import SearchForm from "./SearchForm";
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

type Props = {
  searchParams?: {
    query?: string | undefined;
    params?: string | undefined;
  };
};

export default async function Home(params: Props) {
  const searchText = params.searchParams?.query;
  const searchPage = params.searchParams?.params;

  const { data, error } = await getData<
    Product[],
    { query: string; page: string }
  >({
    params: { query: searchText || "", page: searchPage || "1" },
    apiFunc: customerApi.getProducts,
    unpackName: "products",
  });

  let products: Product[] | undefined;
  let summaryPerShop: ScrapeSummary[] = [];
  let searchMetaData = {};
  let scrapeStats: ScrapeStats = { averageTimeSeconds: null };

  if (Array.isArray(data)) {
    products = data;
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
