"use client";

import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Inbox,
  IndianRupee,
  MessageSquare,
  Package,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Bar,
  EvilBarChart,
  Tooltip as EvilBarTooltip,
  Grid,
  XAxis,
  YAxis,
} from "@/components/evilcharts/charts/bar-chart";
import {
  EvilPieChart,
  Legend as EvilPieLegend,
  Tooltip as EvilPieTooltip,
  Pie,
} from "@/components/evilcharts/charts/pie-chart";
import type { ChartConfig } from "@/components/evilcharts/ui/chart";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getOrderEnquiryUiStatus,
  isEnquiryClosed,
  isEnquiryFinalized,
} from "@/lib/enquiryStatus";
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
  isTerminalRecord,
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

interface ChartDatum extends Record<string, unknown> {
  label: string;
  value: number;
  color: string;
}

interface EvilChartDatum extends Record<string, unknown> {
  key: string;
  label: string;
  value: number;
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

function getChartKey(label: string) {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function toEvilChartData(data: ChartDatum[]): EvilChartDatum[] {
  return data.map((item) => ({
    key: getChartKey(item.label),
    label: item.label,
    value: item.value,
  }));
}

function getEvilPieChartConfig(data: ChartDatum[]): ChartConfig {
  return data.reduce<ChartConfig>((config, item) => {
    config[getChartKey(item.label)] = {
      label: item.label,
      colors: {
        light: [item.color],
        dark: [item.color],
      },
    };

    return config;
  }, {});
}

const STAGE_CHART_CONFIG = {
  value: {
    label: "Records",
    colors: {
      light: ["oklch(0.58 0.14 155)"],
      dark: ["oklch(0.68 0.14 155)"],
    },
  },
} satisfies ChartConfig;

function getRecordHref(order: Order) {
  return order.type === "enquiry"
    ? `/enquiries/${order.refCode}`
    : `/orders/${order.refCode}`;
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
      .filter((order) => !isTerminalRecord(order))
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
    <div className="border-border/70 px-5 py-4 max-sm:border-b sm:border-r sm:last:border-r-0">
      <p className="text-sm text-muted-foreground">{card.label}</p>
      <div className="mt-2 flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
        <p className="truncate text-2xl font-semibold tracking-tight text-foreground">
          {card.value}
        </p>
        {(card.change !== undefined || card.helper) && (
          <div className="flex items-center gap-2">
            {card.change !== undefined && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-xs font-medium",
                  isPositive
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-600 dark:text-red-400",
                )}
              >
                {isPositive ? (
                  <ArrowUp className="h-3 w-3" />
                ) : (
                  <ArrowDown className="h-3 w-3" />
                )}
                {Math.abs(card.change)}%
              </span>
            )}
            {card.helper && (
              <span className="text-xs text-muted-foreground">
                {card.helper}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MetricsGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid overflow-hidden rounded-lg border border-border/70 bg-card sm:grid-cols-2 xl:grid-cols-4">
      {children}
    </div>
  );
}

function Panel({
  title,
  children,
  className,
  action,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <section className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
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
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
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

function EvilStageChart({ data }: { data: ChartDatum[] }) {
  return (
    <EvilBarChart
      data={data}
      config={STAGE_CHART_CONFIG}
      layout="horizontal"
      className="h-[19rem] w-full p-1"
      barRadius={5}
      chartProps={{
        margin: { top: 4, right: 8, bottom: 4, left: 0 },
      }}
    >
      <Grid horizontal={false} />
      <XAxis hide />
      <YAxis dataKey="label" width={96} tickMargin={8} />
      <EvilBarTooltip variant="frosted-glass" />
      <Bar
        dataKey="value"
        variant="default"
        enableHoverHighlight
        barProps={{ name: "Records" }}
      />
    </EvilBarChart>
  );
}

function EvilDonutChart({
  data,
  className,
}: {
  data: ChartDatum[];
  className?: string;
}) {
  const chartData = toEvilChartData(data);
  const chartConfig = getEvilPieChartConfig(data);

  return (
    <EvilPieChart
      data={chartData}
      config={chartConfig}
      dataKey="value"
      nameKey="key"
      className={cn("h-52 w-full p-1", className)}
    >
      <EvilPieTooltip variant="frosted-glass" />
      <Pie
        innerRadius={50}
        outerRadius={80}
        cornerRadius={3}
        paddingAngle={2}
        isClickable
      />
      <EvilPieLegend variant="circle" align="center" isClickable />
    </EvilPieChart>
  );
}

function SignalBadge({ signal }: { signal: "stale" | "stuck" }) {
  const isStale = signal === "stale";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium",
        isStale
          ? "text-orange-700 dark:text-orange-300"
          : "text-amber-700 dark:text-amber-300",
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          isStale ? "bg-orange-500" : "bg-amber-500",
        )}
      />
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
  const isStuckEnquiry = order.type === "enquiry" && signal === "stuck";

  return (
    <Link
      href={getRecordHref(order)}
      className={cn(
        "group flex items-start justify-between gap-3 border-b border-border/60 px-4 py-3 transition-colors last:border-b-0 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        isStuckEnquiry &&
          "border-l-2 border-l-amber-500/35 bg-amber-500/[0.025] hover:bg-amber-500/[0.06]",
      )}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-base font-medium text-foreground">
            {order.customerName}
          </p>
          <Badge
            variant="outline"
            className={cn(
              "h-5 rounded-sm px-1.5 text-[10px] font-medium uppercase tracking-normal",
              order.type === "enquiry"
                ? "border-amber-500/25 bg-amber-500/5 text-amber-700 dark:text-amber-300"
                : "border-blue-500/25 bg-blue-500/5 text-blue-700 dark:text-blue-300",
            )}
          >
            {order.type}
          </Badge>
          <SignalBadge signal={signal} />
        </div>
        <div>
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
        <ArrowRight className="h-4 w-4 text-muted-foreground/35 transition-colors group-hover:text-muted-foreground" />
      </div>
    </Link>
  );
}

function RecordRow({ order }: { order: Order }) {
  const urgency = getUrgencyLevel(order.deliveryDate);

  return (
    <Link
      href={getRecordHref(order)}
      className="group flex items-start justify-between gap-3 border-b border-border/60 px-4 py-3 transition-colors last:border-b-0 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
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
        <ArrowRight className="h-4 w-4 text-muted-foreground/35 transition-colors group-hover:text-muted-foreground" />
      </div>
    </Link>
  );
}

function EnquiryCard({ order }: { order: Order }) {
  const person = order.createdBy ?? { id: "", name: "Unknown", image: null };

  return (
    <Link
      href={getRecordHref(order)}
      className="group flex items-center justify-between gap-4 border-b border-border/60 px-4 py-3 transition-colors last:border-b-0 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="text-sm text-muted-foreground">#{order.refCode}</span>
        <span className="text-foreground">{order.customerName}</span>

        <Badge
          variant={isEnquiryClosed(order) ? "secondary" : "default"}
          className="text-[10px]"
        >
          {getOrderEnquiryUiStatus(order)}
        </Badge>
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
    <div className="rounded-lg border border-dashed border-border/70 py-10 text-center">
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
    (order) => !isEnquiryFinalized(order),
  );
  const closedEnquiries = allEnquiries.filter(isEnquiryClosed);
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
      order.type === "order" &&
      order.currentStage !== "Delivered" &&
      order.currentStage !== "Closed" &&
      order.currentStage !== "Cancelled",
  );
  const openEnquiries = orders.filter(
    (order) => order.type === "enquiry" && !isEnquiryFinalized(order),
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
      icon: <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
      accent: "bg-blue-500/10 dark:bg-blue-500/10",
    },
    {
      label: "Active Enquiries",
      value: String(analytics.openEnquiries.length),
      icon: (
        <MessageSquare className="h-5 w-5 text-amber-600 dark:text-amber-400" />
      ),
      accent: "bg-amber-500/10 dark:bg-amber-500/10",
    },
    {
      label: "Revenue Pipeline",
      value: formatCurrency(analytics.revenue),
      icon: (
        <IndianRupee className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
      ),
      accent: "bg-emerald-500/10 dark:bg-emerald-500/10",
    },
    {
      label: "Avg Order Value",
      value: formatCurrency(analytics.averageOrderValue),
      icon: (
        <TrendingUp className="h-5 w-5 text-violet-600 dark:text-violet-400" />
      ),
      accent: "bg-violet-500/10 dark:bg-violet-500/10",
    },
  ];

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-5">
        <div className="flex flex-col">
          <h1 className="min-w-0 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Admin Dashboard
          </h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            View analytics and get an overview of your ongoing records.
          </p>
        </div>

