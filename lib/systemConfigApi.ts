import type { SystemConfig, UpdateSystemConfigInput } from "@/types";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "");

function ensureApiConfig() {
  if (!apiBaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_API_BASE_URL in .env");
  }
}

function buildUrl(path: string) {
  ensureApiConfig();
  return new URL(path, `${apiBaseUrl}/`).toString();
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
