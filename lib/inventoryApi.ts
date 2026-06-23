import type {
  InventoryAnalyticsResponse,
  InventoryProduct,
  InventoryProductListQuery,
  InventoryProductListResponse,
} from "@/types/inventory-api";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "");

function ensureApiConfig() {
  if (!apiBaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_API_BASE_URL in .env");
  }
}

function buildUrl(
  path: string,
  query?: Record<string, string | number | boolean | undefined | null>,
) {
  ensureApiConfig();
  const url = new URL(path, `${apiBaseUrl}/`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    let message = `Request failed (HTTP ${response.status})`;

    try {
      const body = (await response.json()) as {
        message?: string | string[];
        error?: string;
      };
      message = Array.isArray(body.message)
        ? body.message.join(", ")
        : body.message || body.error || message;
    } catch {
      // Keep HTTP fallback.
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

function normalizeProductList(response: unknown): InventoryProductListResponse {
  if (Array.isArray(response)) {
    return { data: response as InventoryProduct[], total: 0 };
  }

  if (!response || typeof response !== "object") {
    return { data: [], total: 0 };
  }

  const record = response as Record<string, unknown>;
  const nestedData = record.data;

  if (Array.isArray(nestedData)) {
    return {
      data: nestedData as InventoryProduct[],
      total: typeof record.total === "number" ? record.total : 0,
    };
  }

  if (nestedData && typeof nestedData === "object") {
    const nestedRecord = nestedData as Record<string, unknown>;
    if (Array.isArray(nestedRecord.data)) {
      return {
        data: nestedRecord.data as InventoryProduct[],
        total: typeof nestedRecord.total === "number" ? nestedRecord.total : 0,
      };
    }
  }

  for (const key of ["items", "results", "products"]) {
    const value = record[key];
    if (Array.isArray(value)) {
      return {
        data: value as InventoryProduct[],
        total: typeof record.total === "number" ? record.total : 0,
      };
    }
  }

  return { data: [], total: 0 };
}

function normalizeProductDetail(response: unknown): InventoryProduct | null {
  if (!response || typeof response !== "object") {
    return null;
  }

  const record = response as Record<string, unknown>;

  if ("productCode" in record) {
    return record as InventoryProduct;
  }

  const nestedData = record.data;
  if (nestedData && typeof nestedData === "object") {
    const nestedRecord = nestedData as Record<string, unknown>;
    if ("productCode" in nestedRecord) {
      return nestedRecord as InventoryProduct;
    }
  }

  return null;
}

export const INVENTORY_LIST_DEFAULT_LIMIT = 24;

export function fetchInventoryProducts(query: InventoryProductListQuery = {}) {
  return apiFetch<unknown>(buildUrl("api/v1/products", query)).then(
    normalizeProductList,
  );
}

export function fetchInventoryAnalytics(query: InventoryProductListQuery = {}) {
  return apiFetch<InventoryAnalyticsResponse>(
    buildUrl("api/v1/products/analytics", query),
  );
}

export function fetchInventoryProductByCode(productCode: string) {
  return apiFetch<unknown>(
    buildUrl(`api/v1/products/code/${encodeURIComponent(productCode)}`),
  ).then(normalizeProductDetail);
}

export function syncInventoryProducts() {
  return apiFetch<unknown>(buildUrl("api/v1/products/sync/catalog"), {
    method: "POST",
  });
}
