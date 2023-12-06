export interface BasketItemShopBreakdown {
  product__shop_name: string;
  total_quantity: number;
  total_price: number;
}

export interface BasketItemMetaData {
  total_quantity: number;
  total_price: number;
  shop_breakdown?: BasketItemShopBreakdown[];
}
