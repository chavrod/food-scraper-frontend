import { useQuery } from "@tanstack/react-query";
import { useRouter, NextRouter } from "next/router";
import { normalizeQueryParams } from "@/utils/paramsUtil";
import searchedProductsApi from "@/utils/searchedProductsApi";
import {
  SearchedProduct,
  SearchedProductMetadata,
  SearchedProductParams,
} from "@/types/customer_types";

export type CustomRouter = NextRouter & {
  query: SearchedProductParams;
};

function useSearchedProducts() {
  const router = useRouter() as CustomRouter;
  const accessToken = undefined; // Define or obtain the access token as needed

  const originalQueryParams = normalizeQueryParams(
    router.query,
    router.pathname,
    "/"
  );
  const { query, ...restWithoutQuery } = originalQueryParams;

  const productsQuery = useQuery({
    queryKey: ["products", query, restWithoutQuery],
    enabled: router.pathname === "/" && Boolean(query),
    queryFn: () => searchedProductsApi.list(accessToken, originalQueryParams),
    staleTime: 5 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const noProductButScrapingUnderWay = Boolean(
    productsQuery?.data?.metadata &&
      "scraping_under_way" in productsQuery.data.metadata
      ? productsQuery.data.metadata.scraping_under_way
      : undefined
  );

  const searchedProducts = !noProductButScrapingUnderWay
    ? (productsQuery?.data?.data as SearchedProduct[] | undefined)
    : undefined;

  const searchedProductsMetadata = !noProductButScrapingUnderWay
    ? (productsQuery?.data?.metadata as SearchedProductMetadata | undefined)
    : undefined;

  const isUpdateNeeded =
    searchedProductsMetadata && searchedProductsMetadata.is_update_needed;

  return {
    query: query,
    queryParams: restWithoutQuery,
    isLoading: productsQuery.isLoading,
    isError: productsQuery.isError,
    error: productsQuery.error,
    searchedProducts,
    searchedProductsMetadata,
    noProductButScrapingUnderWay,
    isUpdateNeeded,
  };
}

export default useSearchedProducts;
