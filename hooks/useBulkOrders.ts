"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orderKeys } from "@/hooks/useOrders";
import { sourceActivityKeys } from "@/hooks/useSourceActivity";
import {
  mapBackendBulkOrder,
  mapBackendBulkOrderRows,
} from "@/lib/bulkOrderMappers";
import {
  fetchBulkOrder,
  fetchBulkOrders,
  updateBulkOrder,
  updateBulkOrderItem,
} from "@/lib/bulkOrdersApi";
import { updateOrderStatus } from "@/lib/ordersApi";
import type {
  BackendBulkOrderDetails,
  ListBulkOrdersQuery,
  UpdateBulkOrderInput,
  UpdateBulkOrderItemInput,
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

export function useBulkOrderRecord(refCode: number) {
  return useQuery({
    queryKey: bulkOrderKeys.detail(refCode),
    queryFn: () => fetchBulkOrder(refCode),
    enabled: Number.isInteger(refCode) && refCode > 0,
  });
}

function useBulkEditSuccess(refCode: number, orderRefCode?: number) {
  const queryClient = useQueryClient();
  return async (record: BackendBulkOrderDetails) => {
    await queryClient.cancelQueries({
      queryKey: bulkOrderKeys.detail(refCode),
    });
    queryClient.setQueryData(bulkOrderKeys.detail(refCode), record);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: bulkOrderKeys.all }),
      ...record.items
        .filter(
          (item) => orderRefCode === undefined || item.refCode === orderRefCode,
        )
        .flatMap((item) => [
          queryClient.invalidateQueries({
            queryKey: orderKeys.detail(item.refCode),
          }),
          queryClient.invalidateQueries({
            queryKey: sourceActivityKeys.activityLogs("ORDER", item.refCode),
          }),
        ]),
    ]);
  };
}

export function useUpdateBulkOrder(refCode: number) {
  const onSuccess = useBulkEditSuccess(refCode);
  return useMutation({
    mutationFn: (input: UpdateBulkOrderInput) =>
      updateBulkOrder(refCode, input),
    onSuccess,
  });
}

export function useUpdateBulkOrderItem(refCode: number, orderRefCode: number) {
  const onSuccess = useBulkEditSuccess(refCode, orderRefCode);
  return useMutation({
    mutationFn: (input: UpdateBulkOrderItemInput) =>
      updateBulkOrderItem(refCode, orderRefCode, input),
    onSuccess,
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
