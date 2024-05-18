import {
  SearchedProduct,
  SearchedProductMetadata,
} from "@/types/customer_types";
import apiClient from "./apiClient";

type ExistingProductResponse = {
  data: SearchedProduct[];
  metadata: SearchedProductMetadata;
};

type NoProductResponse = {
  data: {};
  metadata: { scraping_under_way: boolean };
};

const list = async (
  accessToken: string | undefined,
  params?: { [key: string]: string | number }
): Promise<ExistingProductResponse | NoProductResponse> => {
  const response = await apiClient.get("products/", accessToken, params);
  const data = await response.json();
  return data as ExistingProductResponse | NoProductResponse;
};

const searchedProductsApi = { list };

export default searchedProductsApi;
