import React, {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useMemo,
} from "react";
import usePaginatedApi, { UseApiReturnType } from "@/utils/usePaginatedApi";
import { useSessionContext } from "@/Context/SessionContext";
import {
  SearchedProduct,
  SearchedProductMetadata,
  ScrapeStatsForCustomer,
  BasketItem,
  BasketItemMetadata,
} from "@/types/customer_types";
import searchedProductsApi from "@/utils/searchedProductsApi";

import basketItemsApi from "@/utils/basketItemsApi";

interface GlobalContextType {
  basketItems: UseApiReturnType<BasketItem[], BasketItemMetadata>;
  requestedProducts: UseApiReturnType<
    [SearchedProduct[], SearchedProductMetadata] | [{}, ScrapeStatsForCustomer],
    any
  >;
  averageScrapingTime: any;
  searchedProducts: SearchedProduct[] | undefined;
  searchedProductMetadata: SearchedProductMetadata | undefined;
}

// Define the props for GlobalProvider
interface GlobalProviderProps {
  children: ReactNode;
}

// Create the context
export const GlobalContext = createContext<GlobalContextType | undefined>(
  undefined
);

// Provide the context
export function GlobalProvider({ children }: GlobalProviderProps) {
  const { session, isLoading } = useSessionContext();
  const accessToken = session?.access_token;

  const basketItems = usePaginatedApi<BasketItem[], BasketItemMetadata>({
    apiFunc: basketItemsApi.list,
    onSuccess: () => {},
    accessToken,
  });

  useEffect(() => {
    if (session) {
      basketItems.request();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const requestedProducts = usePaginatedApi<
    [SearchedProduct[], SearchedProductMetadata] | [{}, ScrapeStatsForCustomer]
  >({
    apiFunc: searchedProductsApi.list,
    onSuccess: () => {},
    accessToken,
  });

  const averageScrapingTime =
    "average_time_seconds" in (requestedProducts?.responseData?.metaData || {})
      ? requestedProducts.responseData.metaData.average_time_seconds
      : undefined;

  const searchedProducts = !averageScrapingTime
    ? (requestedProducts?.responseData?.data as SearchedProduct[] | undefined)
    : undefined;

  const searchedProductMetadata = !averageScrapingTime
    ? (requestedProducts?.responseData?.metaData as
        | SearchedProductMetadata
        | undefined)
    : undefined;

  const contextValue = useMemo(
    () => ({
      basketItems,
      requestedProducts,
      averageScrapingTime,
      searchedProducts,
      searchedProductMetadata,
    }),
    [
      basketItems,
      requestedProducts,
      averageScrapingTime,
      searchedProducts,
      searchedProductMetadata,
    ]
  );

  return (
    <GlobalContext.Provider value={contextValue}>
      {children}
    </GlobalContext.Provider>
  );
}

export const useGlobalContext = () => {
  const context = useContext(GlobalContext);

  if (context === undefined) {
    throw new Error("useGlobalContext must be used within a GlobalProvider");
  }

  return context;
};
