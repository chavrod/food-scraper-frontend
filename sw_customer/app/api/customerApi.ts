import apiClient from "./apiClient";
import { SearchParams } from "@/utils/types";

const getProducts = (params: SearchParams) => {
  console.log("PARAMS", params);
  return apiClient.get("cached_products_page/", {
    query: params.query,
    page: params.page.toString(),
    is_relevant_only: params.is_relevant_only.toString(),
  });
};

const customerApi = { getProducts };

export default customerApi;
