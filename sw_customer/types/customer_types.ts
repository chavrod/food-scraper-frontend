export interface CustomerSerialiser {
    id?: number;
    password_reset_attempts?: null;
    phone_number?: string | null;
    user: number | string;
}

export interface SearchedProductParamsSerialiser {
    query: string;
    page?: number;
    order_by?: string;
    price_range?: string;
    unit_type?: "KG" | "L" | "M" | "M2" | "EACH" | "HUNDRED_SHEETS";
    unit_measurement_range?: string;
}

export interface SearchedProductSerialiser {
    name: string;
    price: number;
    price_per_unit: number;
    unit_type: "KG" | "L" | "M" | "M2" | "EACH" | "HUNDRED_SHEETS";
    unit_measurement: number;
    img_src: string | null;
    product_url: string | null;
    shop_name: "ALDI" | "TESCO" | "SUPERVALU" | "ALL";
}

export interface SearchedProductAvailableUnitRangesInfoSerialiser {
    name: "KG" | "L" | "M" | "M2" | "EACH" | "HUNDRED_SHEETS";
    count: number;
    min: number;
    max: number;
    min_selected: number | null;
    max_selected: number | null;
}

export interface SearchedProductPriceRangeInfoSerialiser {
    name: string;
    min: number;
    max: number;
    min_selected: number | null;
    max_selected: number | null;
}

export interface SearchedProductMetadataSerialiser {
    query: string;
    is_full_metadata: boolean;
    is_update_needed: boolean;
    update_date: string | null;
    page: number;
    total_pages: number;
    order_by: string;
    total_results: number;
    active_unit: "KG" | "L" | "M" | "M2" | "EACH" | "HUNDRED_SHEETS" | null;
    units_range_list: SearchedProductAvailableUnitRangesInfoSerialiser[];
    price_range_info: SearchedProductPriceRangeInfoSerialiser;
    filter_count: number;
}

export interface BasketProductSerialiser {
    id?: number;
    name: string;
    price: number;
    img_src?: string | null;
    product_url?: string | null;
    shop_name: "ALDI" | "TESCO" | "SUPERVALU" | "ALL";
    created_at?: string;
    updated_at?: string;
}

export interface BasketItemParamsSerialiser {
    page?: number;
    shop?: "ALDI" | "TESCO" | "SUPERVALU" | "ALL";
}

export interface BasketItemSerialiser {
    id: number;
    product: BasketProductSerialiser;
    quantity: number;
    checked: boolean;
}

export interface BasketItemShopBreakdownSerialiser {
    name: "ALDI" | "TESCO" | "SUPERVALU" | "ALL";
    total_price: number;
    total_quantity: number;
}

export interface BasketItemMetadataSerialiser {
    total_items: number;
    total_quantity: number;
    total_price: number;
    shop_breakdown: BasketItemShopBreakdownSerialiser[];
    page: number;
    total_pages: number;
    selected_shop: "ALDI" | "TESCO" | "SUPERVALU" | "ALL";
}

export interface BasketSerialiser {
    items?: BasketItemSerialiser[];
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
    customer?: CustomerSerialiser;
    social_accounts?: SocialAccountSerializer[];
}

