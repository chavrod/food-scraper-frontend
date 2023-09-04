import apiClient from "./apiClient";
import { SearchParams } from "@/utils/types";

const getProducts = (params: SearchParams) => {
  const encodedQuery = encodeURIComponent(params.query);
  const encodedPage = encodeURIComponent(params.page);
  const encodedisRelevantOnly = encodeURIComponent(params.is_relevant_only);

  return apiClient.get(
    `cached_products_page/${encodedQuery}/${encodedPage}/${encodedisRelevantOnly}`
  );
};

const customerApi = { getProducts };

export default customerApi;
