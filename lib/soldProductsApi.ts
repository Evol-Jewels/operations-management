import { apiFetch, buildUrl } from "@/lib/apiClient";
import type {
  SoldProductsQuery,
  SoldProductsResponse,
} from "@/types/sold-products-api";

export function fetchSoldProducts(
  query: SoldProductsQuery,
  signal?: AbortSignal,
) {
  return apiFetch<SoldProductsResponse>(
    buildUrl("api/v1/stock-sales/sold-products", query),
    { signal },
  );
}

export async function downloadSoldProducts(query: SoldProductsQuery) {
  const response = await fetch(
    buildUrl("api/v1/stock-sales/sold-products/export", query),
    {
      credentials: "include",
      headers: { Accept: "text/csv" },
    },
  );
  if (!response.ok)
    throw new Error(
      `Unable to download sold products (HTTP ${response.status})`,
    );
  return response.blob();
}

export function fetchSoldProductLocations(signal?: AbortSignal) {
  return apiFetch<string[]>(
    buildUrl("api/v1/stock-sales/sold-products/locations"),
    { signal },
  );
}
