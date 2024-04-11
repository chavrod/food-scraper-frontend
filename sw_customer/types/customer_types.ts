export interface Customer {
    id?: number;
    password_reset_attempts?: null;
    phone_number?: string | null;
    user: number | string;
}

export interface SearchParams {
    query: string;
    page?: number;
    order_by?: string;
    price_range?: string;
    unit_type?: "KG" | "L" | "M" | "M2" | "EACH" | "HUNDRED_SHEETS";
    unit_measurement_range?: string;
}

export interface SearchedProduct {
    query: string;
    name: string;
    price: number;
    price_per_unit: number;
    unit_type: "KG" | "L" | "M" | "M2" | "EACH" | "HUNDRED_SHEETS";
    unit_measurement: number;
    img_src: string | null;
    product_url: string | null;
    shop_name: "ALDI" | "TESCO" | "SUPERVALU" | "ALL";
}

export interface SearchedProductAvailableUnitRangesInfo {
    name: "KG" | "L" | "M" | "M2" | "EACH" | "HUNDRED_SHEETS";
    count: number;
    min: number;
    max: number;
    min_selected: number | null;
    max_selected: number | null;
}

export interface SearchedProductPriceRangeInfo {
    name: string;
    min: number;
    max: number;
    min_selected: number | null;
    max_selected: number | null;
}

export interface SearchedProductMetadata {
    page: number;
    total_pages: number;
    order_by: string;
    total_results: number;
    active_unit: "KG" | "L" | "M" | "M2" | "EACH" | "HUNDRED_SHEETS" | null;
    units_range_list: SearchedProductAvailableUnitRangesInfo[];
    price_range_info: SearchedProductPriceRangeInfo;
    filter_count: number;
}

export interface ScrapeStatsForCustomer {
    average_time_seconds: number;
}

export interface BasketProduct {
    id?: number;
    name: string;
    price: number;
    img_src?: string | null;
    product_url?: string | null;
    shop_name: "ALDI" | "TESCO" | "SUPERVALU" | "ALL";
    created_at?: string;
    updated_at?: string;
}

export interface BasketItem {
    id?: number;
    product?: BasketProduct;
    quantity?: number;
}

export interface BasketItemShopBreakdown {
    name: "ALDI" | "TESCO" | "SUPERVALU" | "ALL";
    total_price: number;
    total_quantity: number;
}

export interface BasketItemMetadata {
    total_items: number;
    total_quantity: number;
    total_price: number;
    shop_breakdown: BasketItemShopBreakdown[];
    page: number;
    total_pages: number;
    selected_shop: "ALDI" | "TESCO" | "SUPERVALU" | "ALL";
}

export interface Basket {
    items?: BasketItem[];
}

export interface SocialAccountSerializer {
    provider: "google";
}

export interface CustomUserDetailsSerializer {
    pk?: number;
    username: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    customer?: Customer;
    social_accounts?: SocialAccountSerializer[];
}

