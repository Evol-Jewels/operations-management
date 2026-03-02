"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AlertTriangle, Clock } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  cn,
  computeRiskSignal,
  formatDaysRemaining,
  getDaysInCurrentStage,
  getDaysSinceLastActivity,
  getUrgencyLevel,
} from "@/lib/utils";
import type { Order } from "@/types";
import { UrgencyDot } from "./UrgencyDot";

interface KanbanCardProps {
  order: Order;
  onClick: () => void;
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

export function KanbanCard({ order, onClick }: KanbanCardProps) {
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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const urgency = getUrgencyLevel(order.deliveryDate);
  const daysLabel = formatDaysRemaining(order.deliveryDate);
  const riskSignal = computeRiskSignal(order);
  const isStale = riskSignal === "stale";
  const isStuck = riskSignal === "stuck";

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="h-[88px] rounded-xl border-2 border-dashed border-foreground/30 bg-muted/50 opacity-50"
      />
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={onClick}
            className={cn(
              "group relative cursor-grab rounded-xl border bg-card p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing",
              "border-l-[3px]",
              urgency === "overdue" && "border-l-red-500",
              urgency === "due-soon" && "border-l-amber-400",
              urgency === "on-track" && "border-l-emerald-500",
              urgency === "none" && "border-l-muted-foreground/30",
              // Risk overlay — subtle top border on at-risk cards
              (isStale || isStuck) &&
                "border-t-orange-300 dark:border-t-orange-700/60",
            )}
          >
            {/* Urgency indicator bar */}
            <div
              className={cn(
                "absolute left-0 top-3 bottom-3 w-[3px] rounded-full",
                urgency === "overdue" && "bg-red-500",
                urgency === "due-soon" && "bg-amber-400",
                urgency === "on-track" && "bg-emerald-500",
                urgency === "none" && "bg-muted-foreground/30",
              )}
            />

            {/* Risk signal badge — top right corner */}
            {(isStale || isStuck) && (
              <div
                className={cn(
                  "absolute right-2 top-2 flex items-center gap-0.5 rounded px-1 py-0.5 text-[9px] font-semibold",
                  isStale
                    ? "bg-orange-100 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400"
                    : "bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400",
                )}
              >
                {isStale ? (
                  <Clock className="h-2.5 w-2.5" />
                ) : (
                  <AlertTriangle className="h-2.5 w-2.5" />
                )}
                {isStale ? "stale" : "stuck"}
              </div>
            )}

            {/* Content */}
            <div className="pl-2">
              {/* Customer name — shift right of risk badge */}
              <p
                className={cn(
                  "truncate text-sm font-semibold text-foreground",
                  (isStale || isStuck) && "pr-10",
                )}
              >
                {order.customerName}
              </p>

              {/* Type + ID row */}
              <div className="mt-1 flex items-center gap-1.5">
                {order.type === "enquiry" ? (
                  <span className="inline-flex items-center rounded border border-border bg-muted px-1.5 py-px text-[10px] text-muted-foreground">
                    Enquiry
                  </span>
                ) : (
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {order.orderNumber || "Order"}
                  </span>
                )}
                <span className="text-[10px] text-muted-foreground/50">·</span>
                <span className="truncate text-[11px] text-muted-foreground">
                  {order.category}
                </span>
              </div>

              {/* Bottom row: Urgency + Salesperson */}
              <div className="mt-2 flex items-center justify-between">
                {/* Urgency */}
                <div className="flex items-center gap-1">
                  <UrgencyDot level={urgency} />
                  <span
                    className={cn(
                      "text-[10px]",
                      urgency === "overdue" &&
                        "font-medium text-red-600 dark:text-red-400",
                      urgency === "due-soon" &&
                        "font-medium text-amber-600 dark:text-amber-400",
                      urgency === "on-track" && "text-muted-foreground",
                      urgency === "none" && "text-muted-foreground/50",
                    )}
                  >
                    {daysLabel}
                  </span>
                </div>

                {/* Salesperson avatar */}
                <div
                  className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[9px] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                  title={order.salespersonName}
                >
                  {initials(order.salespersonName)}
                </div>
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">
          <div className="space-y-1">
            <p className="font-medium">{order.customerName}</p>
            <p className="text-xs text-muted-foreground">
              Click to open order details
            </p>
            {order.vendorName && (
              <p className="text-[11px] text-muted-foreground">
                Vendor: {order.vendorName}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
