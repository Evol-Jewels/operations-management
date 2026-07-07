"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  fetchSalesPersonStockSales,
  fetchMyStockSales,
  fetchStockSales,
  fetchStockSalesAnalytics,
  fetchStockSalesLeaderboard,
  STOCK_SALES_LIST_DEFAULT_LIMIT,
  syncStockSales,
} from "@/lib/stockSalesApi";
import type {
  ListStockSalesQuery,
  StockSalesAnalyticsQuery,
  StockSalesPersonAnalyticsQuery,
} from "@/types/stock-sales-api";

export const stockSalesKeys = {
  all: ["stock-sales"] as const,
  lists: () => [...stockSalesKeys.all, "list"] as const,
  list: (query: ListStockSalesQuery = {}) =>
    [...stockSalesKeys.lists(), query] as const,
  analytics: (query: StockSalesAnalyticsQuery = {}) =>
    [...stockSalesKeys.all, "analytics", query] as const,
  leaderboard: (query: StockSalesAnalyticsQuery = {}) =>
    [...stockSalesKeys.all, "leaderboard", query] as const,
  me: (query: StockSalesAnalyticsQuery = {}) =>
    [...stockSalesKeys.all, "me", query] as const,
  salesperson: (query: StockSalesPersonAnalyticsQuery) =>
    [...stockSalesKeys.all, "salesperson", query] as const,
};

export function useStockSales(
  query: ListStockSalesQuery = {},
  options: { enabled?: boolean } = {},
) {
  const { limit = STOCK_SALES_LIST_DEFAULT_LIMIT, search } = query;
  const effectiveQuery = { limit, search };

  return useInfiniteQuery({
    queryKey: stockSalesKeys.list(effectiveQuery),
    queryFn: ({ pageParam }) =>
      fetchStockSales({
        search,
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

export function useSyncStockSales() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: syncStockSales,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockSalesKeys.all });
    },
  });
}

export function useStockSalesAnalytics(query: StockSalesAnalyticsQuery = {}) {
  return useQuery({
    queryKey: stockSalesKeys.analytics(query),
    queryFn: () => fetchStockSalesAnalytics(query),
  });
}

export function useStockSalesLeaderboard(query: StockSalesAnalyticsQuery = {}) {
  return useQuery({
    queryKey: stockSalesKeys.leaderboard(query),
    queryFn: () => fetchStockSalesLeaderboard(query),
  });
}

export function useMyStockSales(
  query: StockSalesAnalyticsQuery = {},
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: stockSalesKeys.me(query),
    queryFn: () => fetchMyStockSales(query),
    enabled: options.enabled,
  });
}

export function useSalesPersonStockSales(
  query: StockSalesPersonAnalyticsQuery,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: stockSalesKeys.salesperson(query),
    queryFn: () => fetchSalesPersonStockSales(query),
    enabled: options.enabled,
  });
}
