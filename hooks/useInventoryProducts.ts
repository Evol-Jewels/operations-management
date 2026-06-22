"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  fetchInventoryProductByCode,
  fetchInventoryProducts,
  INVENTORY_LIST_DEFAULT_LIMIT,
  syncInventoryProducts,
} from "@/lib/inventoryApi";
import type { InventoryProduct } from "@/types/inventory-api";

export const inventoryProductKeys = {
  all: ["inventory-products"] as const,
  list: (query: Record<string, unknown>) =>
    [...inventoryProductKeys.all, "list", query] as const,
  detailByCode: (code: string | null) =>
    [...inventoryProductKeys.all, "detail-by-code", code ?? ""] as const,
};

export function useInfiniteInventoryProducts(
  query: Record<string, unknown> = {},
) {
  const { limit = INVENTORY_LIST_DEFAULT_LIMIT, ...filters } = query;

  return useInfiniteQuery({
    queryKey: inventoryProductKeys.list({ ...filters, limit }),
    queryFn: ({ pageParam }) =>
      fetchInventoryProducts({
        ...(filters as Parameters<typeof fetchInventoryProducts>[0]),
        limit: limit as number,
        offset: pageParam as number,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.data.length === 0) return undefined;

      const loadedCount = allPages.reduce(
        (sum, page) => sum + page.data.length,
        0,
      );
      const total = allPages.find((page) => page.total > 0)?.total;

      if (typeof total === "number" && loadedCount >= total) {
        return undefined;
      }

      return loadedCount;
    },
  });
}

export function useInventoryProductByCode(productCode: string | null) {
  return useQuery({
    queryKey: inventoryProductKeys.detailByCode(productCode),
    enabled: Boolean(productCode),
    queryFn: async (): Promise<InventoryProduct | null> => {
      const trimmed = productCode?.trim();
      if (!trimmed) return null;

      return fetchInventoryProductByCode(trimmed);
    },
  });
}

export function useSyncInventoryProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: syncInventoryProducts,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryProductKeys.all });
    },
  });
}
