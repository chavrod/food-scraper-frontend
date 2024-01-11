"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useMediaQuery } from "@mantine/hooks";
import { BasketItem } from "@/types/customer_types";
import { BasketItemMetaData } from "@/types/customer_plus_types";
import useApi, { UseApiReturnType } from "@/utils/useApi";

import basketItemsApi from "@/app/api/basketItemsApi";

interface GlobalContextType {
  basketItems: UseApiReturnType<BasketItem[], BasketItemMetaData>;
  isLargerThanLg: boolean;
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
  const basketItems = useApi<BasketItem[], BasketItemMetaData>({
    apiFunc: basketItemsApi.list,
    onSuccess: () => {},
  });

  const isLargerThanLg = useMediaQuery("(min-width: 1184px)");

  return (
    <GlobalContext.Provider value={{ basketItems, isLargerThanLg }}>
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
