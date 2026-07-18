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

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "");

function ensureApiConfig() {
  if (!apiBaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_API_BASE_URL in .env");
  }
}

function buildUrl(path: string, query?: Record<string, string | undefined>) {
  ensureApiConfig();
  const url = new URL(path, `${apiBaseUrl}/`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      const trimmed = value?.trim();
      if (trimmed) url.searchParams.set(key, trimmed);
    }
  }

  return url.toString();
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    let message = `Request failed (HTTP ${response.status})`;

    try {
      const body = (await response.json()) as {
        message?: string | string[];
        error?: string;
      };
      message = Array.isArray(body.message)
        ? body.message.join(", ")
        : body.message || body.error || message;
    } catch {
      // Keep HTTP fallback.
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

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
