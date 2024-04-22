import { useQuery } from "@tanstack/react-query";
import { useRouter, NextRouter } from "next/router";
import { normalizeQueryParams } from "@/utils/paramsUtil";
import basketItemsApi from "@/utils/basketItemsApi";
import { SearchParams } from "@/types/customer_types";
import { useSessionContext } from "@/Context/SessionContext";

export type CustomRouter = NextRouter & {
  query: SearchParams;
};

function useBasketItems() {
  const router = useRouter() as CustomRouter;

  const { session } = useSessionContext();
  const accessToken = session?.access_token;

  const queryParams = normalizeQueryParams(router.query);

  const basketItemsQuery = useQuery({
    queryKey: ["basket_items", queryParams],
    enabled: Boolean(accessToken),
    queryFn: () => basketItemsApi.list(accessToken, queryParams),
  });

  const basketItemsData = basketItemsQuery.data?.data;
  const basketItemsMetaData = basketItemsQuery.data?.metadata;
  const basketQty = basketItemsMetaData?.total_quantity || 0;

  return {
    query: queryParams?.query,
    isLoading: basketItemsQuery.isLoading,
    isError: basketItemsQuery.isError,
    error: basketItemsQuery.error,
    basketItemsData,
    basketItemsMetaData,
    basketQty,
  };
}

export default useBasketItems;
