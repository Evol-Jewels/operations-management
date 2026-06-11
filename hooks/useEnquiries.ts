"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createEnquiry,
  createEstimation,
  fetchEnquiries,
  fetchEnquiryDetails,
  fetchEnquiryDetailsByRefCode,
  updateEnquiry,
  updateEstimation,
} from "@/lib/enquiriesApi";
import type {
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
  details: () => [...enquiryKeys.all, "detail"] as const,
  detail: (id: string) => [...enquiryKeys.details(), id] as const,
  detailByRefCode: (refCode: number) =>
    [...enquiryKeys.all, "detail", "ref", refCode] as const,
};

export function useEnquiries(query: ListEnquiriesQuery = {}) {
  return useQuery({
    queryKey: enquiryKeys.list(query),
    queryFn: () => fetchEnquiries(query),
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

export function useCreateEstimation(enquiryId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      itemId,
      input,
    }: {
      itemId: string;
      input: CreateEstimationInput;
    }) => createEstimation(itemId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: enquiryKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: enquiryKeys.details(),
      });
    },
  });
}

export function useUpdateEstimation(enquiryId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      estimationId,
      input,
    }: {
      estimationId: string;
      input: UpdateEstimationInput;
    }) => updateEstimation(estimationId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: enquiryKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: enquiryKeys.details(),
      });
    },
  });
}
