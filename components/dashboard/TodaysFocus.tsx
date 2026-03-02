"use client";

import { AlertTriangle, Clock, Zap } from "lucide-react";
import Link from "next/link";
import {
  cn,
  computeRiskSignal,
  getDaysInCurrentStage,
  getDaysSinceLastActivity,
  getUrgencyLevel,
} from "@/lib/utils";
import type { Order, RiskSignal } from "@/types";

// ─── Single order chip ────────────────────────────────────────────────────────

function RiskChip({ order, signal }: { order: Order; signal: RiskSignal }) {
  const isStale = signal === "stale";
  const urgency = getUrgencyLevel(order.deliveryDate);

  const daysSince = isStale
    ? getDaysSinceLastActivity(order)
    : getDaysInCurrentStage(order);

  const signalLabel = isStale
    ? `${daysSince}d silent`
    : `${daysSince}d in stage`;

  return (
    <Link
      href={`/orders/${order.shareableToken}`}
      className={cn(
        "group flex flex-shrink-0 items-center gap-2 rounded-lg border bg-card px-3 py-2 transition-all",
        "hover:-translate-y-px hover:shadow-sm",
        // left accent via border-left override
        isStale
          ? "border-l-[3px] border-l-orange-400 border-t-border border-r-border border-b-border"
          : "border-l-[3px] border-l-amber-400 border-t-border border-r-border border-b-border",
      )}
    >
      {/* Signal icon */}
      <span
        className={cn(
          "flex-shrink-0",
          isStale
            ? "text-orange-500 dark:text-orange-400"
            : "text-amber-500 dark:text-amber-400",
        )}
      >
        {isStale ? (
          <Clock className="h-3 w-3" />
        ) : (
          <AlertTriangle className="h-3 w-3" />
        )}
      </span>

      {/* Name + order number */}
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold text-foreground leading-none">
          {order.customerName}
        </p>
        <p className="mt-0.5 truncate text-[10px] text-muted-foreground leading-none">
          {order.orderNumber ?? "Enquiry"} · {order.category}
        </p>
      </div>

      {/* Divider */}
      <span className="h-6 w-px flex-shrink-0 bg-border" />

      {/* Stage + signal */}
      <div className="flex-shrink-0 text-right">
        <p className="text-[10px] font-medium text-foreground leading-none">
          {order.currentStage}
        </p>
        <p
          className={cn(
            "mt-0.5 text-[10px] leading-none",
            isStale
              ? "text-orange-600 dark:text-orange-400"
              : "text-amber-600 dark:text-amber-400",
            // escalate colour if also delivery-urgent
            urgency === "overdue" && "text-red-600 dark:text-red-400",
          )}
        >
          {signalLabel}
        </p>
      </div>
    </Link>
  );
}

// ─── Overflow chip ─────────────────────────────────────────────────────────────

function OverflowChip({
  count,
  onActivate,
}: {
  count: number;
  onActivate: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onActivate}
      className="flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-dashed border-border bg-transparent px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
    >
      +{count} more
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const MAX_VISIBLE = 4;

interface TodaysFocusProps {
  orders: Order[];
  /** Called when the user clicks "+N more" — should activate the risk filter */
  onShowAll?: () => void;
}

export function TodaysFocus({ orders, onShowAll }: TodaysFocusProps) {
  const atRiskOrders = orders
    .filter((o) => o.currentStage !== "Customer Pickup")
    .map((o) => ({ order: o, signal: computeRiskSignal(o) }))
    .filter(
      (r): r is { order: Order; signal: "stale" | "stuck" } =>
        r.signal !== null,
    )
    .sort((a, b) => {
      if (a.signal === "stale" && b.signal !== "stale") return -1;
      if (b.signal === "stale" && a.signal !== "stale") return 1;
      const urgencyOrder = {
        overdue: 0,
        "due-soon": 1,
        "on-track": 2,
        none: 3,
      };
      const ua = getUrgencyLevel(a.order.deliveryDate);
      const ub = getUrgencyLevel(b.order.deliveryDate);
      return (urgencyOrder[ua] ?? 3) - (urgencyOrder[ub] ?? 3);
    });

  if (atRiskOrders.length === 0) return null;

  const visible = atRiskOrders.slice(0, MAX_VISIBLE);
  const overflow = atRiskOrders.length - MAX_VISIBLE;

  const staleCount = atRiskOrders.filter((r) => r.signal === "stale").length;
  const stuckCount = atRiskOrders.filter((r) => r.signal === "stuck").length;

  return (
    <div className="space-y-2.5">
      {/* Section label row */}
      <div className="flex items-center gap-2">
        <Zap className="h-3 w-3 text-orange-500 dark:text-orange-400" />
        <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
          Needs attention
        </span>
        {/* Summary counts */}
        <div className="flex items-center gap-1.5 ml-0.5">
          {staleCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-medium text-orange-700 dark:bg-orange-950/50 dark:text-orange-400">
              <Clock className="h-2.5 w-2.5" />
              {staleCount} stale
            </span>
          )}
          {stuckCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
              <AlertTriangle className="h-2.5 w-2.5" />
              {stuckCount} stuck
            </span>
          )}
        </div>
      </div>

      {/* Horizontally scrollable chip strip */}
      <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
        {visible.map(({ order, signal }) => (
          <RiskChip key={order.id} order={order} signal={signal} />
        ))}
        {overflow > 0 && onShowAll && (
          <OverflowChip count={overflow} onActivate={onShowAll} />
        )}
      </div>
    </div>
  );
}
