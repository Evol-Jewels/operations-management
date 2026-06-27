"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import {
  fetchStockSales,
  STOCK_SALES_LIST_DEFAULT_LIMIT,
} from "@/lib/stockSalesApi";
import type { ListStockSalesQuery } from "@/types/stock-sales-api";

export const stockSalesKeys = {
  all: ["stock-sales"] as const,
  lists: () => [...stockSalesKeys.all, "list"] as const,
  list: (query: ListStockSalesQuery = {}) =>
    [...stockSalesKeys.lists(), query] as const,
};

export function useStockSales(
  query: ListStockSalesQuery = {},
  options: { enabled?: boolean } = {},
) {
  const { limit = STOCK_SALES_LIST_DEFAULT_LIMIT } = query;

  return useInfiniteQuery({
    queryKey: stockSalesKeys.list({ limit }),
    queryFn: ({ pageParam }) =>
      fetchStockSales({
        limit,
        offset: pageParam as number,
      }),
    enabled: options.enabled,
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.data.length === 0 || lastPage.data.length < limit) {
        return undefined;
      }

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
