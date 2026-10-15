"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createEnquiry,
  createEstimation,
  fetchEnquiries,
  fetchEnquiryDetails,
  fetchEnquiryDetailsByRefCode,
  fetchMyEnquiries,
  fetchItemEstimations,
  fetchOpenStoreEnquiries,
  updateEnquiry,
  updateEstimation,
} from "@/lib/enquiriesApi";
import { upsertEnquiryEstimation } from "@/lib/enquiryEstimationCache";
import type {
  BackendEnquiryDetails,
  CreateEnquiryInput,
  CreateEstimationInput,
  ListEnquiriesQuery,
  UpdateEnquiryInput,
  UpdateEstimationInput,
} from "@/types/enquiry-api";

export const enquiryKeys = {
  all: ["enquiries"] as const,
  lists: () => [...enquiryKeys.all, "list"] as const,
  list: (query: ListEnquiriesQuery = {}) =>
    [...enquiryKeys.lists(), query] as const,
  mine: () => [...enquiryKeys.all, "me"] as const,
  store: () => [...enquiryKeys.lists(), "store"] as const,
  details: () => [...enquiryKeys.all, "detail"] as const,
  detail: (id: string) => [...enquiryKeys.details(), id] as const,
  detailByRefCode: (refCode: number) =>
    [...enquiryKeys.all, "detail", "ref", refCode] as const,
  itemEstimations: (itemId: string) =>
    [...enquiryKeys.all, "item-estimations", itemId] as const,
};

export function useOpenStoreEnquiries(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: enquiryKeys.store(),
    queryFn: fetchOpenStoreEnquiries,
    enabled: options.enabled,
  });
}

export function useMyEnquiries(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: enquiryKeys.mine(),
    queryFn: fetchMyEnquiries,
    enabled: options.enabled,
  });
}

export function useEnquiries(
  query: ListEnquiriesQuery = {},
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: enquiryKeys.list(query),
    queryFn: () => fetchEnquiries(query),
    enabled: options.enabled,
  });
}

export function useEnquiryDetails(id: string) {
  return useQuery({
    queryKey: enquiryKeys.detail(id),
    queryFn: () => fetchEnquiryDetails(id),
    enabled: Boolean(id),
  });
}

export function useEnquiryDetailsByRefCode(refCode: number) {
  return useQuery({
    queryKey: enquiryKeys.detailByRefCode(refCode),
    queryFn: () => fetchEnquiryDetailsByRefCode(refCode),
    enabled: Boolean(refCode),
  });
}

export function useItemEstimations(itemId: string, enabled: boolean) {
  return useQuery({
    queryKey: enquiryKeys.itemEstimations(itemId),
    queryFn: () => fetchItemEstimations(itemId),
    enabled: Boolean(itemId) && enabled,
  });
}

export function useCreateEnquiry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateEnquiryInput) => createEnquiry(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: enquiryKeys.lists() });
    },
  });
}

export function useUpdateEnquiry(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateEnquiryInput) => updateEnquiry(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: enquiryKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: enquiryKeys.details() });
    },
  });
}

export function useCreateEstimation(_enquiryId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      itemId,
      input,
    }: {
      itemId: string;
      input: CreateEstimationInput;
    }) => createEstimation(itemId, input),
    onSuccess: async (estimation, { itemId }) => {
      queryClient.setQueriesData<BackendEnquiryDetails>(
        { queryKey: enquiryKeys.details() },
        (details) => upsertEnquiryEstimation(details, estimation, itemId),
      );
      await queryClient.invalidateQueries({ queryKey: enquiryKeys.all });
    },
  });
}

export function useUpdateEstimation(_enquiryId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      estimationId,
      input,
    }: {
      estimationId: string;
      itemId: string;
      input: UpdateEstimationInput;
    }) => updateEstimation(estimationId, input),
    onSuccess: async (estimation, { itemId }) => {
      queryClient.setQueriesData<BackendEnquiryDetails>(
        { queryKey: enquiryKeys.details() },
        (details) => upsertEnquiryEstimation(details, estimation, itemId),
      );
      await queryClient.invalidateQueries({ queryKey: enquiryKeys.all });
    },
  });
}
