import apiClient from "./apiClient";

const list = (
  accessToken: string | undefined,
  params?: { [key: string]: string | number }
) => apiClient.get("basket_items/", accessToken, params);

const addItemQuantity = (accessToken: string | undefined, data: {}) =>
  apiClient.post("basket_items/add_item_quantity/", accessToken, data);

const decreaseItemQuantity = (accessToken: string | undefined, id: number) =>
  apiClient.post(`basket_items/${id}/decrease_item_quantity/`, accessToken);

const clearProductItems = (accessToken: string | undefined, id: number) =>
  apiClient.delete(`basket_items/${id}/remove_product_items/`, accessToken);

const clearAll = (accessToken: string | undefined) =>
  apiClient.delete("basket_items/clear_all/", accessToken);

const basketItemsApi = {
  list,
  addItemQuantity,
  decreaseItemQuantity,
  clearProductItems,
  clearAll,
};

export default basketItemsApi;
