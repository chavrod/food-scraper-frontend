import React, { createContext, useContext, ReactNode, useEffect } from "react";
import { BasketItem, BasketItemMetadata } from "@/types/customer_types";
import usePaginatedApi, { UseApiReturnType } from "@/utils/usePaginatedApi";
import { useSessionContext } from "@/Context/SessionContext";
import {
  CachedProductsPage,
  CachedProductsPageMetadata,
  ScrapeStatsForCustomer,
} from "@/types/customer_types";
import productsPagesApi from "@/utils/productsPagesApi";

import basketItemsApi from "@/utils/basketItemsApi";

interface GlobalContextType {
  basketItems: UseApiReturnType<BasketItem[], BasketItemMetadata>;
  productsPage: UseApiReturnType<
    | [CachedProductsPage, CachedProductsPageMetadata]
    | [{}, ScrapeStatsForCustomer],
    any
  >;
  averageScrapingTime: any;
  cachedProductsPage: CachedProductsPage | undefined;
  cachedProductsPageMetadata: CachedProductsPageMetadata | undefined;
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

  const productsPage = usePaginatedApi<
    | [CachedProductsPage, CachedProductsPageMetadata]
    | [{}, ScrapeStatsForCustomer]
  >({
    apiFunc: productsPagesApi.get,
    onSuccess: () => {},
    accessToken,
  });

  const averageScrapingTime =
    productsPage?.responseData?.metaData &&
    "average_time_seconds" in productsPage?.responseData?.metaData
      ? productsPage?.responseData?.metaData.average_time_seconds
      : undefined;

  const cachedProductsPage = !averageScrapingTime
    ? (productsPage?.responseData?.data as CachedProductsPage | undefined)
    : undefined;

  const cachedProductsPageMetadata = !averageScrapingTime
    ? (productsPage?.responseData?.metaData as
        | CachedProductsPageMetadata
        | undefined)
    : undefined;

  return (
    <GlobalContext.Provider
      value={{
        basketItems,
        productsPage,
        averageScrapingTime,
        cachedProductsPage,
        cachedProductsPageMetadata,
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
