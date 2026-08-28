import { apiFetch, buildUrl } from "@/lib/apiClient";
import type {
  BackendOrderDetailsResponse,
  BackendOrderRow,
  CreateOrdersInput,
  CreateOrdersResponse,
  ListOrdersQuery,
  UpdateOrderInput,
  UpdateOrderResponse,
  UpdateOrderStatusInput,
} from "@/types/order-api";

function queryToStrings(query: ListOrdersQuery) {
  return Object.fromEntries(
    Object.entries(query).map(([key, value]) => [key, String(value)]),
  ) as Record<string, string>;
}

export function fetchOrders(query: ListOrdersQuery = {}) {
  return apiFetch<BackendOrderRow[]>(
    buildUrl("api/v1/orders", queryToStrings(query)),
  );
}

export function fetchOpenStoreOrders() {
  return apiFetch<BackendOrderRow[]>(buildUrl("api/v1/orders/store"));
}

export function fetchOrderDetails(refCode: string | number) {
  return apiFetch<BackendOrderDetailsResponse>(
    buildUrl(`api/v1/orders/ref/${refCode}`),
  );
}

export function createOrders(input: CreateOrdersInput) {
  return apiFetch<CreateOrdersResponse>(buildUrl("api/v1/orders"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function updateOrder(refCode: string | number, input: UpdateOrderInput) {
  return apiFetch<UpdateOrderResponse>(
    buildUrl(`api/v1/orders/ref/${refCode}`),
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
}

export function updateOrderStatus(
  refCode: string | number,
  input: UpdateOrderStatusInput,
) {
  return apiFetch<UpdateOrderResponse>(
    buildUrl(`api/v1/orders/ref/${refCode}/status`),
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
}
