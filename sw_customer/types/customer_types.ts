export interface CustomerSerializer {
    id?: number;
    password_reset_attempts?: null;
    phone_number?: string | null;
    user: number | string;
}

export interface CachedProductsPageSerializer {
    id?: number;
    query: string;
    page?: number;
    is_relevant_only: boolean;
    results?: any;
    created?: string;
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
    customer?: CustomerSerializer;
    social_accounts?: SocialAccountSerializer[];
}

