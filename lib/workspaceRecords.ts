import type { Order } from "@/types";

export function isOlderClosedRecord(
  record: Pick<Order, "type" | "currentStage" | "enquiryStatus" | "createdAt">,
  cutoff: number,
) {
  const isClosed =
    record.type === "enquiry"
      ? record.enquiryStatus === "CLOSED"
      : record.currentStage === "Closed" || record.currentStage === "Cancelled";

  return isClosed && Date.parse(record.createdAt) < cutoff;
}
