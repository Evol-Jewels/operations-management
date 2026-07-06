import type {
  CreateSpecialProductMakingChargeInput,
  SpecialProductMakingCharge,
  SystemConfig,
  UpdateSpecialProductMakingChargeInput,
  UpdateSystemConfigInput,
} from "@/types";

interface GoldRateResponse {
  goldRate24k: number;
}

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

export function fetchSystemConfigs() {
  return apiFetch<SystemConfig[]>(buildUrl("api/v1/system-configs"));
}

export function fetchGoldRate() {
  return apiFetch<GoldRateResponse>(buildUrl("api/v1/gold-rate"));
}

export function updateSystemConfig(
  key: string,
  input: UpdateSystemConfigInput,
) {
  return apiFetch<SystemConfig>(buildUrl(`api/v1/system-configs/${key}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function fetchSpecialProductMakingCharges(
  query: {
    productCode?: string;
    q?: string;
    limit?: number;
    offset?: number;
  } = {},
) {
  return apiFetch<SpecialProductMakingCharge[]>(
    buildUrl("api/v1/special-product-making-charges", {
      productCode: query.productCode,
      q: query.q,
      limit: query.limit ? String(query.limit) : undefined,
      offset: query.offset ? String(query.offset) : undefined,
    }),
  );
}

export function createSpecialProductMakingCharge(
  input: CreateSpecialProductMakingChargeInput,
) {
  return apiFetch<SpecialProductMakingCharge>(
    buildUrl("api/v1/special-product-making-charges"),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
}

export function updateSpecialProductMakingCharge(
  productCode: string,
  input: UpdateSpecialProductMakingChargeInput,
) {
  return apiFetch<SpecialProductMakingCharge>(
    buildUrl(
      `api/v1/special-product-making-charges/${encodeURIComponent(productCode)}`,
    ),
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
}

export function deleteSpecialProductMakingCharge(productCode: string) {
  return apiFetch<{ deleted: true; productCode: string }>(
    buildUrl(
      `api/v1/special-product-making-charges/${encodeURIComponent(productCode)}`,
    ),
    { method: "DELETE" },
  );
}
