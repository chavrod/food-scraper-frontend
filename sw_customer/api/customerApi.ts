import apiClient from "./apiClient";

const getProducts = (params: {
  query: string;
  page: string;
  isRelevantOnly: string;
}) => {
  const encodedQuery = encodeURIComponent(params.query);
  const encodedPage = encodeURIComponent(params.page);
  const encodedisRelevantOnly = encodeURIComponent(params.page);

  return apiClient.get(
    `cached_products_page/${encodedQuery}/${encodedPage}/${encodedisRelevantOnly}`
  );
};

const customerApi = { getProducts };

export default customerApi;
