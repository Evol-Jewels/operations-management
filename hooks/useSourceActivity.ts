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
import type {
  BackendComment,
  BackendCommentMedia,
  SourceType,
} from "@/types/activity-api";

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
    mutationFn: (
      value: string | { content: string; media?: BackendCommentMedia[] },
    ) => {
      const comment = typeof value === "string" ? { content: value } : value;
      return createComment({ sourceType, sourceCode, ...comment });
    },
    onSuccess: async (comment, value) => {
      const submitted = typeof value === "string" ? undefined : value.media;
      const resolvedComment: BackendComment =
        submitted?.length && !comment.media?.length
          ? { ...comment, media: submitted }
          : comment;
      const commentsQueryKey = sourceActivityKeys.comments(
        sourceType,
        sourceCode,
      );

      queryClient.setQueryData<BackendComment[]>(
        commentsQueryKey,
        (current) => [
          resolvedComment,
          ...(current ?? []).filter((entry) => entry.id !== resolvedComment.id),
        ],
      );

      await queryClient.invalidateQueries({ queryKey: commentsQueryKey });

      // Older deployments may accept the comment but omit media from the
      // response/list endpoint. Keep the freshly uploaded media visible until
      // the backend with the media column is rolled out.
      if (submitted?.length) {
        queryClient.setQueryData<BackendComment[]>(
          commentsQueryKey,
          (current) => {
            const serverComment = current?.find(
              (entry) => entry.id === resolvedComment.id,
            );
            const preservedComment = serverComment?.media?.length
              ? serverComment
              : resolvedComment;
            return [
              preservedComment,
              ...(current ?? []).filter(
                (entry) => entry.id !== resolvedComment.id,
              ),
            ];
          },
        );
      }

      void queryClient.invalidateQueries({
        queryKey: sourceActivityKeys.activityLogs(sourceType, sourceCode),
      });
      for (const queryKey of options.invalidateQueryKeys ?? []) {
        void queryClient.invalidateQueries({ queryKey });
      }
    },
  });
}
