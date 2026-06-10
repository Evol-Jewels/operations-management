"use client";

import { AlertTriangle, ArrowUpRight, Clock, Inbox } from "lucide-react";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  cn,
  computeRiskSignal,
  formatDate,
  formatDaysRemaining,
  formatRelativeTime,
  getDaysInCurrentStage,
  getDaysRemaining,
  getDaysSinceLastActivity,
  getUrgencyLevel,
} from "@/lib/utils";
import type { Order } from "@/types";
import { UrgencyDot } from "./UrgencyDot";

interface OrderListProps {
  orders: Order[];
}

const STAGE_COLORS: Record<string, string> = {
  Enquiry: "border-muted-foreground/20 text-muted-foreground",
  Estimation: "border-blue-500/20 text-blue-600 dark:text-blue-400",
  "CAD Design": "border-violet-500/20 text-violet-600 dark:text-violet-400",
  "Order Confirmed": "border-blue-500/20 text-blue-600 dark:text-blue-400",
  Manufacturing: "border-amber-500/20 text-amber-600 dark:text-amber-400",
  Certification: "border-orange-500/20 text-orange-600 dark:text-orange-400",
  "At Store": "border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
  "In Transit": "border-sky-500/20 text-sky-600 dark:text-sky-400",
  Delivered:
    "border-emerald-500/20 text-emerald-600 bg-emerald-500/5 dark:text-emerald-400",
  Closed: "border-muted-foreground/20 text-muted-foreground bg-muted/40",
};

function UrgencyTooltip({
  children,
  urgency: _urgency,
  deliveryDate,
}: {
  children: React.ReactNode;
  urgency: ReturnType<typeof getUrgencyLevel>;
  deliveryDate: string | undefined;
}) {
  if (!deliveryDate) return <>{children}</>;

  const days = getDaysRemaining(deliveryDate);
  let message = "";
  if (days === null) message = "No delivery date set";
  else if (days < 0)
    message = `${Math.abs(days)} days overdue · was due ${formatDate(deliveryDate)}`;
  else if (days === 0) message = "Due today";
  else if (days === 1) message = "Due tomorrow";
  else message = `${days} days remaining · due ${formatDate(deliveryDate)}`;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="left">
        <p className="text-xs">{message}</p>
      </TooltipContent>
    </Tooltip>
  );
}

function RowTooltip({
  children,
  type,
}: {
  children: React.ReactNode;
  type: Order["type"];
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right">
        <p className="text-xs">
          {type === "enquiry" ? "View enquiry →" : "View order details →"}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

function getRecordHref(order: Order) {
  return order.type === "enquiry"
    ? `/enquiries/${order.refCode}`
    : `/orders/${order.refCode}`;
}

function RiskBadge({ order }: { order: Order }) {
  const signal = computeRiskSignal(order);
  if (!signal) return null;

  const isStale = signal === "stale";
  const daysSince = getDaysSinceLastActivity(order);
  const daysInStage = getDaysInCurrentStage(order);

  const tooltipText = isStale
    ? `No activity for ${daysSince} days — follow up needed`
    : `In ${order.currentStage} for ${daysInStage} days — longer than expected`;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "ml-1.5 inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] font-medium",
            isStale
              ? "bg-orange-500/10 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400"
              : "bg-amber-500/10 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
          )}
        >
          {isStale ? (
            <Clock className="h-2.5 w-2.5" />
          ) : (
            <AlertTriangle className="h-2.5 w-2.5" />
          )}
          {isStale ? "stale" : "stuck"}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[200px]">
        <p className="text-xs">{tooltipText}</p>
      </TooltipContent>
    </Tooltip>
  );
}

// ─── Mobile card row ────────────────────────────────────────────────────────

