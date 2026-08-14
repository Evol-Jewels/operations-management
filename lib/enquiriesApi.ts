import { apiFetch, buildUrl } from "@/lib/apiClient";
import { prepareImageForUpload } from "@/lib/prepareImageUpload";
import type {
  BackendEnquiryDetails,
  BackendEnquiryListItem,
  BackendEnquiryMedia,
  BackendEstimationRow,
  CreateEnquiryInput,
  CreateEstimationInput,
  ListEnquiriesQuery,
  UpdateEnquiryInput,
  UpdateEstimationInput,
} from "@/types/enquiry-api";

const MAX_CONCURRENT_IMAGE_UPLOADS = 2;
let activeImageUploads = 0;
const pendingImageUploads: Array<() => void> = [];

async function withImageUploadSlot<T>(upload: () => Promise<T>) {
  if (activeImageUploads >= MAX_CONCURRENT_IMAGE_UPLOADS) {
    await new Promise<void>((resolve) => pendingImageUploads.push(resolve));
  }

  activeImageUploads += 1;
  try {
    return await upload();
  } finally {
    activeImageUploads -= 1;
    pendingImageUploads.shift()?.();
  }
}

export function fetchEnquiries(query: ListEnquiriesQuery = {}) {
  return apiFetch<BackendEnquiryListItem[]>(
    buildUrl("api/v1/enquiries", { ...query }),
  );
}

export function fetchMyEnquiries() {
  return apiFetch<BackendEnquiryListItem[]>(buildUrl("api/v1/enquiries/me"));
}

export function fetchOpenStoreEnquiries() {
  return apiFetch<BackendEnquiryListItem[]>(buildUrl("api/v1/enquiries/store"));
}

export function fetchEnquiryDetails(id: string) {
  return apiFetch<BackendEnquiryDetails>(buildUrl(`api/v1/enquiries/${id}`));
}

export function fetchEnquiryDetailsByRefCode(refCode: number) {
  return apiFetch<BackendEnquiryDetails>(
    buildUrl(`api/v1/enquiries/ref/${refCode}`),
  );
}

export function createEnquiry(input: CreateEnquiryInput) {
  return apiFetch<BackendEnquiryDetails>(buildUrl("api/v1/enquiries"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function uploadEnquiryImage(file: File) {
  return withImageUploadSlot(async () => {
    const prepared = await prepareImageForUpload(file);
    const body = new FormData();
    body.set("file", prepared);

    return apiFetch<BackendEnquiryMedia>(
      buildUrl("api/v1/uploads/enquiry-image"),
      {
        method: "POST",
        body,
      },
    );
  });
}

export function updateEnquiry(id: string, input: UpdateEnquiryInput) {
  return apiFetch<BackendEnquiryDetails>(buildUrl(`api/v1/enquiries/${id}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function createEstimation(itemId: string, input: CreateEstimationInput) {
  return apiFetch<BackendEstimationRow>(
    buildUrl(`api/v1/estimation/${itemId}`),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
}

export function updateEstimation(
  estimationId: string,
  input: UpdateEstimationInput,
) {
  return apiFetch<BackendEstimationRow>(
    buildUrl(`api/v1/estimation/${estimationId}`),
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
}

export function deleteEstimation(estimationId: string) {
  return apiFetch<{ deleted: true; id: string }>(
    buildUrl(`api/v1/estimation/${estimationId}`),
    { method: "DELETE" },
  );
}
