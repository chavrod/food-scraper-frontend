import React, { createContext, useContext, ReactNode, useEffect } from "react";
import { BasketItem, BasketItemMetadata } from "@/types/customer_types";
import usePaginatedApi, { UseApiReturnType } from "@/utils/usePaginatedApi";
import { useSessionContext } from "@/Context/SessionContext";
import {
  SearchedProduct,
  SearchedProductMetadata,
  ScrapeStatsForCustomer,
} from "@/types/customer_types";
import productsPagesApi from "@/utils/productsPagesApi";

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
export const GlobalProvider: React.FC<GlobalProviderProps> = ({ children }) => {
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
  }, [session]);

  const requestedProducts = usePaginatedApi<
    [SearchedProduct[], SearchedProductMetadata] | [{}, ScrapeStatsForCustomer]
  >({
    apiFunc: productsPagesApi.get,
    onSuccess: () => {},
    accessToken,
  });

  const averageScrapingTime =
    requestedProducts?.responseData?.metaData &&
    "average_time_seconds" in requestedProducts?.responseData?.metaData
      ? requestedProducts?.responseData?.metaData.average_time_seconds
      : undefined;

  const searchedProducts = !averageScrapingTime
    ? (requestedProducts?.responseData?.data as SearchedProduct[] | undefined)
    : undefined;

  const searchedProductMetadata = !averageScrapingTime
    ? (requestedProducts?.responseData?.metaData as
        | SearchedProductMetadata
        | undefined)
    : undefined;

  return (
    <GlobalContext.Provider
      value={{
        basketItems,
        requestedProducts,
        averageScrapingTime,
        searchedProducts,
        searchedProductMetadata,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalContext = () => {
  const context = useContext(GlobalContext);

  if (context === undefined) {
    throw new Error("useGlobalContext must be used within a GlobalProvider");
  }

  return context;
};
