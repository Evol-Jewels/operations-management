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

export function statusBadgeClass(status: string) {
  if (status === "Closed" || status === "Delivered" || status === "Cancelled") {
    return "border-muted-foreground/20 bg-muted text-foreground dark:border-muted-foreground/20 dark:bg-muted/50";
  }
  if (status === "Converted" || status === "Order Confirmed") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400";
  }
  if (status === "Estimated") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400";
  }
  if (status === "New") {
    return "border-red-500/20 bg-red-500/10 text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400";
  }
  if (status === "In Progress") {
    return "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400";
  }
  if (status === "In Production" || status === "Certification") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400";
  }
  return "border-border bg-muted text-muted-foreground";
}
