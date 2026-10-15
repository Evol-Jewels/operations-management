import { apiFetch, buildUrl } from "@/lib/apiClient";
import type {
  BackendBulkOrder,
  BackendBulkOrderDetails,
  ListBulkOrdersQuery,
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
