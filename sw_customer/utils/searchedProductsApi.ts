import apiClient from "./apiClient";

const list = (
  accessToken: string | undefined,
  params?: { [key: string]: string | number }
) => apiClient.get("products/", accessToken, params);

const searchedProductsApi = { list };

export default searchedProductsApi;
