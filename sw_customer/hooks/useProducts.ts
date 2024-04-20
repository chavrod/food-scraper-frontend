import { useQuery } from "@tanstack/react-query";
import { useRouter, NextRouter } from "next/router";
import { normalizeQueryParams } from "@/utils/paramsUtil";
import searchedProductsApi from "@/utils/searchedProductsApi";
import {
  SearchedProduct,
  SearchedProductMetadata,
  SearchParams,
} from "@/types/customer_types";

export type CustomRouter = NextRouter & {
  query: SearchParams;
};

function useSearchedProducts() {
  const router = useRouter() as CustomRouter;
  const accessToken = undefined; // Define or obtain the access token as needed

  const queryParams = normalizeQueryParams(router.query);

  const productsQuery = useQuery({
    queryKey: ["products", queryParams],
    enabled: Boolean(queryParams?.query),
    queryFn: () => searchedProductsApi.list(accessToken, queryParams),
  });

  const isUpdatingProduct = Boolean(
    productsQuery?.data?.metadata &&
      "average_time_seconds" in productsQuery.data.metadata
      ? productsQuery.data.metadata.average_time_seconds
      : undefined
  );

  const searchedProducts = !isUpdatingProduct
    ? (productsQuery?.data?.data as SearchedProduct[] | undefined)
    : undefined;

  const searchedProductsMetadata = !isUpdatingProduct
    ? (productsQuery?.data?.metadata as SearchedProductMetadata | undefined)
    : undefined;

  return {
    query: queryParams?.query,
    isLoading: productsQuery.isLoading,
    isError: productsQuery.isError,
    error: productsQuery.error,
    searchedProducts,
    searchedProductsMetadata,
    isUpdatingProduct,
  };
}

export default useSearchedProducts;
