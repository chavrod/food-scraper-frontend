import apiClient from "./apiClient";

const get = (params?: { [key: string]: string | number }) =>
  apiClient.get("cached_products_page/", params);

const productsPagesApi = { get };

export default productsPagesApi;
