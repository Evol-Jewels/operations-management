import { format, parseISO } from "date-fns";
import type { BackendOrderStatus } from "@/types/order-api";
import type { OrdersEnquiriesAnalyticsResponse } from "@/types/orders-enquiries-analytics-api";

type Snapshot = OrdersEnquiriesAnalyticsResponse["currentSnapshot"];
type EnquiryFunnel =
  OrdersEnquiriesAnalyticsResponse["periodActivity"]["enquiryFunnel"];

export interface DistributionSegment {
  label: string;
  value: number;
  className: string;
}

export interface StageCount {
  label: string;
  value: number;
  href: string;
}

export const ORDER_STATUS_LABELS: Record<BackendOrderStatus, string> = {
  NEW: "New",
  IN_PRODUCTION: "In Production",
  CAD_DESIGN: "CAD Design",
  IN_TRANSIT: "In Transit",
  CERTIFICATION: "Certification",
  AT_STORE: "At Store",
  IN_PHOTOSHOOT: "In Photoshoot",
  EDITING: "Editing",
  POST_EDITING: "Post Editing",
  WEBSITE_UPLOAD: "Website Upload",
  DELIVERED: "Delivered",
  CLOSED: "Closed",
  CANCELLED: "Cancelled",
};

export function getUrgencySegments(snapshot: Snapshot): DistributionSegment[] {
  const onTrack =
    snapshot.activeOrders -
    snapshot.overdueOrders -
    snapshot.dueSoonOrders -
    snapshot.noDeliveryDateOrders;

  return [
    {
      label: "Overdue",
      value: snapshot.overdueOrders,
      className: "bg-red-500",
    },
    {
      label: "Due soon",
      value: snapshot.dueSoonOrders,
      className: "bg-amber-500",
    },
    {
      label: "On track",
      value: Math.max(0, onTrack),
      className: "bg-emerald-500",
    },
    {
      label: "No date",
      value: snapshot.noDeliveryDateOrders,
      className: "bg-zinc-400 dark:bg-zinc-500",
    },
  ];
}

export function getFunnelSegments(
  funnel: EnquiryFunnel,
): DistributionSegment[] {
  return [
    { label: "New", value: funnel.NEW, className: "bg-sky-500" },
    { label: "Estimated", value: funnel.ESTIMATED, className: "bg-violet-500" },
    {
      label: "Converted",
      value: funnel.CONVERTED,
      className: "bg-emerald-600",
    },
    {
      label: "Closed",
      value: funnel.CLOSED,
      className: "bg-zinc-400 dark:bg-zinc-500",
    },
  ];
}

export function getStageCounts(stages: Snapshot["orderStages"]): StageCount[] {
  return stages.map(({ status, count }) => {
    const label = ORDER_STATUS_LABELS[status];
    const params = new URLSearchParams({
      type: "order",
      view: "table",
      status: label,
    });

    return { label, value: count, href: `/orders-workspace?${params}` };
  });
}

export function formatAnalyticsPeriod(
  period: OrdersEnquiriesAnalyticsResponse["period"],
) {
  const from = parseISO(period.from);
  const to = parseISO(period.to);
  const sameYear = from.getFullYear() === to.getFullYear();

  return `${format(from, sameYear ? "d MMM" : "d MMM yyyy")} – ${format(to, "d MMM yyyy")}`;
}

export function formatTrendDate(date: string) {
  return format(parseISO(date), "d MMM");
}

export function formatDuration(value: number | null, unit: "h" | "d") {
  if (value == null) return null;
  return `${Number(value.toFixed(1))}${unit}`;
}
