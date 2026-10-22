import { apiFetch, buildUrl } from "@/lib/apiClient";
import type {
  CreateRefillRequestInput,
  RefillRequest,
  RefillRequestStatus,
} from "@/types/refill-request-api";

export function fetchRefillRequests() {
  return apiFetch<RefillRequest[]>(
    buildUrl("api/v1/refill-requests", { limit: 100 }),
  );
}

export function createRefillRequest(input: CreateRefillRequestInput) {
  return apiFetch<RefillRequest>(buildUrl("api/v1/refill-requests"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function updateRefillRequestStatus(
  refCode: number,
  status: Exclude<RefillRequestStatus, "PENDING">,
) {
  return apiFetch<RefillRequest>(
    buildUrl(`api/v1/refill-requests/ref/${refCode}/status`),
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    },
  );
}

export function formatRefillRef(refCode: number) {
  return `RR-${String(refCode).padStart(3, "0")}`;
}
