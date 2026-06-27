"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchStockSales } from "@/lib/stockSalesApi";

export const stockSalesKeys = {
  all: ["stock-sales"] as const,
  lists: () => [...stockSalesKeys.all, "list"] as const,
  list: () => [...stockSalesKeys.lists()] as const,
};

export function useStockSales(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: stockSalesKeys.list(),
    queryFn: fetchStockSales,
    enabled: options.enabled,
  });
}
