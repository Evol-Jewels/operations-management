import {
  BULK_ITEM_STAGES,
  type BulkItemStage,
  type BulkOrder,
  type BulkOrderItem,
  type BulkOrderListRow,
  type BulkOrderStatus,
  type BulkOrderSummary,
} from "@/lib/bulkOrders";
import {
  mapBackendOrderStatusToStage,
  mapProductDetailsCategory,
} from "@/lib/orderMappers";
import { normalizePerson } from "@/lib/people";
import type {
  BackendBulkOrder,
  BackendBulkOrderDetails,
  BackendBulkOrderItem,
  BackendBulkOrderStatus,
  BackendBulkOrderSummary,
} from "@/types/bulk-order-api";
import type { BackendOrderStatus } from "@/types/order-api";

const BULK_ORDER_STATUS_LABELS: Record<
  BackendBulkOrderStatus,
  BulkOrderStatus
> = {
  PENDING: "Pending",
  PARTIALLY_FILLED: "Partially filled",
  FILLED: "Filled",
  CANCELLED: "Cancelled",
};

export const BULK_STAGE_TO_STATUS: Record<BulkItemStage, BackendOrderStatus> = {
  New: "NEW",
  "CAD Design": "CAD_DESIGN",
  "In Production": "IN_PRODUCTION",
  Certification: "CERTIFICATION",
  "At Store": "AT_STORE",
  "In Photoshoot": "IN_PHOTOSHOOT",
  Editing: "EDITING",
  "Website Upload": "WEBSITE_UPLOAD",
  Closed: "CLOSED",
  Cancelled: "CANCELLED",
};

function toAmount(value?: string | null) {
  return Number(value ?? 0);
}

function sumAmounts(rows: Array<{ amount: string }>) {
  return rows.reduce((total, row) => total + toAmount(row.amount), 0);
}

function toTitleCase(value?: string | null) {
  return value ? value.charAt(0) + value.slice(1).toLowerCase() : "";
}

function toBulkItemStage(status: BackendOrderStatus): BulkItemStage {
  const stage = mapBackendOrderStatusToStage(status);
  return BULK_ITEM_STAGES.find((value) => value === stage) ?? "New";
}

function mapBulkOrderItem(
  item: BackendBulkOrderItem,
  order: BackendBulkOrder,
): BulkOrderItem {
  const product = item.customProduct;
  const spec = product?.requirementSpecification;
  const diamonds = spec?.diamonds ?? [];
  const quote = item.quotationBreakdown;

  return {
    orderRefCode: item.refCode,
    serialNumber: item.bulkSerialNumber,
    quantity: item.quantity,
    stage: toBulkItemStage(item.status),
    estimatedDeliveryDate:
      item.estimatedDeliveryDate ?? order.expectedDeliveryDate,
    remarks: item.notes ?? undefined,
    imageUrls: (spec?.references ?? [])
      .filter((reference) => reference.type === "IMAGE")
      .map((reference) => reference.url),
    vendorDesignNumber: item.vendorDesignNumber,
    category: mapProductDetailsCategory(product?.category),
    productSize:
      spec?.details?.productSize ??
      (product?.size != null ? String(product.size) : ""),
    metalType: product?.metalType ?? "",
    metalPurity: product?.metalPurity ?? "",
    metalColor: spec?.details?.metalColor ?? toTitleCase(product?.metalColor),
    polish: spec?.details?.polish ?? "",
    certification: spec?.details?.certification ?? "",
    diamondQuality: [
      ...new Set(diamonds.map((diamond) => diamond.clarity).filter(Boolean)),
    ].join(", "),
    grossWeight: toAmount(product?.metalGrossWeight),
    netWeight: toAmount(product?.metalNetWeight),
    diamonds,
    colorStones: spec?.colorStones ?? [],
    amounts: {
      metal: toAmount(quote.metal.amount),
      stone: sumAmounts([...quote.diamonds, ...quote.colorStones]),
      other: sumAmounts(quote.other) + toAmount(quote.setting),
      labour: toAmount(quote.labour.amount),
      quoted: toAmount(item.quotedSubtotal),
    },
  };
}

function mapBulkOrderSummary(
  summary: BackendBulkOrderSummary,
): BulkOrderSummary {
  return {
    status: BULK_ORDER_STATUS_LABELS[summary.status],
    lines: summary.lines,
    filledLines: summary.filledLines,
    pendingLines: summary.pendingLines,
    cancelledLines: summary.cancelledLines,
    pieces: summary.pieces,
    filled: summary.filled,
    pending: summary.pending,
    cancelledAmount: toAmount(summary.cancelledAmount),
    amounts: {
      metal: toAmount(summary.amounts.metal),
      stone: toAmount(summary.amounts.stone),
      other:
        toAmount(summary.amounts.other) + toAmount(summary.amounts.setting),
      labour: toAmount(summary.amounts.labour),
      quoted: toAmount(summary.amounts.quoted),
    },
  };
}

function mapBulkOrderHeader(order: BackendBulkOrder): Omit<BulkOrder, "items"> {
  return {
    refCode: order.refCode,
    packingListNumber: order.packingListNumber,
    vendorName: order.vendorName,
    vendorCity: order.vendorCity ?? "",
    quotationDate: order.quotationDate,
    expectedDeliveryDate: order.expectedDeliveryDate,
    currency: order.currency,
    createdAt: order.createdAt,
    createdBy: normalizePerson(order.createdBy),
  };
}

export function mapBackendBulkOrderRows(
  orders: BackendBulkOrder[],
): BulkOrderListRow[] {
  return orders.map((order) => ({
    ...mapBulkOrderHeader(order),
    previewImages: order.previewImages ?? [],
    summary: mapBulkOrderSummary(order.summary),
  }));
}

export function mapBackendBulkOrder(order: BackendBulkOrderDetails): BulkOrder {
  return {
    ...mapBulkOrderHeader(order),
    items: order.items.map((item) => mapBulkOrderItem(item, order)),
  };
}
