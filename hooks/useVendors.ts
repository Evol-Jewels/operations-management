"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMyInternalProfile } from "@/hooks/useInternalProfile";
import type { VendorInput } from "@/lib/vendors";
import { createVendor, fetchVendors, updateVendor } from "@/lib/vendorsApi";

export const vendorKeys = { all: ["vendors"] as const };

export function useVendorAccess() {
  const profile = useMyInternalProfile();
  const role = profile.data?.profile?.role;
  return role === "ADMIN" || role === "OPERATIONS";
}

export function useVendors(enabled = true) {
  const canAccess = useVendorAccess();
  return useQuery({
    queryKey: vendorKeys.all,
    queryFn: fetchVendors,
    enabled: enabled && canAccess,
    staleTime: 60_000,
  });
}

export function useSaveVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      vendorId,
      input,
    }: {
      vendorId?: string;
      input: VendorInput;
    }) => (vendorId ? updateVendor(vendorId, input) : createVendor(input)),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: vendorKeys.all }),
  });
}
