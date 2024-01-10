// Intenral Components
import SearchResults from "../Components/SearchResults";
// Intenral Utils
import getData from "@/app/api/getData";
import customerApi from "@/app/api/customerApi";
import {
  Product,
  ScrapeStats,
  SearchParams,
  SearchMetaData,
} from "@/utils/types";

import "../styles/global.css";

export default async function Home(outerParams: {
  params: any;
  searchParams: SearchParams;
}) {
  let searchParams: SearchParams = {
    query: outerParams.searchParams?.query || "",
    page: outerParams.searchParams?.page || "1",
    is_relevant_only: outerParams.searchParams?.is_relevant_only || true,
  };

  const { data, error } = await getData({
    params: searchParams,
    apiFunc: customerApi.getProducts,
  });

  let products: Product[] | undefined;
  let searchMetaData: SearchMetaData = {
    currentPage: 0,
    totalPages: 0,
    keyword: "",
    isRelevantOnly: true,
  };
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
      <SearchResults
        searchText={searchParams.query}
        products={products}
        searchMetaData={searchMetaData}
        averageScrapingTime={scrapeStats.averageTimeSeconds}
      />
    </>
  );
}
