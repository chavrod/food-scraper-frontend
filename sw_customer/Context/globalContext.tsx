import React, { createContext, useContext, ReactNode, useEffect } from "react";
import { BasketItem, BasketItemMetadata } from "@/types/customer_types";
import usePaginatedApi, { UseApiReturnType } from "@/utils/usePaginatedApi";
import { useSessionContext } from "@/Context/SessionContext";

import basketItemsApi from "@/utils/basketItemsApi";

interface GlobalContextType {
  basketItems: UseApiReturnType<BasketItem[], BasketItemMetadata>;
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

  return (
    <GlobalContext.Provider value={{ basketItems }}>
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
