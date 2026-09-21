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
      let uploaded: Awaited<ReturnType<typeof uploadEnquiryImage>>;
      let mediaType: BackendCommentMedia["type"];
      if (file.type.startsWith("image/")) {
        mediaType = "IMAGE";
        uploaded = await uploadEnquiryImage(file);
      } else if (file.type.startsWith("video/")) {
        mediaType = "VIDEO";
        uploaded = await uploadEnquiryRecording(file, "video");
      } else if (file.type.startsWith("audio/")) {
        mediaType = "AUDIO";
        uploaded = await uploadEnquiryRecording(file, "audio");
      } else {
        throw new Error(
          `${file.name} is not a supported image, video, or audio file.`,
        );
      }

      // Keep the attachment renderable even when an older upload endpoint
      // omits optional metadata from its response.
      return {
        ...uploaded,
        type: mediaType,
        name: uploaded.name || file.name,
        mimeType: uploaded.mimeType || file.type,
        size: uploaded.size ?? file.size,
      };
    }),
  );
}
