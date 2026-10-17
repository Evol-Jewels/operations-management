"use client";

import { useRouter } from "next/navigation";
import {
  CardChip,
  CardMetaSeparator,
  CategoryLabel,
  DueValue,
  type KanbanCardButtonProps,
  KanbanRecordCard,
} from "@/components/dashboard/KanbanRecordCard";
import { JewelryVisual } from "@/components/jewelry/JewelryVisual";
import {
  type BulkOrderItem,
  getBulkItemHref,
  getBulkItemStatus,
  isBulkItemPending,
} from "@/lib/bulkOrders";
import { cn, formatCurrency, getUrgencyLevel } from "@/lib/utils";
import { FulfilmentBadge } from "./BulkOrderBadges";

export function getBulkItemUrgency(item: BulkOrderItem) {
  return isBulkItemPending(item)
    ? getUrgencyLevel(item.estimatedDeliveryDate)
    : "none";
}

export function BulkOrderItemCard({
  refCode,
  item,
  ...props
}: KanbanCardButtonProps & {
  refCode: number;
  item: BulkOrderItem;
}) {
  const router = useRouter();
  const status = getBulkItemStatus(item);
  const metal = [item.metalPurity, item.metalColor || item.metalType]
    .filter(Boolean)
    .join(" ");

  return (
    <KanbanRecordCard
      onClick={() => router.push(getBulkItemHref(refCode, item.serialNumber))}
      {...props}
      images={item.imageUrls}
      imageAlt={`${item.vendorDesignNumber} ${item.category}`}
      category={item.category}
      dimmed={status === "Cancelled"}
      title={<span className="font-mono">{item.vendorDesignNumber}</span>}
      meta={
        <>
          <span className="shrink-0 font-mono">#{item.serialNumber}</span>
          <CardMetaSeparator />
          <CategoryLabel category={item.category} />
          {item.productSize && (
            <>
              <CardMetaSeparator />
              <span className="shrink-0">{item.productSize}</span>
            </>
          )}
        </>
      }
      aside={
        <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-foreground">
          {item.quantity} pcs
        </span>
      }
      chips={
        <>
          <FulfilmentBadge status={status} className="h-5 px-1.5 text-[10px]" />
          {metal && (
            <CardChip>
              <JewelryVisual
                kind="metal-color"
                value={item.metalColor || item.metalType}
                className="size-3"
              />
              <span className="truncate">{metal}</span>
            </CardChip>
          )}
        </>
      }
      stats={[
        {
          label: "Due",
          value: (
            <DueValue
              date={item.estimatedDeliveryDate}
              urgency={getBulkItemUrgency(item)}
            />
          ),
        },
        {
          label: "Quoted",
          value: (
            <span className={cn(status === "Cancelled" && "line-through")}>
              {formatCurrency(item.amounts.quoted)}
            </span>
          ),
        },
      ]}
    />
  );
}
