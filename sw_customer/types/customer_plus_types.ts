export interface BasketItemShopBreakdown {
  product__shop_name: string;
  total_quantity: number;
  total_price: number;
}

export interface BasketItemMetaData {
  total_items: number;
  total_quantity: number;
  total_price: number;
  shop_breakdown: BasketItemShopBreakdown[];
  page: number;
  total_pages: number;
  selected_shop: "ALDI" | "TESCO" | "SUPERVALU" | "ALL";
}
