"use client";

import { AlertTriangle, ArrowRight, Clock, Zap } from "lucide-react";
import Link from "next/link";
import {
  cn,
  computeRiskSignal,
  formatRelativeTime,
  getDaysInCurrentStage,
  getDaysSinceLastActivity,
  getUrgencyLevel,
} from "@/lib/utils";
import type { Order, RiskSignal } from "@/types";

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
        "group flex min-w-[240px] flex-shrink-0 items-center gap-2 rounded-xl border bg-background/70 px-3 py-2.5 transition-all",
        "hover:-translate-y-px hover:shadow-sm",
        isStale
          ? "border-l-[3px] border-l-orange-400 border-t-border border-r-border border-b-border"
          : "border-l-[3px] border-l-amber-400 border-t-border border-r-border border-b-border",
      )}
    >
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

      <div className="min-w-0">
        <p className="truncate text-xs font-semibold leading-none text-foreground">
          {order.customerName}
        </p>
        <p className="mt-0.5 truncate text-[10px] leading-none text-muted-foreground">
          {order.orderNumber ?? "Enquiry"} · {order.category}
        </p>
      </div>

      <span className="h-6 w-px flex-shrink-0 bg-border" />

      <div className="flex-shrink-0 text-right">
        <p className="text-[10px] font-medium leading-none text-foreground">
          {order.currentStage}
        </p>
        <p
          className={cn(
            "mt-0.5 text-[10px] leading-none",
            isStale
              ? "text-orange-600 dark:text-orange-400"
              : "text-amber-600 dark:text-amber-400",
            urgency === "overdue" && "text-red-600 dark:text-red-400",
          )}
        >
          {signalLabel}
        </p>
      </div>
    </Link>
  );
}

function AttentionRow({
  order,
  signal,
}: {
  order: Order;
  signal: Exclude<RiskSignal, null>;
}) {
  const urgency = getUrgencyLevel(order.deliveryDate);
  const isStale = signal === "stale";
  const timingLabel = isStale
    ? `${getDaysSinceLastActivity(order)}d silent`
    : `${getDaysInCurrentStage(order)}d in stage`;

  return (
    <Link
      href={`/orders/${order.shareableToken}`}
      className="group flex items-start justify-between gap-3 rounded-xl border border-border/70 bg-background/70 px-4 py-3 transition-colors hover:border-foreground/15 hover:bg-muted/30"
    >
      <div className="min-w-0 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
              isStale
                ? "bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300"
                : "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
            )}
          >
            {isStale ? (
              <Clock className="h-3 w-3" />
            ) : (
              <AlertTriangle className="h-3 w-3" />
            )}
            {isStale ? "Stale" : "Stuck"}
          </span>
          <span className="text-[11px] font-medium text-muted-foreground">
            {order.currentStage}
          </span>
        </div>
        <div>
          <p className="truncate text-sm font-semibold text-foreground">
            {order.customerName}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {order.orderNumber ?? "Enquiry"} · {order.category} · {timingLabel}
          </p>
        </div>
      </div>

      <div className="flex flex-shrink-0 items-center gap-3">
        <div className="text-right">
          <p
            className={cn(
              "text-xs font-medium",
              urgency === "overdue" && "text-red-600 dark:text-red-400",
              urgency === "due-soon" && "text-amber-600 dark:text-amber-400",
              urgency === "on-track" &&
                "text-emerald-600 dark:text-emerald-400",
              urgency === "none" && "text-muted-foreground",
            )}
          >
            {order.deliveryDate ? order.deliveryDate : "No date"}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {formatRelativeTime(order.lastUpdatedAt)}
          </p>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground/40 transition-colors group-hover:text-foreground" />
      </div>
    </Link>
  );
}

interface TodaysFocusProps {
  orders: Order[];
}

export function TodaysFocus({ orders }: TodaysFocusProps) {
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

  const staleCount = atRiskOrders.filter((r) => r.signal === "stale").length;
  const stuckCount = atRiskOrders.filter((r) => r.signal === "stuck").length;

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-orange-500 dark:text-orange-400" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/80">
              Action Items
            </span>
          </div>
          <div>
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              Attention needed across current work
            </h2>
            <p className="text-sm text-muted-foreground">
              All stale and stuck records stay visible here until they are
              updated.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
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

      <div className="mt-4 hidden gap-2 overflow-x-auto pb-1 xl:flex scrollbar-none">
        {atRiskOrders.map(({ order, signal }) => (
          <RiskChip key={order.id} order={order} signal={signal} />
        ))}
      </div>

      <div className="mt-4 space-y-3 xl:hidden">
        {atRiskOrders.map(({ order, signal }) => (
          <AttentionRow key={order.id} order={order} signal={signal} />
        ))}
      </div>
    </section>
  );
}
