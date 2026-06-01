"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  fetchInventoryProduct,
  fetchInventoryProducts,
} from "@/lib/inventoryApi";

export const inventoryProductKeys = {
  all: ["inventory-products"] as const,
  list: () => [...inventoryProductKeys.all, "list"] as const,
  detail: (id: string) => [...inventoryProductKeys.all, "detail", id] as const,
};

export function useInfiniteInventoryProducts() {
  return useInfiniteQuery({
    queryKey: inventoryProductKeys.list(),
    queryFn: ({ pageParam }) => fetchInventoryProducts({ offset: pageParam }),
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

export function useInventoryProduct(id: string | null) {
  return useQuery({
    queryKey: inventoryProductKeys.detail(id ?? ""),
    queryFn: () => fetchInventoryProduct(id ?? ""),
    enabled: Boolean(id),
  });
}
