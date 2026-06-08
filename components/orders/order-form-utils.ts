import type {
  BackendEnquiryMedia,
  BackendEnquiryStone,
} from "@/types/enquiry-api";
import type {
  NewProduct,
  ProductReference,
} from "../enquiries/enquiry-form-types";

export function addDaysDateString(baseDate: Date, days: number) {
  const next = new Date(baseDate);
  next.setDate(next.getDate() + days);
  return next.toISOString().slice(0, 10);
}

export function referenceToOrderMedia(
  reference: ProductReference,
): BackendEnquiryMedia | null {
  if (reference.type === "link") {
    return { type: "LINK", url: reference.url };
  }

  if (reference.url.startsWith("http")) {
    return {
      type: reference.type === "image" ? "IMAGE" : "VIDEO",
      url: reference.url,
    };
  }

  return null;
}

export function customProductStones(
  product: NewProduct,
): BackendEnquiryStone[] {
  if (!product.stoneDescription.trim()) return [];

  return [
    {
      stoneType: product.stoneDescription,
      weight: product.stoneCaratEstimate || undefined,
    },
  ];
}
