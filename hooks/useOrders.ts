"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { enquiryKeys } from "@/hooks/useEnquiries";
import {
  createOrders,
  fetchOrderDetails,
  fetchOrders,
  updateOrder,
} from "@/lib/ordersApi";
import type {
  CreateOrdersInput,
  ListOrdersQuery,
  UpdateOrderInput,
} from "@/types/order-api";

export const orderKeys = {
  all: ["orders"] as const,
  lists: () => [...orderKeys.all, "list"] as const,
  list: (query: ListOrdersQuery = {}) => [...orderKeys.lists(), query] as const,
  details: () => [...orderKeys.all, "detail"] as const,
  detail: (refCode: string | number) =>
    [...orderKeys.details(), String(refCode)] as const,
};

export function useOrders(
  query: ListOrdersQuery = {},
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: orderKeys.list(query),
    queryFn: () => fetchOrders(query),
    enabled: options.enabled,
  });
}

export function useOrderDetails(refCode: string | number) {
  return useQuery({
    queryKey: orderKeys.detail(refCode),
    queryFn: () => fetchOrderDetails(refCode),
    enabled: Boolean(refCode),
  });
}

export function useCreateOrders() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateOrdersInput) => createOrders(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: enquiryKeys.lists() });
    },
  });
}

export function useUpdateOrder(refCode: string | number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateOrderInput) => updateOrder(refCode, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: orderKeys.detail(refCode),
      });
    },
  });
}
