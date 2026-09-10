export type SoldProductsSort =
  | "saleMonth"
  | "productCode"
  | "name"
  | "category"
  | "purity"
  | "netWeight"
  | "color"
  | "location"
  | "dateAdded"
  | "saleValue";

export type SoldProductsQuery = {
  search?: string;
  purity?: number;
  color?: string;
  category?: string;
  locationId?: string;
  ownership?: string;
  monthFrom?: string;
  monthTo?: string;
  sortBy?: SoldProductsSort;
  sortOrder?: "asc" | "desc";
  limit?: number;
  offset?: number;
};

export type SoldProduct = {
  id: string;
  transactionId: string;
  productId: string | null;
  productCode: string;
  name: string | null;
  category: string | null;
  isCustomerProduct: boolean | null;
  purity: number | null;
  netWeight: string | null;
  color: string | null;
  location: string | null;
  productValue: number | null;
  saleValue: string | null;
  dateAdded: string | null;
  saleMonth: string | null;
};

export type SoldProductsResponse = { data: SoldProduct[]; total: number };
