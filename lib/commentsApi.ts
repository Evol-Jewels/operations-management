import { apiFetch, buildUrl } from "@/lib/apiClient";
import {
  uploadEnquiryImage,
  uploadEnquiryRecording,
} from "@/lib/enquiriesApi";
import type {
  BackendComment,
  BackendCommentMedia,
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

export async function uploadCommentMedia(
  files: File[],
): Promise<BackendCommentMedia[]> {
  return Promise.all(
    files.map(async (file) => {
      if (file.type.startsWith("image/")) return uploadEnquiryImage(file);
      if (file.type.startsWith("video/"))
        return uploadEnquiryRecording(file, "video");
      if (file.type.startsWith("audio/"))
        return uploadEnquiryRecording(file, "audio");
      throw new Error(`${file.name} is not a supported image, video, or audio file.`);
    }),
  );
}
