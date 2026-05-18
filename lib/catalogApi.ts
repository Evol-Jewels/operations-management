import type {
  CatalogueProductDetailResponse,
  CatalogueSearchItem,
  CatalogueSearchResponse,
} from "@/types";

const baseUrl = process.env.NEXT_PUBLIC_CATALOG_API_BASE_URL?.replace(
  /\/+$/,
  "",
);
const token = process.env.NEXT_PUBLIC_CATALOG_API_TOKEN;

function ensureConfig() {
  if (!baseUrl || !token) {
    throw new Error(
      "Missing NEXT_PUBLIC_CATALOG_API_BASE_URL or NEXT_PUBLIC_CATALOG_API_TOKEN in .env",
    );
  }
}

async function catalogFetch<T>(
  path: string,
  searchParams?: Record<string, string>,
): Promise<T> {
  ensureConfig();
  const url = new URL(path, `${baseUrl}/`);

  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Catalogue request failed (HTTP ${response.status})`);
  }

  return response.json() as Promise<T>;
}

export async function searchCatalogueProductByCode(
  code: string,
): Promise<CatalogueSearchItem | null> {
  const trimmedCode = code.trim();
  if (!trimmedCode) return null;

  const data = await catalogFetch<CatalogueSearchResponse>(
    "catalogue-products/",
    {
      search: trimmedCode,
      limit: "12",
      offset: "0",
    },
  );

  if (data.count < 1 || data.results.length === 0) return null;
  return data.results[0] ?? null;
}

export async function fetchCatalogueProductDetails(
  slug: string,
): Promise<CatalogueProductDetailResponse> {
  const trimmedSlug = slug.trim();
  if (!trimmedSlug) {
    throw new Error("Missing catalogue product slug");
  }

  return catalogFetch<CatalogueProductDetailResponse>(
    `product-details/${trimmedSlug}/`,
  );
}
