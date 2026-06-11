const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "");

export function ensureApiConfig() {
  if (!apiBaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_API_BASE_URL in .env");
  }
}

export function buildUrl(
  path: string,
  query?: Record<string, string | number | undefined>,
) {
  ensureApiConfig();
  const url = new URL(path, `${apiBaseUrl}/`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined) continue;
      const trimmed = String(value).trim();
      if (trimmed) url.searchParams.set(key, trimmed);
    }
  }

  return url.toString();
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
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
