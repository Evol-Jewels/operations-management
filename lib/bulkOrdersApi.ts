import { apiFetch, buildUrl } from "@/lib/apiClient";
import type {
  BackendBulkOrder,
  BackendBulkOrderDetails,
  ListBulkOrdersQuery,
  UpdateBulkOrderInput,
  UpdateBulkOrderItemInput,
} from "@/types/bulk-order-api";

export function fetchBulkOrders(query: ListBulkOrdersQuery = {}) {
  return apiFetch<BackendBulkOrder[]>(
    buildUrl("api/v1/bulk-orders", { ...query }),
  );
}

export function fetchBulkOrder(refCode: number) {
  return apiFetch<BackendBulkOrderDetails>(
    buildUrl(`api/v1/bulk-orders/ref/${refCode}`),
  );
}

export function updateBulkOrder(refCode: number, input: UpdateBulkOrderInput) {
  return apiFetch<BackendBulkOrderDetails>(
    buildUrl(`api/v1/bulk-orders/ref/${refCode}`),
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
}

export function updateBulkOrderItem(
  refCode: number,
  orderRefCode: number,
  input: UpdateBulkOrderItemInput,
) {
  return apiFetch<BackendBulkOrderDetails>(
    buildUrl(`api/v1/bulk-orders/ref/${refCode}/items/ref/${orderRefCode}`),
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
}
