"use client";

import { CalendarDays, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";
import { UrgencyDot } from "@/components/dashboard/UrgencyDot";
import { WorkspaceCard } from "@/components/dashboard/WorkspaceCard";
import {
  type BulkOrderItem,
  formatBulkDate,
  getBulkItemHref,
  getBulkItemStatus,
  isBulkItemPending,
} from "@/lib/bulkOrders";
import { cn, formatCurrency, getUrgencyLevel } from "@/lib/utils";
import { BulkItemThumbnail } from "./BulkItemThumbnail";
import { FulfilmentBadge, StageBadge } from "./BulkOrderBadges";

export function getBulkItemUrgency(item: BulkOrderItem) {
  return isBulkItemPending(item)
    ? getUrgencyLevel(item.estimatedDeliveryDate)
    : "none";
}

export function BulkOrderItemCard({
  refCode,
  item,
  showStage = false,
  ...props
}: ComponentProps<typeof WorkspaceCard> & {
  refCode: number;
  item: BulkOrderItem;
  showStage?: boolean;
}) {
  const router = useRouter();
  const urgency = getBulkItemUrgency(item);
  const status = getBulkItemStatus(item);
  const comments = item.activity.filter(
    (entry) => entry.type === "comment",
  ).length;

  return (
    <WorkspaceCard
      urgency={urgency}
      onClick={() => router.push(getBulkItemHref(refCode, item.serialNumber))}
      {...props}
    >
      <div
        className={cn("space-y-2 pl-2", status === "Cancelled" && "opacity-70")}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <BulkItemThumbnail item={item} className="size-16 rounded-lg" />
            <div className="min-w-0">
              <p className="truncate font-mono text-sm font-semibold text-foreground">
                {item.vendorDesignNumber}
              </p>
              <p className="mt-1 truncate text-[11px] text-muted-foreground">
                #{item.serialNumber} · {item.category}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                {item.productSize}
              </p>
            </div>
          </div>
          {showStage && <StageBadge stage={item.stage} />}
        </div>
        {item.stageRemark && (
          <p className="line-clamp-2 rounded-md bg-muted/60 px-2 py-1.5 text-[11px] leading-4 text-muted-foreground">
            {item.stageRemark}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-medium tabular-nums text-foreground">
            {item.quantity} pcs
          </span>
          <FulfilmentBadge status={status} className="text-[10px]" />
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-2 text-[10px] text-muted-foreground">
          <span
            className={cn(
              "inline-flex items-center gap-1",
              urgency === "overdue" && "text-red-600 dark:text-red-400",
            )}
          >
            {urgency === "none" ? (
              <CalendarDays className="size-3" aria-hidden="true" />
            ) : (
              <UrgencyDot level={urgency} />
            )}
            {formatBulkDate(item.estimatedDeliveryDate)}
          </span>
          <span className="flex items-center gap-2">
            {comments > 0 && (
              <span
                className="inline-flex items-center gap-1"
                title={`${comments} comment${comments === 1 ? "" : "s"}`}
              >
                <MessageSquare className="size-3" aria-hidden="true" />
                {comments}
              </span>
            )}
            <span
              className={cn(
                "font-medium tabular-nums text-foreground",
                status === "Cancelled" && "line-through",
              )}
            >
              {formatCurrency(item.amounts.quoted)}
            </span>
          </span>
        </div>
      </div>
    </WorkspaceCard>
  );
}
