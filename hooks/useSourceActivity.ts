"use client";

import {
  type QueryKey,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { fetchActivityLogs } from "@/lib/activityLogsApi";
import { createComment, fetchComments } from "@/lib/commentsApi";
import type { SourceType } from "@/types/activity-api";

export const sourceActivityKeys = {
  recentActivityLogs: (query: Record<string, unknown>) =>
    ["activity-logs", "recent", query] as const,
  comments: (sourceType: SourceType, sourceCode: number) =>
    ["comments", sourceType, sourceCode] as const,
  activityLogs: (sourceType: SourceType, sourceCode: number) =>
    ["activity-logs", sourceType, sourceCode] as const,
};

export function useComments(sourceType: SourceType, sourceCode: number) {
  return useQuery({
    queryKey: sourceActivityKeys.comments(sourceType, sourceCode),
    queryFn: () => fetchComments({ sourceType, sourceCode }),
    enabled: Boolean(sourceCode),
  });
}

export function useActivityLogs(sourceType: SourceType, sourceCode: number) {
  return useQuery({
    queryKey: sourceActivityKeys.activityLogs(sourceType, sourceCode),
    queryFn: () => fetchActivityLogs({ sourceType, sourceCode }),
    enabled: Boolean(sourceCode),
  });
}

export function useInfiniteActivityLogs(
  query: Parameters<typeof fetchActivityLogs>[0] = {},
) {
  const { limit = 20, ...filters } = query;

  return useInfiniteQuery({
    queryKey: sourceActivityKeys.recentActivityLogs({ ...filters, limit }),
    queryFn: ({ pageParam }) =>
      fetchActivityLogs({
        ...filters,
        limit,
        offset: pageParam as number,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < limit) return undefined;
      return allPages.reduce((sum, page) => sum + page.length, 0);
    },
  });
}

interface UseCreateCommentOptions {
  invalidateQueryKeys?: QueryKey[];
}

export function useCreateComment(
  sourceType: SourceType,
  sourceCode: number,
  options: UseCreateCommentOptions = {},
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: string) =>
      createComment({ sourceType, sourceCode, content }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: sourceActivityKeys.comments(sourceType, sourceCode),
      });
      void queryClient.invalidateQueries({
        queryKey: sourceActivityKeys.activityLogs(sourceType, sourceCode),
      });
      for (const queryKey of options.invalidateQueryKeys ?? []) {
        void queryClient.invalidateQueries({ queryKey });
      }
    },
  });
}
