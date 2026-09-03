export type EnquiryRecordingKind = "audio" | "video";

export const ENQUIRY_MEDIA_LIMITS: Record<EnquiryRecordingKind, number> = {
  video: 10 * 1024 * 1024,
  audio: 3 * 1024 * 1024,
};

export function getEnquiryMediaSizeError(
  file: Pick<File, "size">,
  kind: EnquiryRecordingKind,
) {
  const limit = ENQUIRY_MEDIA_LIMITS[kind];
  if (file.size <= limit) return null;

  return `${kind === "video" ? "Video" : "Audio"} is ${formatMegabytes(file.size)}. The maximum allowed size is ${formatMegabytes(limit)}.`;
}

function formatMegabytes(bytes: number) {
  const megabytes = bytes / (1024 * 1024);
  return `${megabytes.toFixed(megabytes >= 10 ? 0 : 1)} MB`;
}
