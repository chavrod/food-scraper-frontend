import apiClient from "./apiClient";

const getProducts = (params: { [key: string]: any }) => {
  const stringParams: { [key: string]: string } = {};

  for (const key in params) {
    const value = params[key];
    if (value !== undefined) {
      stringParams[key] = value.toString();
    }
  }

  return apiClient.get("cached_products_page/", stringParams);
};

const customerApi = { getProducts };

export default customerApi;
