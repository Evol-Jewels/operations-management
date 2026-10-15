"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orderKeys } from "@/hooks/useOrders";
import { sourceActivityKeys } from "@/hooks/useSourceActivity";
import {
  mapBackendBulkOrder,
  mapBackendBulkOrderRows,
} from "@/lib/bulkOrderMappers";
import { fetchBulkOrder, fetchBulkOrders } from "@/lib/bulkOrdersApi";
import { updateOrderStatus } from "@/lib/ordersApi";
import type {
  BackendBulkOrderDetails,
  ListBulkOrdersQuery,
} from "@/types/bulk-order-api";
import type { BackendOrderStatus } from "@/types/order-api";

export const bulkOrderKeys = {
  all: ["bulk-orders"] as const,
  list: (query: ListBulkOrdersQuery) =>
    [...bulkOrderKeys.all, "list", query] as const,
  detail: (refCode: number) =>
    [...bulkOrderKeys.all, "detail", refCode] as const,
};

export function useBulkOrders(query: ListBulkOrdersQuery = {}) {
  return useQuery({
    queryKey: bulkOrderKeys.list(query),
    queryFn: () => fetchBulkOrders(query),
    select: mapBackendBulkOrderRows,
  });
}

export function useBulkOrder(refCode: number) {
  return useQuery({
    queryKey: bulkOrderKeys.detail(refCode),
    queryFn: () => fetchBulkOrder(refCode),
    select: mapBackendBulkOrder,
    enabled: Number.isInteger(refCode) && refCode > 0,
  });
}

interface UpdateBulkItemStatusInput {
  orderRefCode: number;
  status: BackendOrderStatus;
  remark?: string;
}

export function useUpdateBulkItemStatus(refCode: number) {
  const queryClient = useQueryClient();
  const queryKey = bulkOrderKeys.detail(refCode);

  return useMutation({
    mutationFn: ({ orderRefCode, status, remark }: UpdateBulkItemStatusInput) =>
      updateOrderStatus(orderRefCode, { status, remark }),
    onMutate: async ({ orderRefCode, status }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous =
        queryClient.getQueryData<BackendBulkOrderDetails>(queryKey);
      queryClient.setQueryData<BackendBulkOrderDetails>(
        queryKey,
        (current) =>
          current && {
            ...current,
            items: current.items.map((item) =>
              item.refCode === orderRefCode ? { ...item, status } : item,
            ),
          },
      );
      return { previous };
    },
    onError: (_error, _input, context) => {
      queryClient.setQueryData(queryKey, context?.previous);
    },
    onSettled: (_data, _error, { orderRefCode }) => {
      void queryClient.invalidateQueries({ queryKey: bulkOrderKeys.all });
      void queryClient.invalidateQueries({
        queryKey: orderKeys.detail(orderRefCode),
      });
      void queryClient.invalidateQueries({
        queryKey: sourceActivityKeys.comments("ORDER", orderRefCode),
      });
      void queryClient.invalidateQueries({
        queryKey: sourceActivityKeys.activityLogs("ORDER", orderRefCode),
      });
    },
  });
}
