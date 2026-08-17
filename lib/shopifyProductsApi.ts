import { apiFetch, buildUrl } from "@/lib/apiClient";
import type {
  CreateShopifyDraftInput,
  ShopifyCollection,
  ShopifyMediaInput,
  ShopifyMutationResult,
  ShopifyProductDetail,
  ShopifyProductFormInput,
  ShopifyProductStatusFilter,
  ShopifyProductsPage,
} from "@/types/shopify-products";

export const SHOPIFY_PRODUCTS_PAGE_SIZE = 25;

export interface ListShopifyProductsQuery {
  q?: string;
  status?: ShopifyProductStatusFilter;
  first?: number;
  after?: string;
}

export function fetchShopifyProducts(query: ListShopifyProductsQuery = {}) {
  return apiFetch<ShopifyProductsPage>(
    buildUrl("api/v1/shopify-products", {
      q: query.q,
      status: query.status,
      first: query.first,
      after: query.after,
    }),
  );
}

export function fetchShopifyProduct(productId: string) {
  return apiFetch<ShopifyProductDetail>(
    buildUrl(`api/v1/shopify-products/${productId}`),
  );
}

export function fetchShopifyCollections() {
  return apiFetch<{ collections: ShopifyCollection[] }>(
    buildUrl("api/v1/shopify-products/collections"),
  );
}

export function createShopifyDraft(input: CreateShopifyDraftInput) {
  return apiFetch<ShopifyMutationResult>(
    buildUrl("api/v1/shopify-products/drafts"),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
}

export function updateShopifyProduct(
  productId: string,
  input: ShopifyProductFormInput,
) {
  return apiFetch<ShopifyMutationResult>(
    buildUrl(`api/v1/shopify-products/${productId}`),
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
}

export async function uploadShopifyImage(
  file: File,
): Promise<ShopifyMediaInput> {
  const formData = new FormData();
  formData.set("file", file);
  const uploaded = await apiFetch<{
    originalSource: string;
    filename: string;
    mimeType: string;
  }>(buildUrl("api/v1/shopify-products/media"), {
    method: "POST",
    body: formData,
  });
  return {
    originalSource: uploaded.originalSource,
    filename: uploaded.filename,
    mediaContentType: "IMAGE",
  };
}