        <MetricsGrid>
          {cards.map((card) => (
            <MetricCard key={card.label} card={card} />
          ))}
        </MetricsGrid>

        <Panel title="Needs attention">
          <div className="overflow-hidden rounded-lg border border-border/70 bg-card">
            {analytics.riskItems.slice(0, 6).map(({ order, signal }) => (
              <ActionItemRow key={order.id} order={order} signal={signal} />
            ))}
            {analytics.riskItems.length === 0 && (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No stale or stuck records right now.
              </div>
            )}
            {analytics.riskItems.length > 6 && (
              <div className="flex justify-center px-4 py-3">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/orders-workspace">
                    View all {analytics.riskItems.length} items
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </Panel>

        <div className="grid items-stretch gap-5 my-4 xl:grid-cols-2">
          <Panel title="Orders by stage" className="xl:flex xl:h-full xl:flex-col">
            <div className="rounded-lg border border-border/70 bg-card p-4 xl:flex xl:flex-1 xl:flex-col xl:py-6">
              <EvilStageChart data={analytics.stageCounts} />
            </div>
          </Panel>

          <div className="grid gap-5 xl:h-full xl:grid-rows-2">
            <Panel title="By category" className="xl:flex xl:min-h-0 xl:flex-col">
              <div className="rounded-lg border border-border/70 bg-card p-4 xl:flex xl:flex-1 xl:flex-col">
                <EvilDonutChart data={analytics.categoryCounts} />
              </div>
            </Panel>

            <Panel title="Status breakdown" className="xl:flex xl:min-h-0 xl:flex-col">
              <div className="rounded-lg border border-border/70 bg-card p-4 pb-5 xl:flex xl:flex-1 xl:flex-col xl:pb-6">
                <EvilDonutChart
                  data={[
                    {
                      label: "Open",
                      value: analytics.openEnquiries.length,
                      color: "oklch(0.55 0.13 178)",
                    },
                    {
                      label: "Converted",
                      value: analytics.allOrders.filter(
                        (o) => o.sourceEnquiryId,
                      ).length,
                      color: "oklch(0.68 0.19 46)",
                    },
                    {
                      label: "Closed",
                      value: analytics.closedEnquiries.length,
                      color: "oklch(0.38 0.09 225)",
                    },
                  ]}
                />
                <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border/60 pt-3">
                  {[
                    { label: "Conversion", value: "42%" },
                    { label: "Avg Response", value: "2.4h" },
                    { label: "Close Time", value: "6d" },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center">
                      <p className="text-base font-semibold tracking-tight text-foreground">
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
        </div>
      </div>

      <div className="xl:sticky xl:top-5 xl:self-start">
        <RecentActivities
          orders={orders}
          className="xl:max-h-[calc(100vh-2.5rem)]"
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
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-5">
        <div className="flex flex-col">
          <h1 className="min-w-0 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Operations Dashboard
          </h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Get a bird's-eye view of the ongoing records.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <MetricsGrid>
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
          </MetricsGrid>
          <Button asChild variant="outline" className="self-start sm:self-auto">
            <Link href="/orders-workspace">Open workspace</Link>
          </Button>
        </div>

        {analytics.riskItems.length > 0 && (
          <Panel
            title="Records needing intervention"
            action={
              <div className="flex flex-wrap items-center justify-end gap-1.5">
                {staleCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-600 dark:text-orange-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                    {staleCount} stale
                  </span>
                )}
                {stuckCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    {stuckCount} stuck
                  </span>
                )}
              </div>
            }
          >
            <div className="overflow-hidden rounded-lg border border-border/70 bg-card">
              {analytics.riskItems.slice(0, 5).map(({ order, signal }) => (
                <ActionItemRow
                  key={order.id}
                  order={order}
                  signal={signal}
                  showUrgency
                />
              ))}
              {analytics.riskItems.length > 5 && (
                <div className="flex justify-center px-4 py-3">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/orders-workspace">
                      View all {analytics.riskItems.length} items
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </Panel>
        )}

        <div className="grid items-start gap-5 xl:grid-cols-2">
          <Panel title="Records by stage" className="xl:h-full">
            <div className="space-y-4 rounded-lg border border-border/70 bg-card p-4">
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

          <div className="grid gap-5">
            <Panel title="Urgency breakdown">
              <div className="rounded-lg border border-border/70 bg-card p-4">
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
              </div>
            </Panel>

            <Panel title="By category">
              <div className="rounded-lg border border-border/70 bg-card p-4">
                <DonutChart data={analytics.categoryCounts} />
              </div>
            </Panel>
          </div>
        </div>
      </div>

      <div className="xl:sticky xl:top-5 xl:self-start">
        <RecentActivities
          orders={orders}
          className="xl:max-h-[calc(100vh-2.5rem)]"
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
      .filter(
        (o) =>
          o.type === "order" &&
          o.currentStage !== "Delivered" &&
          o.currentStage !== "Closed" &&
          o.currentStage !== "Cancelled",
      )
      .sort(
        (a, b) =>
          new Date(b.lastUpdatedAt).getTime() -
          new Date(a.lastUpdatedAt).getTime(),
      );
    const openEnquiries = orders
      .filter((o) => o.type === "enquiry" && !isEnquiryFinalized(o))
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
    <div className="space-y-5">
      <div className="flex flex-col">
        <h1 className="min-w-0 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          Sales Dashboard
        </h1>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          Keep on eye on your customer and sales pipeline.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <MetricsGrid>
          <MetricCard
            card={{
              label: "Open Orders",
              value: String(data.openOrders.length),
            }}
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
        </MetricsGrid>
      </div>

      {data.actionItems.length > 0 && (
        <Panel
          title="Records that need follow-up"
          action={
            <div className="flex flex-wrap items-center justify-end gap-1.5">
              {staleCount > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-700 dark:text-orange-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                  {staleCount} stale
                </span>
              )}
              {stuckCount > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  {stuckCount} stuck
                </span>
              )}
            </div>
          }
        >
          <div className="overflow-hidden rounded-lg border border-border/70 bg-card">
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
              "flex min-h-11 cursor-pointer items-center gap-1.5 border-b-2 px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
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
              "flex min-h-11 cursor-pointer items-center gap-1.5 border-b-2 px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
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

        <div className="mt-4 overflow-hidden rounded-lg border border-border/70 bg-card">
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
