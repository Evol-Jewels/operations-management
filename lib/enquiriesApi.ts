import type {
  BackendEnquiryDetails,
  BackendEnquiryListItem,
  BackendEnquiryMedia,
  BackendEstimationRow,
  CreateEnquiryInput,
  CreateEstimationInput,
  ListEnquiriesQuery,
  UpdateEnquiryInput,
  UpdateEstimationInput,
} from "@/types/enquiry-api";

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

export function fetchEnquiries(query: ListEnquiriesQuery = {}) {
  return apiFetch<BackendEnquiryListItem[]>(
    buildUrl("api/v1/enquiries", { ...query }),
  );
}

export function fetchMyEnquiries() {
  return apiFetch<BackendEnquiryListItem[]>(buildUrl("api/v1/enquiries/me"));
}

export function fetchEnquiryDetails(id: string) {
  return apiFetch<BackendEnquiryDetails>(buildUrl(`api/v1/enquiries/${id}`));
}

export function fetchEnquiryDetailsByRefCode(refCode: number) {
  return apiFetch<BackendEnquiryDetails>(
    buildUrl(`api/v1/enquiries/ref/${refCode}`),
  );
}

export function createEnquiry(input: CreateEnquiryInput) {
  return apiFetch<BackendEnquiryDetails>(buildUrl("api/v1/enquiries"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function uploadEnquiryImage(file: File) {
  const body = new FormData();
  body.set("file", file);

  return apiFetch<BackendEnquiryMedia>(
    buildUrl("api/v1/uploads/enquiry-image"),
    {
      method: "POST",
      body,
    },
  );
}

export function updateEnquiry(id: string, input: UpdateEnquiryInput) {
  return apiFetch<BackendEnquiryDetails>(buildUrl(`api/v1/enquiries/${id}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function createEstimation(itemId: string, input: CreateEstimationInput) {
  return apiFetch<BackendEstimationRow>(
    buildUrl(`api/v1/estimation/${itemId}`),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
}

export function updateEstimation(
  estimationId: string,
  input: UpdateEstimationInput,
) {
  return apiFetch<BackendEstimationRow>(
    buildUrl(`api/v1/estimation/${estimationId}`),
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
}

export function deleteEstimation(estimationId: string) {
  return apiFetch<{ deleted: true; id: string }>(
    buildUrl(`api/v1/estimation/${estimationId}`),
    { method: "DELETE" },
  );
}
