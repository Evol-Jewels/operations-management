export interface BackendStockSaleUserSummary {
  id: string;
  name: string | null;
  image: string | null;
}

export interface BackendStockSaleLocationSummary {
  id: string;
  name: string;
  city: string;
}

export interface BackendStockSaleItem {
  id: string;
  productCode: string;
}

export interface BackendStockSaleRow {
  id: string;
  saleMonth: string | null;
  customerName: string;
  totalAmount: string;
  storeName: string | null;
  location: BackendStockSaleLocationSummary | null;
  source: string | null;
  stockType: string | null;
  salesPersonRaw: string | null;
  salesPerson: BackendStockSaleUserSummary | null;
  items: BackendStockSaleItem[];
  createdAt: string;
  updatedAt: string;
  syncedAt: string;
}

export interface ListStockSalesQuery {
  limit?: number;
  offset?: number;
}

export interface StockSalesListResponse {
  data: BackendStockSaleRow[];
  total: number;
}
