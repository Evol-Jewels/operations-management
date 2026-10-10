import type {
  ActivityEntry,
  EnquiryColorStone,
  EnquiryDiamond,
  PersonSummary,
  Stage,
} from "@/types";
import { getProductMediaProxyUrl } from "./inventory-media";

export interface BulkOrderAmounts {
  metal: number;
  stone: number;
  other: number;
  labour: number;
  quoted: number;
}

export interface BulkOrderProduct {
  vendorDesignNumber: string;
  category: string;
  productSize: string;
  metalType: string;
  metalPurity: string;
  metalColor: string;
  polish: string;
  certification: string;
  diamondQuality: string;
  grossWeight: number;
  netWeight: number;
  diamonds: EnquiryDiamond[];
  colorStones: EnquiryColorStone[];
  amounts: BulkOrderAmounts;
}

export interface BulkOrderItem extends BulkOrderProduct {
  serialNumber: number;
  quantity: number;
  imageMediaIds: string[];
  stage: BulkItemStage;
  estimatedDeliveryDate: string;
  remarks?: string;
  stageRemark?: string;
  activity: ActivityEntry[];
}

export interface BulkOrder {
  refCode: number;
  packingListNumber: string;
  vendorName: string;
  vendorCity: string;
  quotationDate: string;
  expectedDeliveryDate: string;
  currency: string;
  createdAt: string;
  createdBy: PersonSummary;
  items: BulkOrderItem[];
}

export const BULK_ITEM_STAGES = [
  "New",
  "CAD Design",
  "In Production",
  "Certification",
  "At Store",
  "In Photoshoot",
  "Editing",
  "Website Upload",
  "Closed",
  "Cancelled",
] as const satisfies readonly Stage[];

export type BulkItemStage = (typeof BULK_ITEM_STAGES)[number];

export const BULK_ITEM_FLOW_STAGES = BULK_ITEM_STAGES.filter(
  (stage) => stage !== "Cancelled",
);

// Vendor pieces count as filled once they reach the store.
export const FILLED_FROM_STAGE: BulkItemStage = "At Store";

export function isLockedBulkItemStage(stage: Stage) {
  return stage === "Closed" || stage === "Cancelled";
}

export function isFilledStage(stage: BulkItemStage) {
  return (
    stage !== "Cancelled" &&
    BULK_ITEM_STAGES.indexOf(stage) >=
      BULK_ITEM_STAGES.indexOf(FILLED_FROM_STAGE)
  );
}

export type BulkItemStatus = "Pending" | "Filled" | "Cancelled";
export type BulkOrderStatus = BulkItemStatus | "Partially filled";
export type FulfilmentFilter = "all" | "pending" | "filled" | "cancelled";

export function getBulkItemStatus(item: BulkOrderItem): BulkItemStatus {
  if (item.stage === "Cancelled") return "Cancelled";
  return isFilledStage(item.stage) ? "Filled" : "Pending";
}

export function isBulkItemFilled(item: BulkOrderItem) {
  return getBulkItemStatus(item) === "Filled";
}

export function isBulkItemPending(item: BulkOrderItem) {
  return getBulkItemStatus(item) === "Pending";
}

export function matchesItemFilter(
  filter: FulfilmentFilter,
  item: BulkOrderItem,
) {
  return filter === "all" || getBulkItemStatus(item).toLowerCase() === filter;
}

export function matchesOrderFilter(
  filter: FulfilmentFilter,
  status: BulkOrderStatus,
) {
  if (filter === "all") return true;
  if (filter === "pending") {
    return status === "Pending" || status === "Partially filled";
  }
  return status.toLowerCase() === filter;
}

export function formatBulkOrderRef(refCode: number) {
  return `BO-${String(refCode).padStart(3, "0")}`;
}

export function formatBulkDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function getBulkItemHref(refCode: number, serialNumber: number) {
  return `/bulk-orders/${refCode}/items/${serialNumber}`;
}

export function getBulkItemImageUrls(item: BulkOrderItem) {
  return item.imageMediaIds
    .map(getProductMediaProxyUrl)
    .filter((url): url is string => Boolean(url));
}

export function getDiamondTotals(item: BulkOrderProduct) {
  return item.diamonds.reduce(
    (totals, diamond) => ({
      pieces: totals.pieces + Number(diamond.pieces ?? 0),
      weight: totals.weight + Number.parseFloat(diamond.weight ?? "0"),
    }),
    { pieces: 0, weight: 0 },
  );
}

export function summarizeBulkOrder(order: BulkOrder) {
  const active = order.items.filter((item) => item.stage !== "Cancelled");
  const cancelled = order.items.filter((item) => item.stage === "Cancelled");
  const filledItems = active.filter(isBulkItemFilled);
  const pieces = sum(active, (item) => item.quantity);
  const filled = sum(filledItems, (item) => item.quantity);
  const status: BulkOrderStatus =
    active.length === 0
      ? "Cancelled"
      : filled === 0
        ? "Pending"
        : filled < pieces
          ? "Partially filled"
          : "Filled";

  return {
    status,
    lines: order.items.length,
    filledLines: filledItems.length,
    pendingLines: active.length - filledItems.length,
    cancelledLines: cancelled.length,
    pieces,
    filled,
    pending: pieces - filled,
    cancelledAmount: sum(cancelled, (item) => item.amounts.quoted),
    amounts: {
      metal: sum(active, (item) => item.amounts.metal),
      stone: sum(active, (item) => item.amounts.stone),
      other: sum(active, (item) => item.amounts.other),
      labour: sum(active, (item) => item.amounts.labour),
      quoted: sum(active, (item) => item.amounts.quoted),
    },
  };
}

function sum<T>(items: T[], getValue: (item: T) => number) {
  return items.reduce((total, item) => total + getValue(item), 0);
}
