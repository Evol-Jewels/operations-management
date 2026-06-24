"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchGoldRate,
  fetchSystemConfigs,
  updateSystemConfig,
} from "@/lib/systemConfigApi";
import type { UpdateSystemConfigInput } from "@/types";

export const systemConfigKeys = {
  all: ["system-configs"] as const,
  list: () => [...systemConfigKeys.all, "list"] as const,
};

export const goldRateKeys = {
  all: ["gold-rate"] as const,
};

export function useGoldRate(enabled = true) {
  return useQuery({
    queryKey: goldRateKeys.all,
    queryFn: fetchGoldRate,
    enabled,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useSystemConfigs(
  enabled = true,
  options: { staleTime?: number } = {},
) {
  return useQuery({
    queryKey: systemConfigKeys.list(),
    queryFn: fetchSystemConfigs,
    enabled,
    staleTime: options.staleTime ?? 5 * 60 * 1000,
  });
}

export function useUpdateSystemConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      key,
      input,
    }: {
      key: string;
      input: UpdateSystemConfigInput;
    }) => updateSystemConfig(key, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: systemConfigKeys.all,
      });
    },
  });
}
