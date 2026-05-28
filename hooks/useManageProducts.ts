"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createMetal,
  createStoneSlab,
  createStoneType,
  deleteMetal,
  deleteStoneSlab,
  deleteStoneType,
  fetchMetals,
  fetchStoneSlabs,
  fetchStoneTypes,
  type ListMetalsQuery,
  type ListStoneSlabsQuery,
  type ListStoneTypesQuery,
  updateMetal,
  updateStoneSlab,
  updateStoneType,
} from "@/lib/manageProductsApi";
import type {
  CreateMetalInput,
  CreateStoneSlabInput,
  CreateStoneTypeInput,
  UpdateMetalInput,
  UpdateStoneSlabInput,
  UpdateStoneTypeInput,
} from "@/types/manage-products-api";

export const manageProductsKeys = {
  all: ["manage-products"] as const,
  stoneTypes: () => [...manageProductsKeys.all, "stone-types"] as const,
  stoneTypesList: (query: ListStoneTypesQuery = {}) =>
    [...manageProductsKeys.stoneTypes(), query] as const,
  stoneSlabs: () => [...manageProductsKeys.all, "stone-slabs"] as const,
  stoneSlabsList: (query: ListStoneSlabsQuery = {}) =>
    [...manageProductsKeys.stoneSlabs(), query] as const,
  metals: () => [...manageProductsKeys.all, "metals"] as const,
  metalsList: (query: ListMetalsQuery = {}) =>
    [...manageProductsKeys.metals(), query] as const,
};

export function useStoneTypes(
  query: ListStoneTypesQuery = {},
  enabled = true,
) {
  return useQuery({
    queryKey: manageProductsKeys.stoneTypesList(query),
    queryFn: () => fetchStoneTypes(query),
    enabled,
  });
}

export function useCreateStoneType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateStoneTypeInput) => createStoneType(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: manageProductsKeys.stoneTypes(),
      });
    },
  });
}

export function useUpdateStoneType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateStoneTypeInput }) =>
      updateStoneType(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: manageProductsKeys.stoneTypes(),
      });
    },
  });
}

export function useDeleteStoneType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteStoneType(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: manageProductsKeys.stoneTypes(),
      });
      void queryClient.invalidateQueries({
        queryKey: manageProductsKeys.stoneSlabs(),
      });
    },
  });
}

export function useStoneSlabs(query: ListStoneSlabsQuery = {}, enabled = true) {
  return useQuery({
    queryKey: manageProductsKeys.stoneSlabsList(query),
    queryFn: () => fetchStoneSlabs(query),
    enabled,
  });
}

export function useCreateStoneSlab() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateStoneSlabInput) => createStoneSlab(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: manageProductsKeys.stoneSlabs(),
      });
    },
  });
}

export function useUpdateStoneSlab() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateStoneSlabInput }) =>
      updateStoneSlab(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: manageProductsKeys.stoneSlabs(),
      });
    },
  });
}

export function useDeleteStoneSlab() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteStoneSlab(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: manageProductsKeys.stoneSlabs(),
      });
    },
  });
}

export function useMetals(query: ListMetalsQuery = {}, enabled = true) {
  return useQuery({
    queryKey: manageProductsKeys.metalsList(query),
    queryFn: () => fetchMetals(query),
    enabled,
  });
}

export function useCreateMetal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateMetalInput) => createMetal(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: manageProductsKeys.metals(),
      });
    },
  });
}

export function useUpdateMetal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateMetalInput }) =>
      updateMetal(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: manageProductsKeys.metals(),
      });
    },
  });
}

export function useDeleteMetal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteMetal(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: manageProductsKeys.metals(),
      });
    },
  });
}
