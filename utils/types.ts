export enum ShopName {
  ALDI = "ALDI",
  TESCO = "TESCO",
  SUPERVALU = "SUPERVALU",
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
