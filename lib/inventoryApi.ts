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

export async function downloadInventoryAnalyticsCsv(
  query: InventoryProductListQuery = {},
) {
  const response = await fetch(
    buildUrl("api/v1/products/analytics/export", query),
    {
      credentials: "include",
      headers: { Accept: "text/csv" },
    },
  );

  if (!response.ok) {
    throw new Error(`Unable to download products (HTTP ${response.status})`);
  }

  const disposition = response.headers.get("content-disposition");
  const fileName =
    disposition?.match(/filename="?([^";]+)"?/i)?.[1] ?? "products.csv";

  return { blob: await response.blob(), fileName };
}

export function fetchInventoryProductByCode(productCode: string) {
  return apiFetch<unknown>(
    buildUrl(`api/v1/products/code/${encodeURIComponent(productCode)}`),
  ).then(normalizeProductDetail);
}

function mergeProductMedia(
  product: InventoryProduct,
  candidates: InventoryProduct[],
) {
  const media = new Map(
    [product, ...candidates]
      .flatMap((candidate) => candidate.media ?? [])
      .map((item) => [item.id || item.storageKey, item]),
  );

  return { ...product, media: Array.from(media.values()) };
}

export async function fetchInventoryProductWithAllMedia(
  productCode: string,
  knownProducts: InventoryProduct[] = [],
) {
  const [detailProduct, searchResponse] = await Promise.all([
    fetchInventoryProductByCode(productCode),
    knownProducts.length > 0
      ? Promise.resolve({ data: knownProducts, total: knownProducts.length })
      : fetchInventoryProducts({ code: productCode, limit: 10 }),
  ]);
  const matchingProducts = searchResponse.data.filter(
    (product) =>
      product.productCode.toUpperCase() === productCode.toUpperCase(),
  );
  const product = detailProduct ?? matchingProducts[0] ?? null;

  return product ? mergeProductMedia(product, matchingProducts) : null;
}

export function syncInventoryProducts() {
  return apiFetch<unknown>(buildUrl("api/v1/products/sync/catalog"), {
    method: "POST",
  });
}
