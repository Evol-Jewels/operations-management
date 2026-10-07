import type { Order } from "@/types";

export function isOlderTerminalRecord(
  record: Pick<Order, "type" | "currentStage" | "enquiryStatus" | "createdAt">,
  cutoff: number,
) {
  const isTerminal =
    record.type === "enquiry"
      ? record.enquiryStatus === "CLOSED" ||
        record.enquiryStatus === "CONVERTED"
      : record.currentStage === "Closed" || record.currentStage === "Cancelled";

  return isTerminal && Date.parse(record.createdAt) < cutoff;
}
