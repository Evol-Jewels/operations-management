"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createLocation,
  createMetal,
  createStoneSlab,
  createStoneType,
  deleteLocation,
  deleteMetal,
  deleteStoneSlab,
  deleteStoneType,
  fetchLocations,
  fetchMetals,
  fetchStoneSlabs,
  fetchStoneTypes,
  type ListLocationsQuery,
  type ListMetalsQuery,
  type ListStoneSlabsQuery,
  type ListStoneTypesQuery,
  updateLocation,
  updateMetal,
  updateStoneSlab,
  updateStoneType,
} from "@/lib/manageProductsApi";
import type {
  CreateLocationInput,
  CreateMetalInput,
  CreateStoneSlabInput,
  CreateStoneTypeInput,
  UpdateLocationInput,
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
  locations: () => [...manageProductsKeys.all, "locations"] as const,
  locationsList: (query: ListLocationsQuery = {}) =>
    [...manageProductsKeys.locations(), query] as const,
  metals: () => [...manageProductsKeys.all, "metals"] as const,
  metalsList: (query: ListMetalsQuery = {}) =>
    [...manageProductsKeys.metals(), query] as const,
};

export function useStoneTypes(
  query: ListStoneTypesQuery = {},
  enabled = true,
  options: { staleTime?: number } = {},
) {
  return useQuery({
    queryKey: manageProductsKeys.stoneTypesList(query),
    queryFn: () => fetchStoneTypes(query),
    enabled,
    staleTime: options.staleTime,
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

export function useStoneSlabs(
  query: ListStoneSlabsQuery = {},
  enabled = true,
  options: { staleTime?: number } = {},
) {
  return useQuery({
    queryKey: manageProductsKeys.stoneSlabsList(query),
    queryFn: () => fetchStoneSlabs(query),
    enabled,
    staleTime: options.staleTime,
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

export function useLocations(query: ListLocationsQuery = {}, enabled = true) {
  return useQuery({
    queryKey: manageProductsKeys.locationsList(query),
    queryFn: () => fetchLocations(query),
    enabled,
  });
}

export function useCreateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateLocationInput) => createLocation(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: manageProductsKeys.locations(),
      });
    },
  });
}

export function useUpdateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateLocationInput }) =>
      updateLocation(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: manageProductsKeys.locations(),
      });
    },
  });
}

export function useDeleteLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteLocation(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: manageProductsKeys.locations(),
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
