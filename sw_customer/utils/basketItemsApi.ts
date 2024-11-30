import { BasketItem, BasketItemMetadata } from "@/types/customer_types";
import apiClient from "./apiClient";

type BasketItemsResponse = {
  data: BasketItem[];
  metadata: BasketItemMetadata;
};

const list = async (
  accessToken: string | null,
  params?: { [key: string]: string | number }
): Promise<BasketItemsResponse> => {
  const response = await apiClient.get("basket_items/", accessToken, params);
  const data = await response.json();
  return data as BasketItemsResponse;
};

const toggleChecked = (accessToken: string | null, id: number) =>
  apiClient.post(`basket_items/${id}/toggle_checked/`, accessToken);

const addItemQuantity = (accessToken: string | null, data: {}) =>
  apiClient.post("basket_items/add_item_quantity/", accessToken, data);

const decreaseItemQuantity = (accessToken: string | null, id: number) =>
  apiClient.post(`basket_items/${id}/decrease_item_quantity/`, accessToken);

const clearProductItems = (accessToken: string | null, id: number) =>
  apiClient.delete(`basket_items/${id}/remove_product_items/`, accessToken);

const clearAll = (accessToken: string | null, data: {}) =>
  apiClient.delete("basket_items/clear_all/", accessToken, data);

const basketItemsApi = {
  list,
  toggleChecked,
  addItemQuantity,
  decreaseItemQuantity,
  clearProductItems,
  clearAll,
};

export default basketItemsApi;
