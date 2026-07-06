"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createSpecialProductMakingCharge,
  deleteSpecialProductMakingCharge,
  fetchGoldRate,
  fetchSpecialProductMakingCharges,
  fetchSystemConfigs,
  updateSpecialProductMakingCharge,
  updateSystemConfig,
} from "@/lib/systemConfigApi";
import type {
  CreateSpecialProductMakingChargeInput,
  UpdateSpecialProductMakingChargeInput,
  UpdateSystemConfigInput,
} from "@/types";

export const systemConfigKeys = {
  all: ["system-configs"] as const,
  list: () => [...systemConfigKeys.all, "list"] as const,
};

export const goldRateKeys = {
  all: ["gold-rate"] as const,
};

export const specialProductMakingChargeKeys = {
  all: ["special-product-making-charges"] as const,
  list: (query: { productCode?: string; q?: string } = {}) =>
    [...specialProductMakingChargeKeys.all, "list", query] as const,
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

export function useSpecialProductMakingCharges(
  query: { productCode?: string; q?: string } = {},
  enabled = true,
) {
  return useQuery({
    queryKey: specialProductMakingChargeKeys.list(query),
    queryFn: () =>
      fetchSpecialProductMakingCharges({
        ...query,
        limit: 1000,
        offset: 0,
      }),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateSpecialProductMakingCharge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateSpecialProductMakingChargeInput) =>
      createSpecialProductMakingCharge(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: specialProductMakingChargeKeys.all,
      });
    },
  });
}

export function useUpdateSpecialProductMakingCharge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productCode,
      input,
    }: {
      productCode: string;
      input: UpdateSpecialProductMakingChargeInput;
    }) => updateSpecialProductMakingCharge(productCode, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: specialProductMakingChargeKeys.all,
      });
    },
  });
}

export function useDeleteSpecialProductMakingCharge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productCode: string) =>
      deleteSpecialProductMakingCharge(productCode),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: specialProductMakingChargeKeys.all,
      });
    },
  });
}
