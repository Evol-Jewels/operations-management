"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createShopifyDraft,
  fetchShopifyCollections,
  fetchShopifyProduct,
  fetchShopifyProducts,
  SHOPIFY_PRODUCTS_PAGE_SIZE,
  updateShopifyProduct,
} from "@/lib/shopifyProductsApi";
import type { ShopifyProductStatusFilter } from "@/types/shopify-products";

export const shopifyProductKeys = {
  all: ["shopify-products"] as const,
  list: (q: string, status: ShopifyProductStatusFilter) =>
    [...shopifyProductKeys.all, "list", q, status] as const,
  detail: (id: string) => [...shopifyProductKeys.all, "detail", id] as const,
  collections: ["shopify-products", "collections"] as const,
};

export function useInfiniteShopifyProducts(
  q: string,
  status: ShopifyProductStatusFilter,
) {
  return useInfiniteQuery({
    queryKey: shopifyProductKeys.list(q, status),
    queryFn: ({ pageParam }) =>
      fetchShopifyProducts({
        q: q || undefined,
        status,
        first: SHOPIFY_PRODUCTS_PAGE_SIZE,
        after: pageParam || undefined,
      }),
    initialPageParam: "",
    getNextPageParam: (page) =>
      page.pageInfo.hasNextPage ? page.pageInfo.endCursor : undefined,
  });
}

export function useShopifyProduct(productId: string) {
  return useQuery({
    queryKey: shopifyProductKeys.detail(productId),
    queryFn: () => fetchShopifyProduct(productId),
    enabled: Boolean(productId),
  });
}

export function useShopifyCollections() {
  return useQuery({
    queryKey: shopifyProductKeys.collections,
    queryFn: fetchShopifyCollections,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateShopifyDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createShopifyDraft,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: shopifyProductKeys.all }),
  });
}

export function useUpdateShopifyProduct(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof updateShopifyProduct>[1]) =>
      updateShopifyProduct(productId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shopifyProductKeys.all });
    },
  });
}
