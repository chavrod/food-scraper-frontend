import apiClient from "./apiClient";

const list = (data: {}) => apiClient.get("basket_items/", data);

const addItemQuantity = (data: {}) =>
  apiClient.post("basket_items/add_item_quantity/", data);

const decreaseItemQuantity = (id: number, data: {}) =>
  apiClient.post(`basket_items/${id}/decrease_item_quantity/`, data);

const removeProductItems = (id: number, data: {}) =>
  apiClient.post(`basket_items/${id}/remove_product_items/`, data);

const clearAll = (data: {}) => apiClient.post("basket_items/clear_all/", data);

const basketItemsApi = {
  list,
  addItemQuantity,
  decreaseItemQuantity,
  removeProductItems,
  clearAll,
};

export default basketItemsApi;
