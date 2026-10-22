"use client";

import { useDndContext } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AlertTriangle, ArrowRightLeft, Clock } from "lucide-react";
import { JewelryVisual } from "@/components/jewelry/JewelryVisual";
import { OrderTypeBadge } from "@/components/orders/order-type-badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useVendorAccess } from "@/hooks/useVendors";
import {
  cn,
  computeRiskSignal,
  formatDate,
  getDaysRemaining,
  getUrgencyLevel,
  isTerminalRecord,
} from "@/lib/utils";
import type { Order } from "@/types";
import {
  CardChip,
  CardMetaSeparator,
  CategoryLabel,
  DueValue,
  formatCardDate,
  type KanbanCardButtonProps,
  KanbanRecordCard,
} from "./KanbanRecordCard";

interface KanbanCardProps {
  order: Order;
  onClick: () => void;
  onMove?: () => void;
  actionLabel?: string;
}

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

function getDaysSinceCreated(createdAt: string): number | null {
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  created.setHours(0, 0, 0, 0);
  return Math.max(
    0,
    Math.floor((today.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)),
  );
}

function formatDueTooltip(deliveryDate: string | undefined): string | null {
  const days = getDaysRemaining(deliveryDate);
  if (days === null) return null;
  if (days < 0) return `Due ${Math.abs(days)} days ago`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days} days`;
}

function getCategories(order: Order) {
  return order.type === "order"
    ? [order.category]
    : (order.itemCategories ?? []);
}

function RiskBadge({ order }: { order: Order }) {
  const signal = computeRiskSignal(order);
  if (!signal) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize shadow-xs backdrop-blur-sm",
        signal === "stale"
          ? "bg-orange-100/95 text-orange-700 dark:bg-orange-950/90 dark:text-orange-300"
          : "bg-amber-100/95 text-amber-700 dark:bg-amber-950/90 dark:text-amber-300",
      )}
    >
      {signal === "stale" ? (
        <Clock className="size-3" aria-hidden="true" />
      ) : (
        <AlertTriangle className="size-3" aria-hidden="true" />
      )}
      {signal}
    </span>
  );
}

export function KanbanCardPreview({
  order,
  ...props
}: KanbanCardButtonProps & { order: Order }) {
  const showDue = Boolean(order.deliveryDate) && !isTerminalRecord(order);
  const [category, ...otherCategories] = getCategories(order);
  const reference =
    order.type === "order"
      ? order.orderNumber || "Order"
      : order.refCode
        ? `#${order.refCode}`
        : "Enquiry";
  const hasMetal = order.type === "order" && order.metalPurity !== "Other";
  const createdDate = Number.isNaN(Date.parse(order.createdAt))
    ? "Date unavailable"
    : formatDate(order.createdAt);

  return (
    <KanbanRecordCard
      {...props}
      compact
      images={order.previewImages}
      imageAlt={[order.customerName, category].filter(Boolean).join(" ")}
      category={category}
      cornerBadge={
        computeRiskSignal(order) ? <RiskBadge order={order} /> : undefined
      }
      dimmed={order.currentStage === "Cancelled"}
      title={order.customerName}
      meta={
        <>
          <span className="shrink-0 font-mono">{reference}</span>
          {category && (
            <>
              <CardMetaSeparator />
              <CategoryLabel
                category={category}
                extra={otherCategories.length}
              />
            </>
          )}
        </>
      }
      aside={
        <span
          className="flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-[10px] font-bold text-blue-600 dark:text-blue-400"
          title={order.salespersonName}
        >
          {initials(order.salespersonName)}
        </span>
      }
      chips={
        <>
          {order.type === "order" ? (
            <OrderTypeBadge
              productType={order.productType}
              isRefill={order.isRefill}
              className="h-5 px-1.5 text-[10px]"
            />
          ) : order.itemCount ? (
            <CardChip className="tabular-nums">
              {order.itemCount} item{order.itemCount === 1 ? "" : "s"}
            </CardChip>
          ) : null}
          {hasMetal && (
            <CardChip className="max-xl:hidden">
              <JewelryVisual
                kind="metal"
                value={order.metalType}
                className="size-3"
              />
              {order.metalPurity} {order.metalType}
            </CardChip>
          )}
        </>
      }
      summary={
        showDue && order.deliveryDate ? (
          <DueValue
            date={order.deliveryDate}
            urgency={getUrgencyLevel(order.deliveryDate)}
          />
        ) : (
          <span className="font-normal text-muted-foreground">
            {formatCardDate(order.createdAt)}
          </span>
        )
      }
      stats={[
        {
          label: "Created",
          value: (
            <span title={`Created on ${createdDate}`}>
              {formatCardDate(order.createdAt)}
            </span>
          ),
        },
        {
          label: "Due",
          value:
            showDue && order.deliveryDate ? (
              <DueValue
                date={order.deliveryDate}
                urgency={getUrgencyLevel(order.deliveryDate)}
              />
            ) : (
              <span className="text-muted-foreground">—</span>
            ),
        },
      ]}
    />
  );
}

export function KanbanCard({
  order,
  onClick,
  onMove,
  actionLabel,
}: KanbanCardProps) {
  const canViewVendor = useVendorAccess();
  const { active } = useDndContext();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: order.id,
    data: {
      type: "Card",
      order,
    },
  });

  const daysSinceCreated = getDaysSinceCreated(order.createdAt);
  const dueTooltip = isTerminalRecord(order)
    ? null
    : formatDueTooltip(order.deliveryDate);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("relative", isDragging && "pointer-events-none opacity-30")}
    >
      <TooltipProvider>
        <Tooltip open={active ? false : undefined}>
          <TooltipTrigger asChild>
            <KanbanCardPreview
              order={order}
              draggableCard
              {...attributes}
              {...listeners}
              className={cn(onMove && "max-xl:pr-12")}
              onClick={onClick}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onClick();
                }
              }}
            />
          </TooltipTrigger>
          <TooltipContent
            side="right"
            className="border border-border bg-popover text-popover-foreground shadow-md [&_svg]:bg-popover [&_svg]:fill-popover"
          >
            <div className="space-y-1">
              <p className="font-medium">{order.customerName}</p>
              <p className="text-xs text-muted-foreground">
                {actionLabel ??
                  `Click to open ${order.type === "enquiry" ? "enquiry" : "order"} details`}
              </p>
              {canViewVendor && order.vendorName && (
                <p className="text-[11px] text-muted-foreground">
                  Vendor: {order.vendorName}
                </p>
              )}
              {(daysSinceCreated !== null || dueTooltip) && (
                <div className="border-t border-border/60 pt-1.5 text-[11px] text-muted-foreground">
                  {daysSinceCreated !== null && (
                    <p>
                      Going for {daysSinceCreated} day
                      {daysSinceCreated === 1 ? "" : "s"}
                    </p>
                  )}
                  {dueTooltip && <p>{dueTooltip}</p>}
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      {onMove && (
        <button
          type="button"
          onClick={onMove}
          aria-label={`Move ${order.customerName} to another stage`}
          className="absolute right-1 top-1/2 flex size-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring xl:hidden xl:pointer-coarse:left-2 xl:pointer-coarse:top-2 xl:pointer-coarse:flex xl:pointer-coarse:size-9 xl:pointer-coarse:translate-y-0 xl:pointer-coarse:rounded-full xl:pointer-coarse:border xl:pointer-coarse:bg-background/90 xl:pointer-coarse:shadow-xs"
        >
          <ArrowRightLeft className="size-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
