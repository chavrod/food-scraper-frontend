export enum ShopName {
  ALDI = "ALDI",
  TESCO = "TESCO",
  SUPERVALU = "SUPERVALU",
}

export enum ShopPageCount {
  ALDI = 36,
  TESCO_SHORT = 24,
  TESCO_LONG = 48,
  SUPERVALU = 30,
}

export interface Product {
  name: string;
  price: number;
  imgSrc: string | undefined;
  productUrl:  string | undefined;
  shopName: ShopName;
}

export interface SearchParams {
  query: string;
  page: string;
  is_relevant_only: boolean;
}

export interface SearchMetaData {
  currentPage?: number;
  totalPages?: number;
  keyword?: string;
  isRelevantOnly?: boolean;
}

export interface ScrapeStats {
  averageTimeSeconds: number | null;
}
