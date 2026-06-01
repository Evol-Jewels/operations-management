"use client";

import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Clock,
  Inbox,
  IndianRupee,
  MessageSquare,
  Package,
  Plus,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/lib/people";
import {
  cn,
  computeRiskSignal,
  formatCurrency,
  formatDaysRemaining,
  formatRelativeTime,
  getDaysInCurrentStage,
  getDaysSinceLastActivity,
  getUrgencyLevel,
} from "@/lib/utils";
import { type Order, STAGES, type UrgencyLevel } from "@/types";
import { RecentActivities } from "./RecentActivities";

type RiskItem = { order: Order; signal: "stale" | "stuck" };
type SalesTab = "orders" | "enquiries";

interface MetricCardData {
  label: string;
  value: string;
  change?: number;
  helper?: string;
  icon?: React.ReactNode;
  accent?: string;
}

interface ChartDatum {
  label: string;
  value: number;
  color: string;
}

const BAR_COLORS = [
  "bg-blue-600",
  "bg-amber-500",
  "bg-emerald-600",
  "bg-violet-600",
  "bg-orange-500",
  "bg-cyan-600",
  "bg-slate-600",
  "bg-rose-500",
];

const CHART_COLORS = [
  "oklch(0.56 0.17 254)",
  "oklch(0.69 0.16 75)",
  "oklch(0.58 0.14 155)",
  "oklch(0.59 0.18 295)",
  "oklch(0.64 0.2 35)",
  "oklch(0.55 0.12 210)",
  "oklch(0.52 0.08 250)",
  "oklch(0.62 0.15 18)",
];

function getRecordHref(order: Order) {
  return order.type === "enquiry"
    ? `/enquiries/${order.shareableToken}`
    : `/orders/${order.shareableToken}`;
}

function sortRiskItems(items: RiskItem[]) {
  const urgencyOrder: Record<UrgencyLevel, number> = {
    overdue: 0,
    "due-soon": 1,
    "on-track": 2,
    none: 3,
  };

  return [...items].sort((a, b) => {
    if (a.signal === "stale" && b.signal !== "stale") return -1;
    if (b.signal === "stale" && a.signal !== "stale") return 1;
    return (
      urgencyOrder[getUrgencyLevel(a.order.deliveryDate)] -
      urgencyOrder[getUrgencyLevel(b.order.deliveryDate)]
    );
  });
}

function getRiskItems(orders: Order[]) {
  return sortRiskItems(
    orders
      .filter((order) => order.currentStage !== "Customer Pickup")
      .map((order) => ({ order, signal: computeRiskSignal(order) }))
      .filter(
        (item): item is RiskItem =>
          item.signal === "stale" || item.signal === "stuck",
      ),
  );
}

function getCategoryCounts(orders: Order[]) {
  return Object.entries(
    orders.reduce<Record<string, number>>((acc, order) => {
      acc[order.category] = (acc[order.category] ?? 0) + 1;
      return acc;
    }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .map(([label, value], index) => ({
      label,
      value,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }));
}

function MetricCard({ card }: { card: MetricCardData }) {
  const isPositive = (card.change ?? 0) >= 0;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">
            {card.label}
          </p>
          <p className="mt-3 truncate text-3xl font-semibold tracking-tight text-foreground">
            {card.value}
          </p>
        </div>
        {card.icon && (
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
              card.accent,
            )}
          >
            {card.icon}
          </div>
        )}
      </div>
      {card.change !== undefined && (
        <div className="mt-7 flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold",
              isPositive
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                : "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400",
            )}
          >
            {isPositive ? (
              <ArrowUp className="h-3 w-3" />
            ) : (
              <ArrowDown className="h-3 w-3" />
            )}
            {Math.abs(card.change)}%
          </span>
          {card.helper && (
            <span className="text-xs text-muted-foreground">{card.helper}</span>
          )}
        </div>
      )}
    </div>
  );
}

