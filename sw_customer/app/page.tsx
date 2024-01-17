// Intenral Components
import SearchResults from "../Components/SearchResults";
// Intenral Utils
import getData from "@/app/api/getData";
import customerApi from "@/app/api/customerApi";
import { ScrapeStats, SearchParams, SearchMetaData } from "@/utils/types";
import { Product } from "@/types/customer_types";

import "../styles/global.css";

// TODO: Temporary
type ProductData = {
  results: Product[];
  metadata: SearchMetaData;
};

export default async function Home(outerParams: {
  params: any;
  searchParams: SearchParams;
}) {
  let searchParams: SearchParams = {
    query: outerParams.searchParams?.query || "",
    page: outerParams.searchParams?.page || "1",
    is_relevant_only: outerParams.searchParams?.is_relevant_only || true,
  };

  const transformData = async (
    res: Response
  ): Promise<ProductData | ScrapeStats> => {
    const jsonRes = await res.json();

    if (res.status === 206) {
      return { averageTimeSeconds: jsonRes.averageTimeSeconds };
    } else {
      const mappedData: ProductData = {
        results: jsonRes.results,
        metadata: {
          currentPage: jsonRes.page,
          totalPages: jsonRes.total_pages,
          keyword: jsonRes.query,
          isRelevantOnly: jsonRes.is_relevant_only,
        },
      };
      return mappedData;
    }
  };

  const { data } = await getData<
    ProductData | ScrapeStats,
    SearchParams
  >({
    params: searchParams,
    apiFunc: customerApi.getProducts,
    transformFunc: transformData,
  });

  const products = data && "results" in data ? data.results : undefined;
  const searchMetaData = data && "metadata" in data ? data.metadata : undefined;
  const averageScrapingTime =
    data && "averageTimeSeconds" in data ? data.averageTimeSeconds : undefined;

  return (
    <>
      <SearchResults
        searchText={searchParams.query}
        products={products}
        searchMetaData={searchMetaData}
        averageScrapingTime={averageScrapingTime}
      />
    </>
  );
}
