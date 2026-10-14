import type {
  BackendEnquiryDetails,
  BackendEstimationRow,
} from "@/types/enquiry-api";

export function upsertEnquiryEstimation(
  details: BackendEnquiryDetails | undefined,
  estimation: BackendEstimationRow,
  itemId: string,
) {
  if (!details?.items.some((item) => item.id === itemId)) return details;
  return {
    ...details,
    items: details.items.map((item) =>
      item.id === itemId
        ? {
            ...item,
            estimations: [
              { ...estimation, enquiryItemId: itemId },
              ...(item.estimations ?? []).filter(
                (existing) => existing.id !== estimation.id,
              ),
            ].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
          }
        : item,
    ),
  };
}
