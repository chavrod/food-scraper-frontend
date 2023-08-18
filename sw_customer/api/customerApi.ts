import apiClient from "./apiClient";

const getProducts = (params: { query: string; page: string }) => {
  const encodedQuery = encodeURIComponent(params.query);
  const encodedPage = encodeURIComponent(params.page);

  return apiClient.get(`cached_products_page/${encodedQuery}/${encodedPage}`);
};

const customerApi = { getProducts };

export default customerApi;