function Panel({
  eyebrow,
  title,
  children,
  className,
  action,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-border bg-card p-6 shadow-sm",
        className,
      )}
    >
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            {eyebrow}
          </span>
          <h2 className="mt-3 text-lg font-semibold tracking-tight text-foreground">
            {title}
          </h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function HorizontalBar({
  item,
  max,
  index,
}: {
  item: ChartDatum;
  max: number;
  index: number;
}) {
  const pct = max > 0 ? (item.value / max) * 100 : 0;

  return (
    <div className="grid grid-cols-[minmax(92px,150px)_1fr_34px] items-center gap-3">
      <span className="truncate text-sm text-muted-foreground">
        {item.label}
      </span>
      <div className="h-8 overflow-hidden rounded-lg bg-muted/60">
        <div
          className={cn(
            "h-full rounded-lg transition-all duration-500",
            BAR_COLORS[index % BAR_COLORS.length],
          )}
          style={{ width: `${Math.max(pct, item.value > 0 ? 3 : 0)}%` }}
        />
      </div>
      <span className="text-right text-sm tabular-nums text-foreground">
        {item.value}
      </span>
    </div>
  );
}

function DonutChart({
  data,
  size = 150,
}: {
  data: ChartDatum[];
  size?: number;
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let offset = 25;
  const segments =
    total > 0
      ? data
          .filter((item) => item.value > 0)
          .map((item) => {
            const length = (item.value / total) * 100;
            const segment = (
              <circle
                key={item.label}
                cx="21"
                cy="21"
                r="15.915"
                fill="transparent"
                stroke={item.color}
                strokeDasharray={`${length} ${100 - length}`}
                strokeDashoffset={offset}
                strokeWidth="8"
              />
            );
            offset -= length;
            return segment;
          })
      : [];

  return (
    <div className="flex flex-wrap items-center justify-center gap-8">
      <svg
        viewBox="0 0 42 42"
        width={size}
        height={size}
        className="-rotate-90"
        aria-label="Donut chart"
        role="img"
      >
        <circle
          cx="21"
          cy="21"
          r="15.915"
          fill="transparent"
          stroke="currentColor"
          className="text-muted"
          strokeWidth="8"
        />
        {segments}
      </svg>
      <div className="grid min-w-36 gap-2">
        {data.map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-sm">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="flex-1 text-muted-foreground">{item.label}</span>
            <span className="font-medium tabular-nums text-foreground">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SignalBadge({ signal }: { signal: "stale" | "stuck" }) {
  const isStale = signal === "stale";

  return (
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
  );
}

function ActionItemRow({
  order,
  signal,
  showUrgency,
}: {
  order: Order;
  signal: "stale" | "stuck";
  showUrgency?: boolean;
}) {
  const urgency = getUrgencyLevel(order.deliveryDate);
  const timingLabel =
    signal === "stale"
      ? `${getDaysSinceLastActivity(order) ?? 0}d silent`
      : `${getDaysInCurrentStage(order)}d in stage`;

  return (
    <Link
      href={getRecordHref(order)}
      className="group flex items-start justify-between gap-3 rounded-xl border border-border/70 bg-background/70 px-5 py-4 transition-colors hover:border-foreground/15 hover:bg-muted/30"
    >
      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <SignalBadge signal={signal} />
          <Badge variant="outline" className="capitalize text-[10px]">
            {order.type === "order" ? "Order" : "Enquiry"}
          </Badge>
          <span className="text-xs font-medium text-muted-foreground">
            {order.currentStage}
          </span>
        </div>
        <div>
          <p className="truncate text-base font-semibold text-foreground">
            {order.customerName}
          </p>
          <p className="truncate text-sm text-muted-foreground">
            {order.orderNumber ?? "Enquiry"} - {order.category} - {timingLabel}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3 text-right">
        <div>
          {showUrgency && (
            <p
              className={cn(
                "text-sm font-medium",
                urgency === "overdue" && "text-red-600 dark:text-red-400",
                urgency === "due-soon" && "text-amber-600 dark:text-amber-400",
                urgency === "on-track" &&
                  "text-emerald-600 dark:text-emerald-400",
                urgency === "none" && "text-muted-foreground",
              )}
            >
              {formatDaysRemaining(order.deliveryDate)}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            {formatRelativeTime(order.lastUpdatedAt)}
          </p>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground/40 transition-colors group-hover:text-foreground" />
      </div>
    </Link>
  );
}

function RecordRow({ order }: { order: Order }) {
  const urgency = getUrgencyLevel(order.deliveryDate);

  return (
    <Link
      href={getRecordHref(order)}
      className="group flex items-start justify-between gap-3 rounded-xl border border-border/70 bg-background/70 px-5 py-4 transition-colors hover:border-foreground/15 hover:bg-muted/30"
    >
      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="capitalize text-[10px]">
            {order.type === "order" ? "Order" : "Enquiry"}
          </Badge>
          <span className="text-xs font-medium text-muted-foreground">
            {order.currentStage}
          </span>
        </div>
        <div>
          <p className="truncate text-base font-semibold text-foreground">
            {order.customerName}
          </p>
          <p className="truncate text-sm text-muted-foreground">
            {order.orderNumber ?? "Enquiry"} - {order.category} -{" "}
            {formatRelativeTime(order.lastUpdatedAt)}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3 text-right">
        <div>
          <p
            className={cn(
              "text-sm font-medium",
              urgency === "overdue" && "text-red-600 dark:text-red-400",
              urgency === "due-soon" && "text-amber-600 dark:text-amber-400",
              urgency === "on-track" &&
                "text-emerald-600 dark:text-emerald-400",
              urgency === "none" && "text-muted-foreground",
            )}
          >
            {formatDaysRemaining(order.deliveryDate)}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatRelativeTime(order.lastUpdatedAt)}
          </p>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground/40 transition-colors group-hover:text-foreground" />
      </div>
    </Link>
  );
}

function EnquiryCard({ order }: { order: Order }) {
  const person = order.createdBy ?? { id: "", name: "Unknown", image: null };

  return (
    <Link
      href={getRecordHref(order)}
      className="group flex items-center justify-between gap-4 rounded-xl border border-border/70 bg-background/70 px-6 py-4 transition-colors hover:border-foreground/15 hover:bg-muted/30"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="text-sm text-muted-foreground">#{order.refCode}</span>
        <span className="text-foreground">{order.customerName}</span>

        {order.status && (
          <Badge
            variant={order.status === "open" ? "default" : "secondary"}
            className="text-[10px] capitalize"
          >
            {order.status}
          </Badge>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2 text-right">
        <span className="whitespace-nowrap text-sm mx-2 text-muted-foreground">
          {formatRelativeTime(order.createdAt)}
        </span>
        <Avatar size="sm">
          {person.image && <AvatarImage src={person.image} alt={person.name} />}
          <AvatarFallback className="text-[10px]">
            {getInitials(person)}
          </AvatarFallback>
        </Avatar>
        <span className="max-w-[10rem] truncate text-sm font-medium text-foreground">
          {person.name}
        </span>
      </div>
    </Link>
  );
}

function EmptyRows({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border py-12 text-center">
      <Inbox className="mx-auto mb-2 h-7 w-7 text-muted-foreground/30" />
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground/70">{description}</p>
    </div>
  );
}

function getAdminAnalytics(orders: Order[]) {
  const allOrders = orders.filter((order) => order.type === "order");
  const allEnquiries = orders.filter((order) => order.type === "enquiry");
  const openEnquiries = allEnquiries.filter(
    (order) => order.status !== "closed",
  );
  const closedEnquiries = allEnquiries.filter(
    (order) => order.status === "closed",
  );
  const revenue = allOrders.reduce(
    (sum, order) => sum + (order.totalEstimate ?? 0),
    0,
  );
  const averageOrderValue =
    allOrders.length > 0 ? Math.round(revenue / allOrders.length) : 0;
  const stageCounts = STAGES.map((stage) => ({
    label: stage,
    value: allOrders.filter((order) => order.currentStage === stage).length,
    color: "",
  }));

  return {
    allOrders,
    openEnquiries,
    closedEnquiries,
    revenue,
    averageOrderValue,
    stageCounts,
    categoryCounts: getCategoryCounts(orders),
    riskItems: getRiskItems(orders),
  };
}

function getOpsAnalytics(orders: Order[]) {
  const activeOrders = orders.filter(
    (order) =>
      order.type === "order" && order.currentStage !== "Customer Pickup",
  );
  const openEnquiries = orders.filter(
    (order) => order.type === "enquiry" && order.status !== "closed",
  );
  const activeRecords = [...activeOrders, ...openEnquiries];
  const urgency: Record<UrgencyLevel, number> = {
    overdue: 0,
    "due-soon": 0,
    "on-track": 0,
    none: 0,
  };

  for (const order of activeOrders) {
    urgency[getUrgencyLevel(order.deliveryDate)] += 1;
  }

  return {
    activeOrders,
    openEnquiries,
    revenue: activeOrders.reduce(
      (sum, order) => sum + (order.totalEstimate ?? 0),
      0,
    ),
    stageCounts: STAGES.map((stage) => ({
      label: stage,
      value: activeRecords.filter((order) => order.currentStage === stage)
        .length,
      color: "",
    })),
    categoryCounts: getCategoryCounts(activeRecords),
    urgency,
    riskItems: getRiskItems(activeRecords),
  };
}

export function AdminDashboard({ orders }: { orders: Order[] }) {
  const analytics = useMemo(() => getAdminAnalytics(orders), [orders]);
  const cards: MetricCardData[] = [
    {
      label: "Total Orders",
      value: String(analytics.allOrders.length),
      change: 12,
      helper: "vs last period",
      icon: <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
      accent: "bg-blue-50 dark:bg-blue-950/50",
    },
    {
      label: "Active Enquiries",
      value: String(analytics.openEnquiries.length),
      change: 8,
      helper: "vs last period",
      icon: (
        <MessageSquare className="h-5 w-5 text-amber-600 dark:text-amber-400" />
      ),
      accent: "bg-amber-50 dark:bg-amber-950/50",
    },
    {
      label: "Revenue Pipeline",
      value: formatCurrency(analytics.revenue),
      change: 18,
      helper: "estimated value",
      icon: (
        <IndianRupee className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
      ),
      accent: "bg-emerald-50 dark:bg-emerald-950/50",
    },
    {
      label: "Avg Order Value",
      value: formatCurrency(analytics.averageOrderValue),
      change: -3,
      helper: "needs lift",
      icon: (
        <TrendingUp className="h-5 w-5 text-violet-600 dark:text-violet-400" />
      ),
      accent: "bg-violet-50 dark:bg-violet-950/50",
    },
  ];

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Admin Dashboard
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
            Operational overview
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            Stale records, pipeline health, and business analytics.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <MetricCard key={card.label} card={card} />
          ))}
        </div>

        <Panel eyebrow="Needs Attention" title="Stale and stuck records">
          <div className="space-y-3">
            {analytics.riskItems.slice(0, 6).map(({ order, signal }) => (
              <ActionItemRow key={order.id} order={order} signal={signal} />
            ))}
            {analytics.riskItems.length === 0 && (
              <div className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
                No stale or stuck records right now.
              </div>
            )}
            {analytics.riskItems.length > 6 && (
              <div className="pt-2 text-center">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/orders-and-enquiries">
                    View all {analytics.riskItems.length} items
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </Panel>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Panel eyebrow="Pipeline" title="Orders by stage">
            <div className="space-y-3">
              {analytics.stageCounts.map((item, index) => (
                <HorizontalBar
                  key={item.label}
                  item={item}
                  max={Math.max(
                    ...analytics.stageCounts.map((s) => s.value),
                    1,
                  )}
                  index={index}
                />
              ))}
            </div>
          </Panel>

          <Panel eyebrow="Products" title="By category">
            <DonutChart data={analytics.categoryCounts} />
          </Panel>
        </div>

        <Panel eyebrow="Enquiries" title="Status breakdown">
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-around">
            <DonutChart
              data={[
                {
                  label: "Open",
                  value: analytics.openEnquiries.length,
                  color: "oklch(0.55 0.13 178)",
                },
                {
                  label: "Converted",
                  value: analytics.allOrders.filter((o) => o.sourceEnquiryId)
                    .length,
                  color: "oklch(0.68 0.19 46)",
                },
                {
                  label: "Closed",
                  value: analytics.closedEnquiries.length,
                  color: "oklch(0.38 0.09 225)",
                },
              ]}
              size={120}
            />
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Conversion", value: "42%" },
                { label: "Avg Response", value: "2.4h" },
                { label: "Close Time", value: "6d" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-lg bg-muted/50 px-3 py-2.5 text-center"
                >
                  <p className="text-lg font-semibold tracking-tight text-foreground">
                    {stat.value}
                  </p>
                  <p className="mt-0.5 text-[10px] font-medium text-muted-foreground">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </div>

      <div className="xl:sticky xl:top-6 xl:self-start">
        <RecentActivities
          orders={orders}
          className="xl:max-h-[calc(100vh-3rem)]"
        />
      </div>
    </div>
  );
}

export function OperationsDashboard({ orders }: { orders: Order[] }) {
  const analytics = useMemo(() => getOpsAnalytics(orders), [orders]);
  const staleCount = analytics.riskItems.filter(
    (r) => r.signal === "stale",
  ).length;
  const stuckCount = analytics.riskItems.filter(
    (r) => r.signal === "stuck",
  ).length;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Operations Dashboard
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
              Production and pipeline health
            </h1>
            <p className="mt-2 text-base text-muted-foreground">
              Action items, stage distribution, and category analytics.
            </p>
          </div>
          <Button asChild variant="outline" className="self-start sm:self-auto">
            <Link href="/orders-and-enquiries">Open workspace</Link>
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <MetricCard
            card={{
              label: "Active Orders",
              value: String(analytics.activeOrders.length),
            }}
          />
          <MetricCard
            card={{
              label: "Open Enquiries",
              value: String(analytics.openEnquiries.length),
            }}
          />
          <MetricCard
            card={{
              label: "Overdue",
              value: String(analytics.urgency.overdue),
            }}
          />
          <MetricCard
            card={{
              label: "Pipeline Value",
              value: formatCurrency(analytics.revenue),
            }}
          />
        </div>

        {analytics.riskItems.length > 0 && (
          <Panel
            eyebrow="Action Items"
            title="Records needing intervention"
            action={
              <div className="flex flex-wrap items-center justify-end gap-1.5">
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
            }
          >
            <div className="space-y-3">
              {analytics.riskItems.slice(0, 5).map(({ order, signal }) => (
                <ActionItemRow
                  key={order.id}
                  order={order}
                  signal={signal}
                  showUrgency
                />
              ))}
              {analytics.riskItems.length > 5 && (
                <div className="pt-2 text-center">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/orders-and-enquiries">
                      View all {analytics.riskItems.length} items
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </Panel>
        )}

        <div className="grid gap-6 xl:grid-cols-2">
          <Panel eyebrow="Pipeline" title="Records by stage">
            <div className="space-y-3">
              {analytics.stageCounts.map((item, index) => (
                <HorizontalBar
                  key={item.label}
                  item={item}
                  max={Math.max(
                    ...analytics.stageCounts.map((s) => s.value),
                    1,
                  )}
                  index={index}
                />
              ))}
            </div>
          </Panel>

          <Panel eyebrow="Delivery" title="Urgency breakdown">
            <DonutChart
              data={[
                {
                  label: "Overdue",
                  value: analytics.urgency.overdue,
                  color: "oklch(0.62 0.22 25)",
                },
                {
                  label: "Due Soon",
                  value: analytics.urgency["due-soon"],
                  color: "oklch(0.76 0.17 72)",
                },
                {
                  label: "On Track",
                  value: analytics.urgency["on-track"],
                  color: "oklch(0.59 0.14 145)",
                },
                {
                  label: "No Date",
                  value: analytics.urgency.none,
                  color: "oklch(0.55 0.02 260)",
                },
              ]}
            />
          </Panel>
        </div>

        <Panel eyebrow="Products" title="By category">
          <DonutChart data={analytics.categoryCounts} size={132} />
        </Panel>
      </div>

      <div className="xl:sticky xl:top-6 xl:self-start">
        <RecentActivities
          orders={orders}
          className="xl:max-h-[calc(100vh-3rem)]"
        />
      </div>
    </div>
  );
}

export function SalesDashboard({ orders }: { orders: Order[] }) {
  const [activeTab, setActiveTab] = useState<SalesTab>("orders");
  const data = useMemo(() => {
    const actionItems = getRiskItems(orders);
    const openOrders = orders
      .filter((o) => o.type === "order" && o.currentStage !== "Customer Pickup")
      .sort(
        (a, b) =>
          new Date(b.lastUpdatedAt).getTime() -
          new Date(a.lastUpdatedAt).getTime(),
      );
    const openEnquiries = orders
      .filter((o) => o.type === "enquiry" && o.status !== "closed")
      .sort(
        (a, b) =>
          new Date(b.lastUpdatedAt).getTime() -
          new Date(a.lastUpdatedAt).getTime(),
      );
    const totalPipeline = openOrders.reduce(
      (sum, o) => sum + (o.totalEstimate ?? 0),
      0,
    );
    const overdueCount = openOrders.filter(
      (o) => getUrgencyLevel(o.deliveryDate) === "overdue",
    ).length;

    return {
      actionItems,
      openOrders,
      openEnquiries,
      totalPipeline,
      overdueCount,
    };
  }, [orders]);
  const staleCount = data.actionItems.filter(
    (r) => r.signal === "stale",
  ).length;
  const stuckCount = data.actionItems.filter(
    (r) => r.signal === "stuck",
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Sales Dashboard
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
            Your open work
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            Action items, open orders and enquiries that need your attention.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button asChild size="sm">
            <Link href="/enquiries/new" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              New Enquiry
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricCard
          card={{ label: "Open Orders", value: String(data.openOrders.length) }}
        />
        <MetricCard
          card={{
            label: "Open Enquiries",
            value: String(data.openEnquiries.length),
          }}
        />
        <MetricCard
          card={{ label: "Overdue", value: String(data.overdueCount) }}
        />
      </div>

      {data.actionItems.length > 0 && (
        <Panel
          eyebrow="Action Items"
          title="Records that need follow-up"
          action={
            <div className="flex flex-wrap items-center justify-end gap-1.5">
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
          }
        >
          <div className="space-y-3">
            {data.actionItems.slice(0, 5).map(({ order, signal }) => (
              <ActionItemRow
                key={order.id}
                order={order}
                signal={signal}
                showUrgency
              />
            ))}
          </div>
        </Panel>
      )}

      <div>
        <div className="flex items-center gap-1 border-b border-border">
          <button
            type="button"
            onClick={() => setActiveTab("orders")}
            className={cn(
              "flex min-h-11 cursor-pointer items-center gap-1.5 border-b-2 px-4 py-2 text-sm font-medium transition-colors",
              activeTab === "orders"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <Package className="h-4 w-4" />
            Open Orders
            <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
              {data.openOrders.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("enquiries")}
            className={cn(
              "flex min-h-11 cursor-pointer items-center gap-1.5 border-b-2 px-4 py-2 text-sm font-medium transition-colors",
              activeTab === "enquiries"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <MessageSquare className="h-4 w-4" />
            Open Enquiries
            <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
              {data.openEnquiries.length}
            </span>
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {activeTab === "orders" &&
            (data.openOrders.length > 0 ? (
              data.openOrders.map((order) => (
                <RecordRow key={order.id} order={order} />
              ))
            ) : (
              <EmptyRows
                title="No open orders"
                description="All orders are either complete or not yet created."
              />
            ))}
          {activeTab === "enquiries" &&
            (data.openEnquiries.length > 0 ? (
              data.openEnquiries.map((order) => (
                <EnquiryCard key={order.id} order={order} />
              ))
            ) : (
              <EmptyRows
                title="No open enquiries"
                description="Create a new enquiry to get started."
              />
            ))}
        </div>
      </div>
    </div>
  );
}