function MobileOrderCard({ order }: { order: Order }) {
  const urgency = getUrgencyLevel(order.deliveryDate);
  const daysLabel = formatDaysRemaining(order.deliveryDate);
  const deliveryFormatted = order.deliveryDate
    ? formatDate(order.deliveryDate)
    : "—";
  const lastUpdateLabel = order.lastUpdatedAt
    ? formatRelativeTime(order.lastUpdatedAt)
    : "—";
  const daysSinceLast = getDaysSinceLastActivity(order);
  const isStaleRow = daysSinceLast !== null && daysSinceLast >= 7;
  const stageColorClass =
    STAGE_COLORS[order.currentStage] ?? "border-border text-muted-foreground";

  return (
    <li>
      <Link
        href={getRecordHref(order)}
        className="group flex flex-col gap-3 px-4 py-3.5 transition-colors hover:bg-muted/30 active:bg-muted/50"
      >
        {/* Top row: urgency dot + customer name + arrow */}
        <div className="flex items-start gap-2.5">
          <UrgencyTooltip urgency={urgency} deliveryDate={order.deliveryDate}>
            <div className="mt-0.5 flex-shrink-0">
              <UrgencyDot level={urgency} />
            </div>
          </UrgencyTooltip>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground leading-snug">
              {order.customerName}
            </p>
            <div className="mt-0.5 flex items-center gap-1.5 text-[11px]">
              {order.type === "enquiry" ? (
                <span className="inline-flex items-center rounded border border-border bg-muted px-1 py-px text-[10px] text-muted-foreground">
                  Enquiry
                </span>
              ) : (
                <span className="font-mono text-muted-foreground">
                  {order.orderNumber || "Order"}
                </span>
              )}
              <span className="text-muted-foreground/40">·</span>
              <span className="truncate text-muted-foreground">
                {order.category}
              </span>
            </div>
          </div>

          <ArrowUpRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground/25 transition-colors group-hover:text-muted-foreground" />
        </div>

        {/* Middle row: stage badge + risk badge */}
        <div className="flex flex-wrap items-center gap-1.5 pl-[18px]">
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
              stageColorClass,
            )}
          >
            {order.currentStage}
          </span>
          <RiskBadge order={order} />
        </div>

        {/* Bottom row: salesperson · last update · delivery */}
        <div className="grid grid-cols-3 gap-2 pl-[18px] text-[11px]">
          {/* Salesperson */}
          <div className="min-w-0">
            <p className="text-muted-foreground/60 mb-0.5">Sales</p>
            <p className="truncate font-medium text-foreground">
              {order.salespersonName}
            </p>
          </div>

          {/* Last update */}
          <div className="min-w-0">
            <p className="text-muted-foreground/60 mb-0.5">Updated</p>
            <p
              className={cn(
                "tabular-nums font-medium",
                isStaleRow
                  ? "text-orange-600 dark:text-orange-400"
                  : "text-foreground",
              )}
            >
              {lastUpdateLabel}
            </p>
          </div>

          {/* Delivery */}
          <div className="min-w-0">
            <p className="text-muted-foreground/60 mb-0.5">Delivery</p>
            <p className="font-medium text-foreground tabular-nums">
              {deliveryFormatted}
            </p>
            {daysLabel && (
              <p
                className={cn(
                  "tabular-nums mt-px",
                  urgency === "overdue" &&
                    "font-semibold text-red-600 dark:text-red-400",
                  urgency === "due-soon" &&
                    "font-semibold text-amber-600 dark:text-amber-400",
                  urgency === "on-track" && "text-muted-foreground",
                  urgency === "none" && "text-muted-foreground/50",
                )}
              >
                {daysLabel}
              </p>
            )}
          </div>
        </div>
      </Link>
    </li>
  );
}

// ─── Desktop table row ──────────────────────────────────────────────────────

