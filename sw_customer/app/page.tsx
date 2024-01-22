// Intenral Components
import SearchResults from "../Components/SearchResults";
// Intenral Utils
import getData from "@/app/api/getData";
import customerApi from "@/app/api/customerApi";
import {
  CachedProductsPage,
  ScrapeStatsForCustomer,
} from "@/types/customer_types";

import "../styles/global.css";

export interface SearchParams {
  query: string;
  page: string;
  is_relevant_only: boolean;
}

export default async function Home({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  let params: SearchParams = {
    query: searchParams?.query || "",
    page: searchParams?.page || "1",
    is_relevant_only: searchParams?.is_relevant_only || true,
  };

  const { data, errorMessage } = await getData<
    CachedProductsPage | ScrapeStatsForCustomer,
    SearchParams
  >({
    params: params,
    apiFunc: customerApi.getProducts,
  });

  const cachedProductsPage =
    !errorMessage && data && "results" in data ? data : undefined;
  const averageScrapingTime =
    !errorMessage && data && "average_time_seconds" in data
      ? data.average_time_seconds
      : undefined;

  return (
    <>
      <SearchResults
        searchText={searchParams.query}
        cachedProductsPage={cachedProductsPage}
        averageScrapingTime={averageScrapingTime}
        errorMessage={errorMessage}
      />
    </>
  );
}
