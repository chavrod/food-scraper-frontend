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
  shopName: ShopName;
}

export interface ScrapeSummary {
  count: number;
  shopName: ShopName;
}

export interface SearchMetaData {
  currentPage?: number;
  totalPages?: number;
  keyword?: string;
}

export interface ScrapeStats {
  averageTimeSeconds: number | null;
}
