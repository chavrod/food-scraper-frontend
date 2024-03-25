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
}

export interface SearchedProduct {
    query: string;
    name: string;
    price: number;
    unit_type: "KG" | "L" | "M" | "EACH" | "SHEET" | "M2";
    unit_measurement: number;
    img_src: string | null;
    product_url: string | null;
    shop_name: "ALDI" | "TESCO" | "SUPERVALU" | "ALL";
}

export interface SearchedProductMetadata {
    page: number;
    total_pages: number;
    order_by: string;
    total_results: number;
}

export interface ScrapeStatsForCustomer {
    average_time_seconds: number;
}

export interface Product {
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
    product?: Product;
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

