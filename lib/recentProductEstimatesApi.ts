import type {
  RecentProductEstimate,
  RecentProductEstimatesQuery,
} from "@/types";

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
      const trimmedValue = value?.trim();
      if (trimmedValue) url.searchParams.set(key, trimmedValue);
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

export function fetchRecentProductEstimates(
  query: RecentProductEstimatesQuery = {},
) {
  return apiFetch<RecentProductEstimate[]>(
    buildUrl("api/v1/recent-product-estimates", {
      productCode: query.productCode,
      limit: query.limit?.toString(),
      offset: query.offset?.toString(),
    }),
  );
}

export function createRecentProductEstimate(input: {
  productCode: string;
  imageUrl?: string;
}) {
  return apiFetch<RecentProductEstimate>(
    buildUrl("api/v1/recent-product-estimates"),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
}
