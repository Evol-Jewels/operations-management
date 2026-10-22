"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createRefillRequest,
  fetchRefillRequests,
  updateRefillRequestStatus,
} from "@/lib/refillRequestsApi";
import type { RefillRequestStatus } from "@/types/refill-request-api";

const refillRequestKeys = { all: ["refill-requests"] as const };

export function useRefillRequests(enabled = true) {
  return useQuery({
    queryKey: refillRequestKeys.all,
    queryFn: fetchRefillRequests,
    enabled,
  });
}

export function useCreateRefillRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRefillRequest,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: refillRequestKeys.all }),
  });
}

export function useUpdateRefillRequestStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      refCode,
      status,
    }: {
      refCode: number;
      status: Exclude<RefillRequestStatus, "PENDING">;
    }) => updateRefillRequestStatus(refCode, status),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: refillRequestKeys.all }),
  });
}
