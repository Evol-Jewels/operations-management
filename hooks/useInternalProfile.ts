"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  changeInternalUserPassword,
  fetchMyInternalProfile,
  updateMyInternalProfile,
} from "@/lib/internalUserManagementApi";
import type {
  ChangeInternalPasswordInput,
  InternalUserProfileMeResponse,
  UpdateMyInternalProfileInput,
} from "@/types/user-management";

export const internalProfileKeys = {
  all: ["internal-profile"] as const,
  me: () => [...internalProfileKeys.all, "me"] as const,
};

export function useMyInternalProfile() {
  return useQuery({
    queryKey: internalProfileKeys.me(),
    queryFn: fetchMyInternalProfile,
  });
}

export function useUpdateMyInternalProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateMyInternalProfileInput) =>
      updateMyInternalProfile(input),
    onSuccess: (profile: InternalUserProfileMeResponse) => {
      queryClient.setQueryData(internalProfileKeys.me(), profile);
    },
  });
}

export function useChangeInternalPassword() {
  return useMutation({
    mutationFn: (input: ChangeInternalPasswordInput) =>
      changeInternalUserPassword(input),
  });
}
