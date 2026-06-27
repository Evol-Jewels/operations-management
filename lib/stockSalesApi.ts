import { apiFetch, buildUrl } from "@/lib/apiClient";
import type { BackendStockSaleRow } from "@/types/stock-sales-api";

export function fetchStockSales() {
  return apiFetch<BackendStockSaleRow[]>(buildUrl("api/v1/stock-sales"));
}
