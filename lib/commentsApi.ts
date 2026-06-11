import { apiFetch, buildUrl } from "@/lib/apiClient";
import type {
  BackendComment,
  CreateCommentInput,
  ListSourceQuery,
} from "@/types/activity-api";

export function fetchComments(query: ListSourceQuery) {
  return apiFetch<BackendComment[]>(
    buildUrl("api/v1/comments", {
      sourceType: query.sourceType,
      sourceCode: query.sourceCode,
      limit: query.limit,
      offset: query.offset,
    }),
  );
}

export function createComment(input: CreateCommentInput) {
  return apiFetch<BackendComment>(buildUrl("api/v1/comments"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}
