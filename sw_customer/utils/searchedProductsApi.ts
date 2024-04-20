import {
  SearchedProduct,
  SearchedProductMetadata,
  ScrapeStatsForCustomer,
} from "@/types/customer_types";
import apiClient from "./apiClient";

type UpToDateProductResponse = {
  data: SearchedProduct[];
  metadata: SearchedProductMetadata;
};

type OutdatedProductResponse = {
  data: {};
  metadata: ScrapeStatsForCustomer;
};

const list = (
  accessToken: string | undefined,
  params?: { [key: string]: string | number }
): Promise<UpToDateProductResponse | OutdatedProductResponse> =>
  apiClient.get("products/", accessToken, params);

const searchedProductsApi = { list };

export default searchedProductsApi;
