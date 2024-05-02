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

const list = (
  accessToken: string | undefined,
  params?: { [key: string]: string | number }
): Promise<ExistingProductResponse | NoProductResponse> =>
  apiClient.get("products/", accessToken, params);

const searchedProductsApi = { list };

export default searchedProductsApi;
