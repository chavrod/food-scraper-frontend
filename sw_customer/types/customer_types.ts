export interface Customer {
    id?: number;
    password_reset_attempts?: null;
    phone_number?: string | null;
    user: number | string;
}

export interface CachedProductsPage {
    id?: number;
    query: string;
    page?: number;
    is_relevant_only: boolean;
    results?: any;
    created?: string;
}

export interface Product {
    id?: number;
    name: string;
    price: number;
    img_src?: string | null;
    product_url?: string | null;
    shop_name: "ALDI" | "TESCO" | "SUPERVALU";
    created_at?: string;
    updated_at?: string;
}

export interface BasketItem {
    id?: number;
    product?: Product;
    quantity?: number;
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

