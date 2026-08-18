import type { BackendOrderStatus } from "@/types/order-api";

const VENDOR_PROMPT_EXCLUDED_STATUSES = new Set<BackendOrderStatus>([
  "CLOSED",
  "CANCELLED",
]);

export function shouldPromptForVendorDetails(
  currentStatus: BackendOrderStatus | undefined,
  nextStatus: BackendOrderStatus,
) {
  return (
    currentStatus === "NEW" &&
    nextStatus !== "NEW" &&
    !VENDOR_PROMPT_EXCLUDED_STATUSES.has(nextStatus)
  );
}