function DesktopOrderRow({ order }: { order: Order }) {
  const urgency = getUrgencyLevel(order.deliveryDate);
  const daysLabel = formatDaysRemaining(order.deliveryDate);
  const deliveryFormatted = order.deliveryDate
    ? formatDate(order.deliveryDate)
    : "—";
  const lastUpdateLabel = order.lastUpdatedAt
    ? formatRelativeTime(order.lastUpdatedAt)
    : "—";
  const daysSinceLast = getDaysSinceLastActivity(order);
  const isStaleRow = daysSinceLast !== null && daysSinceLast >= 7;
  const stageColorClass =
    STAGE_COLORS[order.currentStage] ?? "border-border text-muted-foreground";

  return (
    <li>
      <Link
        href={getRecordHref(order)}
        className="group grid grid-cols-[16px_1fr_140px_100px_100px_90px_90px_28px] items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/30"
      >
        {/* Urgency dot with tooltip */}
        <UrgencyTooltip urgency={urgency} deliveryDate={order.deliveryDate}>
          <div className="flex items-center justify-center">
            <UrgencyDot level={urgency} />
          </div>
        </UrgencyTooltip>

        {/* Customer + meta with type pill */}
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            {order.customerName}
          </p>
          <div className="flex items-center gap-1.5 truncate text-[11px]">
            {order.type === "enquiry" ? (
              <span className="inline-flex items-center rounded border border-border bg-muted px-1 py-px text-[10px] text-muted-foreground">
                Enquiry
              </span>
            ) : (
              <span className="font-mono text-muted-foreground">
                {order.orderNumber || "Order"}
              </span>
            )}
            <span className="text-muted-foreground/50">·</span>
            <span className="text-muted-foreground">{order.category}</span>
          </div>
        </div>

        {/* Stage + risk signal */}
        <div className="flex flex-wrap items-center gap-y-1">
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
              stageColorClass,
            )}
          >
            {order.currentStage}
          </span>
          <RiskBadge order={order} />
        </div>

        {/* Salesperson */}
        <div className="hidden md:block">
          <p className="truncate text-sm text-foreground">
            {order.salespersonName}
          </p>
        </div>

        {/* Vendor */}
        <div className="hidden lg:block">
          <p className="truncate text-sm text-muted-foreground">
            {order.vendorName ?? "—"}
          </p>
        </div>

        {/* Last update */}
        <div>
          <p
            className={cn(
              "text-sm tabular-nums",
              isStaleRow
                ? "font-medium text-orange-600 dark:text-orange-400"
                : "text-muted-foreground",
            )}
          >
            {lastUpdateLabel}
          </p>
        </div>

        {/* Delivery */}
        <div>
          <p className="text-sm text-foreground tabular-nums">
            {deliveryFormatted}
          </p>
          <p
            className={cn(
              "text-[11px] tabular-nums",
              urgency === "overdue" &&
                "font-medium text-red-600 dark:text-red-400",
              urgency === "due-soon" &&
                "font-medium text-amber-600 dark:text-amber-400",
              urgency === "on-track" && "text-muted-foreground",
              urgency === "none" && "text-muted-foreground/50",
            )}
          >
            {daysLabel}
          </p>
        </div>

        {/* Link arrow with tooltip */}
        <RowTooltip type={order.type}>
          <div className="flex justify-end">
            <ArrowUpRight className="h-4 w-4 text-muted-foreground/25 transition-colors group-hover:text-muted-foreground" />
          </div>
        </RowTooltip>
      </Link>
    </li>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

export function OrderList({ orders }: OrderListProps) {
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
        <Inbox className="mb-3 h-8 w-8 text-muted-foreground/30" />
        <p className="text-sm font-medium text-muted-foreground">
          No orders found
        </p>
        <p className="mt-1 text-xs text-muted-foreground/60">
          Try adjusting your search or filters
        </p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {/* ── Desktop: column header row (hidden on mobile) ── */}
        <div className="hidden md:grid grid-cols-[16px_1fr_140px_100px_100px_90px_90px_28px] items-center gap-3 border-b border-border bg-muted/30 px-4 py-2">
          <span />
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">
            Customer
          </span>
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">
            Stage
          </span>
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70 md:block">
            Salesperson
          </span>
          <span className="hidden text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70 lg:block">
            Vendor
          </span>
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">
            Last update
          </span>
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">
            Delivery
          </span>
          <span />
        </div>

        {/* ── Mobile: card list (hidden on md+) ── */}
        <ul className="divide-y divide-border/60 md:hidden">
          {orders.map((order) => (
            <MobileOrderCard key={order.id} order={order} />
          ))}
        </ul>

        {/* ── Desktop: table rows (hidden below md) ── */}
        <ul className="hidden divide-y divide-border/60 md:block">
          {orders.map((order) => (
            <DesktopOrderRow key={order.id} order={order} />
          ))}
        </ul>
      </div>
    </TooltipProvider>
  );
}
