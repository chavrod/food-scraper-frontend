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

  console.log("CUSTOMER API: ", customerApi.getProducts);

  const { data, error } = await getData<
    Product[],
    { query: string; page: string }
  >({
    params: { query: searchText || "", page: searchPage || "1" },
    apiFunc: customerApi.getProducts,
    unpackName: "products",
  });

  let products: Product[] = [];
  let summaryPerShop: ScrapeSummary[] = [];
  let searchMetaData = {};

  if (Array.isArray(data)) {
    const products = data;
    // handle products array
  } else if (data && "averageTime" in data) {
    const averageTime = data.averageTime;
    // handle averageTime value
  }

  let cachedResults;

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
