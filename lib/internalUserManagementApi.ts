import type {
  ChangeInternalPasswordInput,
  ChangeInternalPasswordResponse,
  CreateInternalInviteInput,
  CreateInternalInviteResponse,
  InternalInviteRow,
  InternalInvitesQuery,
  InternalUserProfileMeResponse,
  InternalUsersQuery,
  InternalUserWithProfile,
  UpdateMyInternalProfileInput,
} from "@/types/user-management";

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
    Object.entries(query).forEach(([key, value]) => {
      const trimmedValue = value?.trim();
      if (trimmedValue) {
        url.searchParams.set(key, trimmedValue);
      }
    });
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
        message?: string;
        error?: string;
      };
      message = body.message || body.error || message;
    } catch {
      // Keep the HTTP status fallback when the backend does not return JSON.
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export function fetchInternalUsers(query: InternalUsersQuery = {}) {
  return apiFetch<InternalUserWithProfile[]>(
    buildUrl("api/v1/internal-users", { ...query }),
  );
}

export function fetchMyInternalProfile() {
  return apiFetch<InternalUserProfileMeResponse>(
    buildUrl("api/v1/internal-users/profile/me"),
  );
}

export function updateMyInternalProfile(input: UpdateMyInternalProfileInput) {
  return apiFetch<InternalUserProfileMeResponse>(
    buildUrl("api/v1/internal-users/profile/me"),
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
}

export function changeInternalUserPassword(input: ChangeInternalPasswordInput) {
  return apiFetch<ChangeInternalPasswordResponse>(
    buildUrl("api/v1/internal-users/change-password"),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
}

export function fetchInternalInvites(query: InternalInvitesQuery = {}) {
  return apiFetch<InternalInviteRow[]>(
    buildUrl("api/v1/internal-invites", { ...query }),
  );
}

export function createInternalInvite(input: CreateInternalInviteInput) {
  return apiFetch<CreateInternalInviteResponse>(
    buildUrl("api/v1/internal-invites"),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    },
  );
}

export function expireInternalInvite(inviteId: string) {
  return apiFetch<{ id: string; status: string }>(
    buildUrl(`api/v1/internal-invites/${inviteId}/expire`),
    { method: "POST" },
  );
}

export function blockInternalUser(userId: string) {
  return apiFetch<{
    id: string;
    email: string;
    username: string;
    status: string;
    updatedAt: string;
  }>(buildUrl(`api/v1/internal-users/${userId}/block`), { method: "POST" });
}

export function unblockInternalUser(userId: string) {
  return apiFetch<{
    id: string;
    email: string;
    username: string;
    status: string;
    updatedAt: string;
  }>(buildUrl(`api/v1/internal-users/${userId}/unblock`), { method: "POST" });
}

export function resetInternalUserPassword(
  username: string,
  newPassword: string,
) {
  return apiFetch<{
    id: string;
    username: string;
    passwordUpdated: boolean;
  }>(buildUrl("api/v1/internal-users/reset-password"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, newPassword }),
  });
}

export function updateInternalInvite(
  inviteId: string,
  data: { status?: "PENDING" | "EXPIRED" | "CANCELLED"; expiration?: string },
) {
  return apiFetch<InternalInviteRow>(
    buildUrl(`api/v1/internal-invites/${inviteId}`),
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
  );
}
