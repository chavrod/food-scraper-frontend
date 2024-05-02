import { useQuery } from "@tanstack/react-query";
import { useRouter, NextRouter } from "next/router";
import { normalizeQueryParams } from "@/utils/paramsUtil";
import basketItemsApi from "@/utils/basketItemsApi";
import { useSessionContext } from "@/Context/SessionContext";

function useBasketItems() {
  const router = useRouter();

  const { session } = useSessionContext();
  const accessToken = session?.access_token;

  const queryParams = normalizeQueryParams(
    router.query,
    router.pathname,
    "/basket"
  );

  const basketItemsQuery = useQuery({
    queryKey: ["basket_items", queryParams],
    enabled: Boolean(accessToken),
    queryFn: () => basketItemsApi.list(accessToken, queryParams),
    staleTime: Infinity,
    gcTime: 60 * 60 * 1000,
  });

  const basketItemsData = basketItemsQuery.data?.data;
  const basketItemsMetaData = basketItemsQuery.data?.metadata;
  const basketQty = basketItemsMetaData?.total_quantity || 0;

  return {
    queryParams,
    isLoading: basketItemsQuery.isLoading,
    isError: basketItemsQuery.isError,
    error: basketItemsQuery.error,
    basketItemsData,
    basketItemsMetaData,
    basketQty,
  };
}

export default useBasketItems;
