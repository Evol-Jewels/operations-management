"use client";

import {
  AlertCircle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  PackageCheck,
  Truck,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { UrgencyDot } from "@/components/dashboard/UrgencyDot";
import {
  RequirementCard,
  RequirementCardBody,
} from "@/components/enquiry/requirements/RequirementCard";
import {
  DetailRow,
  DetailSection,
  RequirementDetailsPanel,
} from "@/components/enquiry/requirements/RequirementDetailsPanel";
import { RequirementImageCarousel } from "@/components/enquiry/requirements/RequirementMediaPanel";
import type { RequirementDisplayItem } from "@/components/enquiry/requirements/requirement-display-utils";
import { SpecLine, SpecSection } from "@/components/order/SpecSection";
import { StageBar } from "@/components/order/StageBar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BULK_ITEM_FLOW_STAGES,
  BULK_ITEM_STAGES,
  type BulkItemStatus,
  type BulkOrder,
  type BulkOrderItem,
  FILLED_FROM_STAGE,
  formatBulkDate,
  formatBulkOrderRef,
  getBulkItemImageUrls,
  getBulkItemStatus,
  getDiamondTotals,
  isFilledStage,
  isLockedBulkItemStage,
} from "@/lib/bulkOrders";
import { formatMetalTypeLabel } from "@/lib/metalDisplay";
import { useBulkOrder } from "@/lib/stores/bulk-orders-store";
import { cn, formatDaysRemaining, getUrgencyLevel } from "@/lib/utils";
import { AmountBreakdown } from "./AmountBreakdown";
import { BulkItemActivity } from "./BulkItemActivity";
import { FulfilmentBadge } from "./BulkOrderBadges";
import { BulkOrderNotFound } from "./BulkOrderDetailPage";
import { useBulkItemMove } from "./useBulkItemMove";

const FULFILMENT_HINTS: Record<BulkItemStatus, string> = {
  Pending: `Counts as filled once it reaches ${FILLED_FROM_STAGE}.`,
  Filled: "All pieces received at store.",
  Cancelled: "Excluded from this bulk order's pieces and totals.",
};

function toDisplayItem(
  order: BulkOrder,
  item: BulkOrderItem,
): RequirementDisplayItem {
  const images = getBulkItemImageUrls(item).map((url, index) => ({
    id: `${item.vendorDesignNumber}-image-${index}`,
    type: "image" as const,
    name: `${item.vendorDesignNumber} ${item.category}`,
    url,
  }));
  return {
    id: `bulk-${order.refCode}-${item.serialNumber}`,
    kind: "custom",
    title: item.category,
    subtitle: [
      item.vendorDesignNumber,
      formatMetalTypeLabel(item.metalType, item.metalColor),
      item.metalPurity,
      item.productSize,
    ].join(" · "),
    status: "CONVERTED",
    defaultPurity: "14K",
    references: images,
    images,
    videos: [],
    audios: [],
    links: [],
    diamonds: item.diamonds,
    colorStones: item.colorStones,
    details: {
      productSize: item.productSize,
      metalColor: item.metalColor,
      polish: item.polish,
      certification: item.certification,
    },
    metalType: item.metalType,
    metalPurity: item.metalPurity,
    metalWeight: `${item.netWeight.toFixed(3)} g`,
    notes: item.remarks,
  };
}

