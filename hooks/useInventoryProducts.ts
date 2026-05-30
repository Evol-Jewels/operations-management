"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchInventoryProduct,
  fetchInventoryProducts,
} from "@/lib/inventoryApi";

export const inventoryProductKeys = {
  all: ["inventory-products"] as const,
  list: () => [...inventoryProductKeys.all, "list"] as const,
  detail: (id: string) => [...inventoryProductKeys.all, "detail", id] as const,
};

export function useInventoryProducts() {
  return useQuery({
    queryKey: inventoryProductKeys.list(),
    queryFn: fetchInventoryProducts,
  });
}

export function useInventoryProduct(id: string | null) {
  return useQuery({
    queryKey: inventoryProductKeys.detail(id ?? ""),
    queryFn: () => fetchInventoryProduct(id ?? ""),
    enabled: Boolean(id),
  });
}
