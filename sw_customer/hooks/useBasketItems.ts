import { useQuery } from "@tanstack/react-query";
import { useRouter, NextRouter } from "next/router";
import { normalizeQueryParams } from "@/utils/paramsUtil";
import basketItemsApi from "@/utils/basketItemsApi";
import { SearchParams } from "@/types/customer_types";
import { useSessionContext } from "@/Context/SessionContext";
import useDeepCompareMemo from "@/utils/useDeepCompareMemo";

export type CustomRouter = NextRouter & {
  query: SearchParams;
};

function useBasketItems() {
  const router = useRouter() as CustomRouter;

  const { session } = useSessionContext();
  const accessToken = session?.access_token;

  const queryParams = normalizeQueryParams(
    router.query,
    router.pathname,
    "/basket"
  );
  const memoizedQueryParams = useDeepCompareMemo(
    () => queryParams,
    [queryParams]
  );

  const basketItemsQuery = useQuery({
    queryKey: ["basket_items", memoizedQueryParams],
    enabled: Boolean(accessToken),
    queryFn: () => basketItemsApi.list(accessToken, memoizedQueryParams),
    staleTime: Infinity,
  });

  const basketItemsData = basketItemsQuery.data?.data;
  const basketItemsMetaData = basketItemsQuery.data?.metadata;
  const basketQty = basketItemsMetaData?.total_quantity || 0;

  return {
    memoizedQueryParams: memoizedQueryParams,
    isLoading: basketItemsQuery.isLoading,
    isError: basketItemsQuery.isError,
    error: basketItemsQuery.error,
    basketItemsData,
    basketItemsMetaData,
    basketQty,
  };
}

export default useBasketItems;