export function BulkOrderItemPage({
  refCode,
  serialNumber,
}: {
  refCode: number;
  serialNumber: number;
}) {
  const order = useBulkOrder(refCode);
  const { requestMove, dialog } = useBulkItemMove(refCode);
  const index =
    order?.items.findIndex((item) => item.serialNumber === serialNumber) ?? -1;
  const item = order?.items[index];
  if (!order || !item) return <BulkOrderNotFound label="Bulk order item" />;

  const orderHref = `/bulk-orders/${order.refCode}`;
  const previous = order.items[index - 1];
  const next = order.items[index + 1];
  const status = getBulkItemStatus(item);
  const isLocked = isLockedBulkItemStage(item.stage);
  const urgency = getUrgencyLevel(item.estimatedDeliveryDate);
  const displayItem = toDisplayItem(order, item);
  const diamondTotals = getDiamondTotals(item);
  const colorStonePieces = item.colorStones.reduce(
    (total, stone) => total + Number(stone.pieces ?? 0),
    0,
  );

  return (
    <div className="@container/bulk-item mx-auto w-full min-w-0 max-w-6xl">
      <div className="mb-5 flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="-ml-2 gap-1.5 text-muted-foreground"
        >
          <Link href={orderHref}>
            <ArrowLeft className="size-3.5" />
            {formatBulkOrderRef(order.refCode)} · {order.packingListNumber}
          </Link>
        </Button>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            asChild={Boolean(previous)}
            disabled={!previous}
            aria-label="Previous item"
          >
            {previous ? (
              <Link href={`${orderHref}/items/${previous.serialNumber}`}>
                <ChevronLeft className="size-4" />
              </Link>
            ) : (
              <ChevronLeft className="size-4" />
            )}
          </Button>
          <span className="text-xs tabular-nums text-muted-foreground">
            Item {index + 1} of {order.items.length}
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            asChild={Boolean(next)}
            disabled={!next}
            aria-label="Next item"
          >
            {next ? (
              <Link href={`${orderHref}/items/${next.serialNumber}`}>
                <ChevronRight className="size-4" />
              </Link>
            ) : (
              <ChevronRight className="size-4" />
            )}
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <h1 className="mb-2 break-words text-xl font-semibold tracking-tight text-foreground">
          {item.vendorDesignNumber}
          <span className="ml-2 font-normal text-muted-foreground">·</span>
          <span className="ml-2 text-base font-normal text-muted-foreground">
            {item.category}
          </span>
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <FulfilmentBadge status={status} withIcon className="h-7 px-3" />
          <span className="font-mono text-sm text-muted-foreground">
            {formatBulkOrderRef(order.refCode)}-{item.serialNumber}
          </span>
          {status === "Pending" && (
            <span
              className={cn(
                "flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                urgency === "overdue" &&
                  "bg-red-500/10 text-red-600 dark:text-red-400",
                urgency === "due-soon" &&
                  "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                urgency === "on-track" &&
                  "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
              )}
            >
              <UrgencyDot level={urgency} />
              {formatDaysRemaining(item.estimatedDeliveryDate)}
            </span>
          )}
          <div className="ml-auto">
            <Select
              value={item.stage}
              disabled={isLocked}
              onValueChange={(value) => {
                const stage = BULK_ITEM_STAGES.find(
                  (option) => option === value,
                );
                if (stage) requestMove(item, stage);
              }}
            >
              <SelectTrigger
                size="sm"
                aria-label="Item stage"
                className="h-8 min-w-36 text-xs"
                title={isLocked ? `${item.stage} items are locked` : undefined}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                {BULK_ITEM_STAGES.map((stage) => {
                  const closeBlocked =
                    stage === "Closed" && !isFilledStage(item.stage);
                  return (
                    <SelectItem
                      key={stage}
                      value={stage}
                      disabled={closeBlocked}
                    >
                      {stage}
                      {closeBlocked && (
                        <span className="text-[10px] text-muted-foreground">
                          after {FILLED_FROM_STAGE}
                        </span>
                      )}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {item.stage !== "Cancelled" && (
        <div className="mb-5 px-5 py-4">
          <StageBar currentStage={item.stage} stages={BULK_ITEM_FLOW_STAGES} />
        </div>
      )}

      <div className="grid min-w-0 items-start gap-5 @[60rem]/bulk-item:grid-cols-[minmax(0,1fr)_320px] @[60rem]/bulk-item:gap-7">
        <main className="min-w-0 space-y-5">
          {item.stageRemark && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3.5 py-3">
              <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                  {item.stage === "Cancelled"
                    ? "Cancellation remark"
                    : "Closing remark"}
                </p>
                <p className="text-sm leading-5 text-amber-900 dark:text-amber-200">
                  {item.stageRemark}
                </p>
              </div>
            </div>
          )}
          <RequirementCard>
            <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2.5">
              <p className="text-sm font-medium uppercase tracking-wide text-foreground">
                Item {item.serialNumber}{" "}
                <span className="font-normal text-muted-foreground">
                  of {order.items.length}
                </span>
              </p>
              <span className="text-xs text-muted-foreground">
                Qty {item.quantity}
              </span>
            </div>
            <RequirementCardBody>
              <div className="space-y-4">
                <RequirementImageCarousel item={displayItem} />
                <DetailSection title="Weights">
                  <DetailRow
                    label="Gross weight"
                    value={`${item.grossWeight.toFixed(3)} g`}
                  />
                  <DetailRow
                    label="Net metal weight"
                    value={`${item.netWeight.toFixed(3)} g`}
                  />
                  <DetailRow
                    label="Diamonds"
                    value={`${diamondTotals.pieces} pcs · ${diamondTotals.weight.toFixed(2)} ct`}
                  />
                  <DetailRow
                    label="Diamond quality"
                    value={item.diamondQuality}
                  />
                  <DetailRow
                    label="Color stones"
                    value={
                      colorStonePieces ? `${colorStonePieces} pcs` : "None"
                    }
                  />
                </DetailSection>
              </div>
              <RequirementDetailsPanel
                item={displayItem}
                tags={["bulk", item.stage.toLowerCase()]}
              />
            </RequirementCardBody>
          </RequirementCard>
        </main>

        <aside className="min-w-0 @[60rem]/bulk-item:sticky @[60rem]/bulk-item:top-6 @[60rem]/bulk-item:self-start">
          <section className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="space-y-6 px-5 py-4">
              <SpecSection icon={Wrench} title="Overview">
                <SpecLine
                  label="Vendor design"
                  value={item.vendorDesignNumber}
                  mono
                />
                <SpecLine label="Serial no." value={item.serialNumber} />
                <SpecLine label="Quantity" value={`${item.quantity} pcs`} />
                <SpecLine
                  label="Est. delivery"
                  value={formatBulkDate(item.estimatedDeliveryDate)}
                />
              </SpecSection>
              <SpecSection icon={PackageCheck} title="Fulfilment">
                <div className="flex items-center justify-between gap-3">
                  <FulfilmentBadge status={status} withIcon />
                  <span className="text-sm font-medium tabular-nums">
                    {item.quantity} pcs
                  </span>
                </div>
                <p className="text-xs leading-5 text-muted-foreground">
                  {FULFILMENT_HINTS[status]}
                </p>
              </SpecSection>
              <AmountBreakdown amounts={item.amounts} />
              <SpecSection icon={Truck} title="Vendor details">
                <SpecLine label="Vendor name" value={order.vendorName} />
                <SpecLine
                  label="Packing list"
                  value={order.packingListNumber}
                  mono
                />
                <SpecLine
                  label="Bulk order"
                  value={
                    <Link href={orderHref} className="hover:underline">
                      {formatBulkOrderRef(order.refCode)}
                    </Link>
                  }
                  mono
                />
              </SpecSection>
            </div>
          </section>
        </aside>
      </div>
      <BulkItemActivity refCode={order.refCode} item={item} />
      <div className="h-16" />
      {dialog}
    </div>
  );
}
