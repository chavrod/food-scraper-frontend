import apiClient from "./apiClient";

const get = (
  accessToken: string | undefined,
  params?: { [key: string]: string | number }
) => apiClient.get("cached_products_page/", accessToken, params);

const searchedProductsApi = { get };

export default searchedProductsApi;
