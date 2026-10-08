import { apiFetch, buildUrl } from "@/lib/apiClient";
import { uploadEnquiryImage, uploadEnquiryRecording } from "@/lib/enquiriesApi";
import type {
  Repair,
  RepairComment,
  RepairDraft,
  RepairReference,
  RepairStage,
  RepairVendor,
} from "@/lib/repairs";

async function uploadReference(reference: RepairReference) {
  if (!reference.file) {
    if (!reference.url) throw new Error(`Missing media for ${reference.name}.`);
    return reference;
  }
  const file = new File([reference.file], reference.name, {
    type: reference.file.type,
  });
  const uploaded =
    reference.type === "image"
      ? await uploadEnquiryImage(file)
      : reference.type === "audio" || reference.type === "video"
        ? await uploadEnquiryRecording(file, reference.type)
        : null;
  if (!uploaded) throw new Error("Links cannot contain uploaded files.");
  return {
    id: reference.id,
    type: reference.type,
    name: uploaded.name || reference.name,
    url: uploaded.url,
    mimeType: uploaded.mimeType || file.type,
    size: uploaded.size ?? file.size,
    durationSeconds: uploaded.durationSeconds ?? reference.durationSeconds,
  };
}

export async function fetchRepairs(): Promise<Repair[]> {
  const repairs: Repair[] = [];
  let total = 0;
  do {
    const page = await apiFetch<{ data: Repair[]; total: number }>(
      buildUrl("api/v1/repairs", { limit: 100, offset: repairs.length }),
    );
    repairs.push(...page.data);
    total = page.total;
    if (!page.data.length) break;
  } while (repairs.length < total);
  return repairs;
}

export function fetchRepair(id: string) {
  return apiFetch<Repair>(buildUrl(`api/v1/repairs/${id}`));
}

export async function createRepair(draft: RepairDraft) {
  const { images, video, references, ...details } = draft;
  const media: RepairReference[] = references ?? [
    ...images.map((image) => ({ ...image, type: "image" as const })),
    ...(video ? [{ ...video, type: "video" as const }] : []),
  ];
  const uploaded = await Promise.all(media.map(uploadReference));
  return apiFetch<Repair>(buildUrl("api/v1/repairs"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...details, references: uploaded }),
  });
}

export function updateRepairStage(
  id: string,
  stage: RepairStage,
  vendor?: RepairVendor,
) {
  return apiFetch<Repair>(buildUrl(`api/v1/repairs/${id}/stage`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stage, vendor }),
  });
}

export function updateRepairVendor(id: string, vendor: RepairVendor) {
  return apiFetch<Repair>(buildUrl(`api/v1/repairs/${id}/vendor`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(vendor),
  });
}

export async function postRepairComment(
  id: string,
  comment: Pick<RepairComment, "message" | "attachments">,
) {
  const attachments = await Promise.all(
    comment.attachments.map(uploadReference),
  );
  return apiFetch<Repair>(buildUrl(`api/v1/repairs/${id}/comments`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: comment.message, attachments }),
  });
}
