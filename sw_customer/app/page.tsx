// Intenral Components
import SearchResults from "../Components/SearchResults";
// Intenral Utils
import getData from "@/app/api/getData";
import customerApi from "@/app/api/customerApi";
import { ScrapeStats, SearchMetaData } from "@/utils/types";
import { CachedProductsPage } from "@/types/customer_types";

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

  const transformData = async (
    res: Response
  ): Promise<CachedProductsPage | ScrapeStats> => {
    const jsonRes = await res.json();

    if (res.status === 206) {
      return { averageTimeSeconds: jsonRes.averageTimeSeconds };
    } else {
      const mappedData: CachedProductsPage = jsonRes;
      return mappedData;
    }
  };

  const { data } = await getData<
    CachedProductsPage | ScrapeStats,
    SearchParams
  >({
    params: params,
    apiFunc: customerApi.getProducts,
    transformFunc: transformData,
  });

  const cachedProductsPage = data && "results" in data ? data : undefined;
  const averageScrapingTime =
    data && "averageTimeSeconds" in data ? data.averageTimeSeconds : undefined;

  return (
    <>
      <SearchResults
        searchText={searchParams.query}
        cachedProductsPage={cachedProductsPage}
        averageScrapingTime={averageScrapingTime}
      />
    </>
  );
}
