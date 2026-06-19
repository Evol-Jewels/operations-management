import type { Order } from "@/types";
import type { BackendEnquiryStatus } from "@/types/enquiry-api";

export type EnquiryUiStatus = "New" | "Estimated" | "Converted" | "Closed";

export const ENQUIRY_STATUS_LABELS: Record<
  BackendEnquiryStatus,
  EnquiryUiStatus
> = {
  NEW: "New",
  ESTIMATED: "Estimated",
  CONVERTED: "Converted",
  CLOSED: "Closed",
};

export function getEnquiryUiStatus(
  status: BackendEnquiryStatus,
): EnquiryUiStatus {
  return ENQUIRY_STATUS_LABELS[status];
}

export function getOrderEnquiryUiStatus(order: Order): EnquiryUiStatus {
  return getEnquiryUiStatus(order.enquiryStatus ?? "NEW");
}

export function isEnquiryClosed(order: Order): boolean {
  return order.enquiryStatus === "CLOSED";
}

export function getRecordStatus(order: Order): string {
  if (order.type === "enquiry") return getOrderEnquiryUiStatus(order);
  return order.currentStage;
}
