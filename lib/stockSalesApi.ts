import { apiFetch, buildUrl } from "@/lib/apiClient";
import type {
  BackendStockSaleRow,
  ListStockSalesQuery,
  StockSalesListResponse,
  StockSalesSyncSummary,
} from "@/types/stock-sales-api";

export const STOCK_SALES_LIST_DEFAULT_LIMIT = 40;

function normalizeStockSalesList(response: unknown): StockSalesListResponse {
  if (Array.isArray(response)) {
    return { data: response as BackendStockSaleRow[], total: 0 };
  }

  if (!response || typeof response !== "object") {
    return { data: [], total: 0 };
  }

  const record = response as Record<string, unknown>;
  const nestedData = record.data;

  if (Array.isArray(nestedData)) {
    return {
      data: nestedData as BackendStockSaleRow[],
      total: typeof record.total === "number" ? record.total : 0,
    };
  }

  if (nestedData && typeof nestedData === "object") {
    const nestedRecord = nestedData as Record<string, unknown>;
    if (Array.isArray(nestedRecord.data)) {
      return {
        data: nestedRecord.data as BackendStockSaleRow[],
        total: typeof nestedRecord.total === "number" ? nestedRecord.total : 0,
      };
    }
  }

  for (const key of ["items", "results", "stockSales"]) {
    const value = record[key];
    if (Array.isArray(value)) {
      return {
        data: value as BackendStockSaleRow[],
        total: typeof record.total === "number" ? record.total : 0,
      };
    }
  }

  return { data: [], total: 0 };
}

export function fetchStockSales(query: ListStockSalesQuery = {}) {
  return apiFetch<unknown>(
    buildUrl("api/v1/stock-sales", {
      search: query.search,
      limit: query.limit,
      offset: query.offset,
    }),
  ).then(normalizeStockSalesList);
}

export function syncStockSales() {
  return apiFetch<StockSalesSyncSummary>(buildUrl("api/v1/stock-sales/sync"), {
    method: "POST",
  });
}
