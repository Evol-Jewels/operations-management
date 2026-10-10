import { apiFetch, buildUrl } from "@/lib/apiClient";
import type { Vendor, VendorInput } from "@/lib/vendors";

export function fetchVendors() {
  return apiFetch<Vendor[]>(buildUrl("api/v1/vendors"));
}

export function createVendor(input: VendorInput) {
  return apiFetch<Vendor>(buildUrl("api/v1/vendors"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function updateVendor(vendorId: string, input: VendorInput) {
  return apiFetch<Vendor>(
    buildUrl(`api/v1/vendors/${encodeURIComponent(vendorId)}`),
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
}
