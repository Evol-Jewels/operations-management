import type {
  CreateMetalInput,
  CreateStoneSlabInput,
  CreateStoneTypeInput,
  MetalResponse,
  StoneSlabResponse,
  StoneTypeResponse,
  UpdateMetalInput,
  UpdateStoneSlabInput,
  UpdateStoneTypeInput,
} from "@/types/manage-products-api";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "");

function ensureApiConfig() {
  if (!apiBaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_API_BASE_URL in .env");
  }
}

function buildUrl(
  path: string,
  query?: Record<string, string | number | undefined>,
) {
  ensureApiConfig();
  const url = new URL(path, `${apiBaseUrl}/`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      const normalizedValue = value?.toString().trim();
      if (normalizedValue) url.searchParams.set(key, normalizedValue);
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

function normalizeListResponse<T>(response: unknown): {
  data: T[];
  total: number;
} {
  if (Array.isArray(response)) {
    return { data: response, total: response.length };
  }

  if (!response || typeof response !== "object") {
    return { data: [], total: 0 };
  }

  const record = response as Record<string, unknown>;
  const nestedData = record.data;

  if (Array.isArray(nestedData)) {
    return {
      data: nestedData as T[],
      total:
        typeof record.total === "number" ? record.total : nestedData.length,
    };
  }

  if (nestedData && typeof nestedData === "object") {
    const nestedRecord = nestedData as Record<string, unknown>;
    if (Array.isArray(nestedRecord.data)) {
      return {
        data: nestedRecord.data as T[],
        total:
          typeof nestedRecord.total === "number"
            ? nestedRecord.total
            : nestedRecord.data.length,
      };
    }
  }

  const arrayKeys = [
    "items",
    "results",
    "metals",
    "stoneTypes",
    "stoneSlabs",
    "stone_types",
    "stone_slabs",
  ];

  for (const key of arrayKeys) {
    const value = record[key];
    if (Array.isArray(value)) {
      return {
        data: value as T[],
        total: typeof record.total === "number" ? record.total : value.length,
      };
    }
  }

  if (nestedData && typeof nestedData === "object") {
    const nestedRecord = nestedData as Record<string, unknown>;
    for (const key of arrayKeys) {
      const value = nestedRecord[key];
      if (Array.isArray(value)) {
        return {
          data: value as T[],
          total:
            typeof nestedRecord.total === "number"
              ? nestedRecord.total
              : value.length,
        };
      }
    }
  }

  return { data: [], total: 0 };
}

export interface ListStoneTypesQuery {
  q?: string;
  limit?: number;
  offset?: number;
}

export interface ListStoneSlabsQuery {
  q?: string;
  limit?: number;
  offset?: number;
  stoneTypeId?: string;
}

export interface ListMetalsQuery {
  q?: string;
  limit?: number;
  offset?: number;
  type?: string;
}

export function fetchStoneTypes(query: ListStoneTypesQuery = {}) {
  return apiFetch<unknown>(
    buildUrl("api/v1/stone-types", {
      q: query.q,
      limit: query.limit,
      offset: query.offset,
    }),
  ).then(normalizeListResponse<StoneTypeResponse>);
}

export function createStoneType(input: CreateStoneTypeInput) {
  return apiFetch<StoneTypeResponse>(buildUrl("api/v1/stone-types"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function updateStoneType(id: string, input: UpdateStoneTypeInput) {
  return apiFetch<StoneTypeResponse>(buildUrl(`api/v1/stone-types/${id}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function deleteStoneType(id: string) {
  return apiFetch<{ id: string }>(buildUrl(`api/v1/stone-types/${id}`), {
    method: "DELETE",
  });
}

export function fetchStoneSlabs(query: ListStoneSlabsQuery = {}) {
  return apiFetch<unknown>(
    buildUrl("api/v1/stone-slabs", {
      q: query.q,
      limit: query.limit,
      offset: query.offset,
      stoneTypeId: query.stoneTypeId,
    }),
  ).then(normalizeListResponse<StoneSlabResponse>);
}

export function createStoneSlab(input: CreateStoneSlabInput) {
  return apiFetch<StoneSlabResponse>(buildUrl("api/v1/stone-slabs"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function updateStoneSlab(id: string, input: UpdateStoneSlabInput) {
  return apiFetch<StoneSlabResponse>(buildUrl(`api/v1/stone-slabs/${id}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function deleteStoneSlab(id: string) {
  return apiFetch<{ id: string }>(buildUrl(`api/v1/stone-slabs/${id}`), {
    method: "DELETE",
  });
}

export function fetchMetals(query: ListMetalsQuery = {}) {
  return apiFetch<unknown>(
    buildUrl("api/v1/metals", {
      q: query.q,
      limit: query.limit,
      offset: query.offset,
      type: query.type,
    }),
  ).then(normalizeListResponse<MetalResponse>);
}

export function createMetal(input: CreateMetalInput) {
  return apiFetch<MetalResponse>(buildUrl("api/v1/metals"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function updateMetal(id: string, input: UpdateMetalInput) {
  return apiFetch<MetalResponse>(buildUrl(`api/v1/metals/${id}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function deleteMetal(id: string) {
  return apiFetch<{ id: string }>(buildUrl(`api/v1/metals/${id}`), {
    method: "DELETE",
  });
}
