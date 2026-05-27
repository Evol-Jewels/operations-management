"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchSystemConfigs, updateSystemConfig } from "@/lib/systemConfigApi";
import type { UpdateSystemConfigInput } from "@/types";

export const systemConfigKeys = {
  all: ["system-configs"] as const,
  list: () => [...systemConfigKeys.all, "list"] as const,
};

export function useSystemConfigs() {
  return useQuery({
    queryKey: systemConfigKeys.list(),
    queryFn: fetchSystemConfigs,
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
