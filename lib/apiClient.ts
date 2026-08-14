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

class NetworkRequestError extends Error {
  override name = "NetworkRequestError";
}

const NETWORK_ERROR_MESSAGES = new Set([
  "failed to fetch",
  "load failed",
  "networkerror when attempting to fetch resource.",
  "the internet connection appears to be offline.",
  "network request failed",
]);

function isNetworkError(error: unknown) {
  if (error instanceof NetworkRequestError) return true;
  if (!(error instanceof Error)) return false;
  if (error.name === "AbortError") return true;
  if (error instanceof TypeError) return true;
  const message = error.message.toLowerCase();
  return (
    NETWORK_ERROR_MESSAGES.has(message) ||
    message.includes("network connection was lost") ||
    message.includes("internet connection appears to be offline") ||
    message.includes("server with the specified hostname could not be found")
  );
}

function toNetworkError(error: unknown) {
  if (error instanceof Error && error.name === "AbortError") {
    return new NetworkRequestError(
      "The request took too long. Check your connection and try again.",
    );
  }

  return new NetworkRequestError(
    "Could not reach the server. Check your connection and try again. If you attached photos, try again or use a smaller image.",
  );
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const timeoutMs = init?.body instanceof FormData ? 90_000 : 45_000;
  const controller = init?.signal ? null : new AbortController();
  const timer = controller
    ? setTimeout(() => controller.abort(), timeoutMs)
    : null;

  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      credentials: "include",
      signal: init?.signal ?? controller?.signal,
      headers: {
        Accept: "application/json",
        ...init?.headers,
      },
    });
  } catch (error) {
    if (isNetworkError(error)) {
      throw toNetworkError(error);
    }
    throw error;
  } finally {
    if (timer) clearTimeout(timer);
  }

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
