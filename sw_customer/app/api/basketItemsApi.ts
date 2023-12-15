import apiClient from "./apiClient";

const list = () => apiClient.get("basket_items/");

const addItemQuantity = (data: {}) =>
  apiClient.post("basket_items/add_item_quantity/", data);

const decreaseItemQuantity = (id: number) =>
  apiClient.post(`basket_items/${id}/decrease_item_quantity/`);

const clearProductItems = (id: number) =>
  apiClient.delete(`basket_items/${id}/remove_product_items/`);

const clearAll = () => apiClient.delete("basket_items/clear_all/");

const basketItemsApi = {
  list,
  addItemQuantity,
  decreaseItemQuantity,
  clearProductItems,
  clearAll,
};

export default basketItemsApi;
