"use client";

import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Award,
  BadgeCheck,
  Bell,
  ChartNoAxesColumn,
  Inbox,
  Lock,
  MessageSquare,
  Package,
  PanelRightClose,
  Store,
  Users,
} from "lucide-react";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  EvilBarChart,
  Legend as EvilBarLegend,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useMyStockSales,
  useSalesPersonStockSales,
  useStockSalesAnalytics,
  useStockSalesLeaderboard,
} from "@/hooks/useStockSales";
import {
  getOrderEnquiryUiStatus,
  isEnquiryClosed,
  isEnquiryFinalized,
} from "@/lib/enquiryStatus";
import { getInitials } from "@/lib/people";
import { useActivitySidebar } from "@/lib/stores/activity-sidebar-store";
import {
  cn,
  formatCurrency,
  formatDaysRemaining,
  formatRelativeTime,
  getUrgencyLevel,
} from "@/lib/utils";
import type { Order, UrgencyLevel } from "@/types";
import type { BackendOrderStatus } from "@/types/order-api";
import type { OrdersEnquiriesAnalyticsResponse } from "@/types/orders-enquiries-analytics-api";
import type {
  StockSalesAnalyticsBreakdownRow,
  StockSalesAnalyticsPeriod,
  StockSalesLeaderboardRow,
  StockSalesMeResponse,
} from "@/types/stock-sales-api";
import { RecentActivities } from "./RecentActivities";
import { SalesTargetMeter } from "./SalesTargetMeter";

export type SalesTab =
  | "orders"
  | "enquiries"
  | "store-orders"
  | "store-enquiries";
type AdminDashboardTab = "orders-enquiries" | "sales-analytics";

interface AnalyticsDashboardProps {
  analytics?: OrdersEnquiriesAnalyticsResponse;
  analyticsError: Error | null;
  analyticsLoading: boolean;
  onRetryAnalytics: () => void;
}

interface MetricCardData {
  label: string;
  value: string;
  change?: number;
  helper?: string;
  icon?: React.ReactNode;
  accent?: string;
  href?: string;
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

const TREND_CHART_CONFIG = {
  enquiriesCreated: {
    label: "Enquiries",
    colors: {
      light: ["oklch(0.68 0.16 72)"],
      dark: ["oklch(0.76 0.15 72)"],
    },
  },
  ordersCreated: {
    label: "Orders",
    colors: {
      light: ["oklch(0.58 0.14 155)"],
      dark: ["oklch(0.68 0.14 155)"],
    },
  },
} satisfies ChartConfig;

const ORDER_STATUS_LABELS: Record<BackendOrderStatus, string> = {
  NEW: "New",
  IN_PRODUCTION: "In Production",
  CAD_DESIGN: "CAD Design",
  IN_TRANSIT: "In Transit",
  CERTIFICATION: "Certification",
  AT_STORE: "At Store",
  DELIVERED: "Delivered",
  CLOSED: "Closed",
  CANCELLED: "Cancelled",
};

const URGENCY_COLORS: Record<UrgencyLevel, string> = {
  overdue: "oklch(0.62 0.22 25)",
  "due-soon": "oklch(0.76 0.17 72)",
  "on-track": "oklch(0.59 0.14 145)",
  none: "oklch(0.55 0.02 260)",
};

const URGENCY_LABELS: Record<UrgencyLevel, string> = {
  overdue: "Overdue",
  "due-soon": "Due Soon",
  "on-track": "On Track",
  none: "No Date",
};

const ADMIN_DASHBOARD_TABS = new Set<AdminDashboardTab>([
  "orders-enquiries",
  "sales-analytics",
]);

const SALE_MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => {
  const date = new Date(2026, index, 1);

  return {
    value: String(index + 1).padStart(2, "0"),
    label: date.toLocaleDateString("en-IN", { month: "long" }),
  };
});
const SALES_LEADERBOARD_SKELETON_ROWS = ["first", "second", "third"] as const;
const ANALYTICS_TABLE_SKELETON_ROWS = [
  "first",
  "second",
  "third",
  "fourth",
  "fifth",
] as const;

function buildUrgencyData(urgency: Record<UrgencyLevel, number>): ChartDatum[] {
  return (Object.keys(URGENCY_COLORS) as UrgencyLevel[]).map((level) => ({
    label: URGENCY_LABELS[level],
    value: urgency[level],
    color: URGENCY_COLORS[level],
  }));
}

function buildFunnelData(
  funnel: OrdersEnquiriesAnalyticsResponse["periodActivity"]["enquiryFunnel"],
): ChartDatum[] {
  return [
    { label: "New", value: funnel.NEW, color: "oklch(0.55 0.13 178)" },
    {
      label: "Estimated",
      value: funnel.ESTIMATED,
      color: "oklch(0.68 0.16 72)",
    },
    {
      label: "Converted",
      value: funnel.CONVERTED,
      color: "oklch(0.68 0.19 46)",
    },
    {
      label: "Closed",
      value: funnel.CLOSED,
      color: "oklch(0.38 0.09 225)",
    },
  ];
}

function buildSnapshotUrgency(
  snapshot: OrdersEnquiriesAnalyticsResponse["currentSnapshot"],
): Record<UrgencyLevel, number> {
  return {
    overdue: snapshot.overdueOrders,
    "due-soon": snapshot.dueSoonOrders,
    "on-track": Math.max(
      0,
      snapshot.activeOrders -
        snapshot.overdueOrders -
        snapshot.dueSoonOrders -
        snapshot.noDeliveryDateOrders,
    ),
    none: snapshot.noDeliveryDateOrders,
  };
}

function buildStageData(
  stages: OrdersEnquiriesAnalyticsResponse["currentSnapshot"]["orderStages"],
): ChartDatum[] {
  return stages.map(({ status, count }) => ({
    label: ORDER_STATUS_LABELS[status],
    value: count,
    color: "",
  }));
}

function formatAnalyticsPeriod(
  period: OrdersEnquiriesAnalyticsResponse["period"],
) {
  return `${period.from} to ${period.to}`;
}

function formatTrendDate(date: string) {
  const [, month, day] = date.split("-");
  return `${day}/${month}`;
}

function getRecordHref(order: Order) {
  return order.type === "enquiry"
    ? `/enquiries/${order.refCode}`
    : `/orders/${order.refCode}`;
}

function MetricCard({ card }: { card: MetricCardData }) {
  const isPositive = (card.change ?? 0) >= 0;
  const content = (
    <>
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
    </>
  );
  const className =
    "border-border/70 px-5 py-4 max-sm:border-b sm:border-r sm:last:border-r-0";

  if (card.href) {
    return (
      <Link
        href={card.href}
        className={cn(
          className,
          "transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        )}
      >
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}

function MetricsGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid overflow-hidden rounded-lg border border-border/70 bg-card sm:grid-cols-2 xl:grid-cols-4",
        className,
      )}
    >
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

function EvilStageChart({
  data,
  className,
}: {
  data: ChartDatum[];
  className?: string;
}) {
  return (
    <EvilBarChart
      data={data}
      config={STAGE_CHART_CONFIG}
      layout="horizontal"
      className={cn("h-64 w-full p-1", className)}
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
  innerRadius = 42,
  outerRadius = 66,
}: {
  data: ChartDatum[];
  className?: string;
  innerRadius?: number;
  outerRadius?: number;
}) {
  const chartData = toEvilChartData(data);
  const chartConfig = getEvilPieChartConfig(data);

  return (
    <EvilPieChart
      data={chartData}
      config={chartConfig}
      dataKey="value"
      nameKey="key"
      className={cn("h-40 w-full p-1", className)}
    >
      <EvilPieTooltip variant="frosted-glass" />
      <Pie
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        cornerRadius={3}
        paddingAngle={2}
        isClickable
      />
      <EvilPieLegend variant="circle" align="center" isClickable />
    </EvilPieChart>
  );
}

function ActivityTrendChart({
  trends,
}: {
  trends: OrdersEnquiriesAnalyticsResponse["periodActivity"]["trends"];
}) {
  const data = trends.map((item) => ({
    ...item,
    label: formatTrendDate(item.date),
  }));

  return (
    <EvilBarChart
      data={data}
      config={TREND_CHART_CONFIG}
      className="h-64 w-full p-1"
      barRadius={3}
      chartProps={{ margin: { top: 4, right: 8, bottom: 4, left: -16 } }}
    >
      <Grid vertical={false} />
      <XAxis dataKey="label" minTickGap={24} />
      <YAxis allowDecimals={false} />
      <EvilBarTooltip variant="frosted-glass" />
      <EvilBarLegend variant="circle" align="center" isClickable />
      <Bar dataKey="enquiriesCreated" enableHoverHighlight />
      <Bar dataKey="ordersCreated" enableHoverHighlight />
    </EvilBarChart>
  );
}

function StageAndBreakdownCharts({
  stageTitle,
  stageCounts,
  urgencyData,
  statusData,
}: {
  stageTitle: string;
  stageCounts: ChartDatum[];
  urgencyData: ChartDatum[];
  statusData: ChartDatum[];
}) {
  return (
    <div className="my-4 grid items-stretch gap-5 xl:grid-cols-2">
      <Panel title={stageTitle} className="xl:flex xl:h-full xl:flex-col">
        <div className="rounded-lg border border-border/70 bg-card p-4 xl:flex xl:flex-1 xl:flex-col">
          <EvilStageChart data={stageCounts} />
        </div>
      </Panel>

      <div className="grid gap-5 xl:h-full xl:grid-rows-2">
        <Panel
          title="Urgency breakdown"
          className="xl:flex xl:min-h-0 xl:flex-col"
        >
          <div className="rounded-lg border border-border/70 bg-card p-4 xl:flex xl:flex-1 xl:flex-col">
            <EvilDonutChart data={urgencyData} />
          </div>
        </Panel>

        <Panel
          title="Enquiry funnel"
          className="xl:flex xl:min-h-0 xl:flex-col"
        >
          <div className="rounded-lg border border-border/70 bg-card p-4 xl:flex xl:flex-1 xl:flex-col">
            <EvilDonutChart data={statusData} />
          </div>
        </Panel>
      </div>
    </div>
  );
}

function AnalyticsCharts({
  analytics,
}: {
  analytics: OrdersEnquiriesAnalyticsResponse;
}) {
  return (
    <>
      <StageAndBreakdownCharts
        stageTitle="Orders by stage"
        stageCounts={buildStageData(analytics.currentSnapshot.orderStages)}
        urgencyData={buildUrgencyData(
          buildSnapshotUrgency(analytics.currentSnapshot),
        )}
        statusData={buildFunnelData(analytics.periodActivity.enquiryFunnel)}
      />
      <Panel title="Orders and enquiries created">
        <div className="rounded-lg border border-border/70 bg-card p-4">
          <ActivityTrendChart trends={analytics.periodActivity.trends} />
        </div>
      </Panel>
    </>
  );
}

function AnalyticsState({
  error,
  isLoading,
  onRetry,
}: {
  error: Error | null;
  isLoading: boolean;
  onRetry: () => void;
}) {
  if (isLoading) {
    return (
      <div className="space-y-5" aria-live="polite">
        <span className="sr-only">Loading order and enquiry analytics</span>
        <MetricsGrid>
          {["one", "two", "three", "four"].map((item) => (
            <div
              key={item}
              className="rounded-lg border border-border/70 bg-card p-4"
            >
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-3 h-8 w-16" />
            </div>
          ))}
        </MetricsGrid>
        <Skeleton className="h-80 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-5 py-6">
      <p className="font-medium text-foreground">
        Order and enquiry analytics could not be loaded.
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {error?.message ?? "Please try again."}
      </p>
      <Button className="mt-4" variant="outline" size="sm" onClick={onRetry}>
        Try again
      </Button>
    </div>
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

function getCurrentSaleMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getCurrentSaleMonthParts() {
  const [year, month] = getCurrentSaleMonth().split("-");
  return { month, year };
}

function getSaleYearOptions(selectedYear: string) {
  const currentYear = new Date().getFullYear();
  const years = new Set<string>();

  for (let year = currentYear; year >= currentYear - 4; year -= 1) {
    years.add(String(year));
  }

  years.add(String(currentYear + 1));
  years.add(selectedYear);

  return Array.from(years).sort((a, b) => Number(b) - Number(a));
}

function getSearchParamValue(
  searchParams: URLSearchParams,
  key: string,
  fallback: string,
) {
  const value = searchParams.get(key);
  return value?.trim() || fallback;
}

function getAdminDashboardTab(searchParams: URLSearchParams) {
  const tab = searchParams.get("tab");
  return ADMIN_DASHBOARD_TABS.has(tab as AdminDashboardTab)
    ? (tab as AdminDashboardTab)
    : "orders-enquiries";
}

function getSaleMonthFromSearchParams(searchParams: URLSearchParams) {
  const current = getCurrentSaleMonthParts();
  const queryMonth = getSearchParamValue(searchParams, "month", current.month);
  const queryYear = getSearchParamValue(searchParams, "year", current.year);
  const month = /^(0[1-9]|1[0-2])$/.test(queryMonth)
    ? queryMonth
    : current.month;
  const year = /^\d{4}$/.test(queryYear) ? queryYear : current.year;

  return { month, year, saleMonth: `${year}-${month}` };
}

function getSalesAnalyticsPeriod(searchParams: URLSearchParams) {
  return searchParams.get("year") === "allTime" ? "allTime" : "month";
}

function formatSaleMonthLabel(saleMonth: string) {
  const [year, month] = saleMonth.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);

  if (Number.isNaN(date.getTime())) return saleMonth;

  return date.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

function formatAnalyticsCurrency(value: string | number) {
  return formatCurrency(Number(value) || 0);
}

function getTargetProgress(
  revenue: string | number,
  target: string | number | null | undefined,
) {
  if (target == null) return null;

  const revenueValue = Number(revenue) || 0;
  const targetValue = Number(target) || 0;
  if (targetValue <= 0) return null;

  const progress =
    targetValue > 0 ? Math.round((revenueValue / targetValue) * 100) : 0;
  const clampedProgress = Math.max(0, Math.min(progress, 140));
  const displayProgress = Math.max(0, progress);
  const remaining = Math.max(0, targetValue - revenueValue);

  return {
    clampedProgress,
    displayProgress,
    fillHeight: Math.min(clampedProgress, 100),
    remaining,
  };
}

function getAnalyticsPeriodTitle(saleMonth: string) {
  return `Sales Analytics for ${formatSaleMonthLabel(saleMonth)}`;
}

function getAnalyticsTitle(
  period: StockSalesAnalyticsPeriod,
  saleMonth: string,
) {
  return period === "allTime"
    ? "Sales Analytics for All Time"
    : getAnalyticsPeriodTitle(saleMonth);
}

function getLeaderboardPeriodLabel(period: string) {
  return `Based on performance for ${formatSaleMonthLabel(period).split(" ")[0]} month`;
}

function SalesAnalyticsValue({
  value,
  isLoading,
}: {
  value: string;
  isLoading: boolean;
}) {
  if (isLoading) {
    return <Skeleton className="h-8 w-24" />;
  }

  return (
    <p className="truncate text-2xl font-semibold tracking-tight text-foreground">
      {value}
    </p>
  );
}

function SalesMetricTile({
  children,
  muted = false,
}: {
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex min-h-24 flex-col justify-between rounded-md border border-border/70 p-4",
        muted ? "bg-muted/40" : "bg-background/70",
      )}
    >
      {children}
    </div>
  );
}

function TargetCompletionCard({
  fillHeight,
  isIncentiveEligible,
  isLoading,
  nextMilestone,
  progress,
  progressValue,
}: {
  fillHeight: number;
  isIncentiveEligible: boolean;
  isLoading: boolean;
  nextMilestone: string;
  progress: ReturnType<typeof getTargetProgress>;
  progressValue: number;
}) {
  return (
    <div className="rounded-md border border-border/70 bg-background/70 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground">
            Target completion
          </p>
          <p className="mt-1 text-sm font-medium text-foreground">
            {nextMilestone}
          </p>
        </div>
        <p className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">
          {isLoading ? "--" : progress == null ? "N/A" : `${progressValue}%`}
        </p>
      </div>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            isIncentiveEligible
              ? "bg-emerald-500"
              : "bg-gradient-to-r from-amber-500 to-cyan-500",
          )}
          style={{ width: `${isLoading ? 0 : fillHeight}%` }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>0%</span>
        <span>25%</span>
        <span>50%</span>
        <span>75%</span>
        <span>100%</span>
      </div>
    </div>
  );
}

function SalesPerformanceCards({
  analytics,
  compact = false,
  isLoading,
  monthLabel,
}: {
  analytics?: StockSalesMeResponse;
  compact?: boolean;
  isLoading: boolean;
  monthLabel: string;
}) {
  const target = analytics?.target;
  const revenue = analytics?.revenue ?? "0";
  const earnedIncentiveAmount = analytics?.incentive.earnedAmount ?? "0";
  const payableIncentiveAmount = analytics?.incentive.payableAmount ?? "0";
  const incentiveMultiplier = analytics?.incentive.multiplier ?? "0.00";
  const progress = getTargetProgress(revenue, target);
  const progressValue = progress?.displayProgress ?? 0;
  const fillHeight = progress?.fillHeight ?? 0;
  const isIncentiveEligible =
    analytics?.incentive.eligible ?? progressValue >= 100;
  const nextMilestone =
    progress == null
      ? "Target not set"
      : progressValue >= 100
        ? "Incentive unlocked"
        : progressValue >= 75
          ? "Final stretch"
          : progressValue >= 50
            ? "Halfway crossed"
            : "Building momentum";

  return (
    <section className="rounded-lg border border-border/70 bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">
          Sales Performance this {monthLabel}
        </h2>
        <Badge
          variant="outline"
          className={cn(
            "rounded-md px-2 py-1 text-[11px] font-medium",
            isIncentiveEligible
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
          )}
        >
          {isIncentiveEligible ? "Eligible" : "Target pending"}
        </Badge>
      </div>

      <div
        className={cn(
          "mt-5 grid gap-5",
          compact
            ? "lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.82fr)]"
            : "xl:grid-cols-[minmax(0,1fr)_minmax(19rem,0.78fr)]",
        )}
      >
        <div className="grid min-w-0 gap-3">
          <TargetCompletionCard
            fillHeight={fillHeight}
            isIncentiveEligible={isIncentiveEligible}
            isLoading={isLoading}
            nextMilestone={nextMilestone}
            progress={progress}
            progressValue={progressValue}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <SalesMetricTile>
              <p className="text-sm font-medium text-muted-foreground">
                Monthly Target
              </p>
              <p className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">
                {isLoading
                  ? "--"
                  : target == null
                    ? "N/A"
                    : formatAnalyticsCurrency(target)}
              </p>
            </SalesMetricTile>

            <SalesMetricTile>
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-muted-foreground">
                  Payable Incentive
                </p>
                {isIncentiveEligible ? (
                  <BadgeCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Lock className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div>
                <SalesAnalyticsValue
                  isLoading={isLoading}
                  value={formatAnalyticsCurrency(payableIncentiveAmount)}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {isLoading
                    ? "--"
                    : `${formatAnalyticsCurrency(earnedIncentiveAmount)} earned - ${incentiveMultiplier}x`}
                </p>
              </div>
            </SalesMetricTile>

            <SalesMetricTile muted>
              <p className="text-sm font-medium text-muted-foreground">
                Sales Transactions
              </p>
              <p className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">
                {isLoading ? "--" : (analytics?.transactions ?? 0)}
              </p>
            </SalesMetricTile>

            <SalesMetricTile muted>
              <p className="text-sm font-medium text-muted-foreground">
                Sales Value
              </p>
              <SalesAnalyticsValue
                isLoading={isLoading}
                value={formatAnalyticsCurrency(revenue)}
              />
            </SalesMetricTile>
          </div>
        </div>

        <div className="min-w-0">
          <SalesTargetMeter
            fillHeight={fillHeight}
            isIncentiveEligible={isIncentiveEligible}
            isLoading={isLoading}
            progressValue={progressValue}
          />
        </div>
      </div>
    </section>
  );
}

function ActivitySidebarToggle({ className }: { className?: string }) {
  const { isOpen, toggle } = useActivitySidebar();
  const Icon = isOpen ? PanelRightClose : Bell;

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggle}
      className={cn(
        "size-9 shrink-0 bg-transparent text-muted-foreground shadow-none transition-colors hover:bg-transparent hover:text-foreground",
        className,
      )}
      aria-pressed={isOpen}
      aria-label={isOpen ? "Hide recent activity" : "Show recent activity"}
      title={isOpen ? "Hide recent activity" : "Show recent activity"}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}

function RecentActivitiesColumn() {
  const isActivityOpen = useActivitySidebar((state) => state.isOpen);

  if (!isActivityOpen) {
    return (
      <ActivitySidebarToggle className="fixed top-4 right-4 z-40 print-hide" />
    );
  }

  return (
    <div className="xl:sticky xl:top-5 xl:self-start">
      <div className="relative">
        <ActivitySidebarToggle className="absolute top-1 right-2 z-10" />
        <RecentActivities className="xl:max-h-[calc(100vh-2.5rem)]" />
      </div>
    </div>
  );
}

function MySalesAnalyticsCards() {
  const saleMonth = getCurrentSaleMonth();
  const salesQuery = useMyStockSales({
    period: "month",
    saleMonth,
  });
  const monthLabel = formatSaleMonthLabel(
    salesQuery.data?.period ?? saleMonth,
  ).split(" ")[0];

  return (
    <SalesPerformanceCards
      analytics={salesQuery.data}
      isLoading={salesQuery.isLoading}
      monthLabel={monthLabel}
    />
  );
}

function AdminSalesPerformanceCards({
  compact,
  selectedSalesPersonId,
}: {
  compact?: boolean;
  selectedSalesPersonId: string;
}) {
  const saleMonth = getCurrentSaleMonth();
  const performanceQuery = useSalesPersonStockSales(
    {
      period: "month",
      saleMonth,
      salesPersonId: selectedSalesPersonId,
    },
    {
      enabled: Boolean(selectedSalesPersonId),
    },
  );
  const monthLabel = formatSaleMonthLabel(
    performanceQuery.data?.period ?? saleMonth,
  ).split(" ")[0];

  if (!selectedSalesPersonId) {
    return (
      <div className="flex min-h-80 items-center justify-center rounded-lg border border-dashed border-border/70 bg-card p-8 text-center text-sm text-muted-foreground">
        Select a salesperson from the leaderboard.
      </div>
    );
  }

  if (performanceQuery.isError) {
    return (
      <div className="rounded-lg border border-border/70 bg-card py-10 text-center text-sm text-muted-foreground">
        Unable to load salesperson performance.
      </div>
    );
  }

  return (
    <SalesPerformanceCards
      analytics={performanceQuery.data}
      compact={compact}
      isLoading={performanceQuery.isLoading}
      monthLabel={monthLabel}
    />
  );
}

function SalespersonCell({ row }: { row: StockSalesAnalyticsBreakdownRow }) {
  const person = row.salesPerson;
  const name = person?.name ?? row.label ?? "Unknown";

  return (
    <div className="flex min-w-[12rem] items-center gap-3">
      <Avatar size="sm">
        {person?.image && <AvatarImage src={person.image} alt={name} />}
        <AvatarFallback className="text-[10px]">
          {getInitials({
            id: person?.id ?? row.label ?? name,
            name,
            image: person?.image ?? null,
          })}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate font-medium text-foreground">{name}</p>
      </div>
    </div>
  );
}

function SalesLeaderboardCard({
  className,
  highlightCurrentUser = true,
  onSelectedSalesPersonChange,
  selectedSalesPersonId,
  title = "Sales Leaderboard",
}: {
  className?: string;
  highlightCurrentUser?: boolean;
  onSelectedSalesPersonChange?: (row: StockSalesLeaderboardRow) => void;
  selectedSalesPersonId?: string;
  title?: string;
}) {
  const saleMonth = getCurrentSaleMonth();
  const leaderboardQuery = useStockSalesLeaderboard({
    period: "month",
    saleMonth,
  });
  const mySalesQuery = useMyStockSales(
    {
      period: "month",
      saleMonth,
    },
    {
      enabled: highlightCurrentUser,
    },
  );
  const leaderboard = leaderboardQuery.data?.leaderboard ?? [];
  const currentSalesPersonId = highlightCurrentUser
    ? mySalesQuery.data?.salesPerson.id
    : undefined;
  const periodLabel = getLeaderboardPeriodLabel(
    leaderboardQuery.data?.period ?? saleMonth,
  );

  useEffect(() => {
    if (
      selectedSalesPersonId ||
      leaderboardQuery.isLoading ||
      leaderboard.length === 0
    ) {
      return;
    }

    onSelectedSalesPersonChange?.(leaderboard[0]);
  }, [
    leaderboard,
    leaderboardQuery.isLoading,
    onSelectedSalesPersonChange,
    selectedSalesPersonId,
  ]);

  return (
    <section
      className={cn(
        "flex max-w-md flex-col overflow-hidden rounded-lg border border-border/70 bg-card pb-2",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4 px-4 pt-4">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold uppercase tracking-normal text-foreground">
            {title}
          </h2>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {periodLabel}
          </p>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto p-3">
        {leaderboardQuery.isLoading &&
          SALES_LEADERBOARD_SKELETON_ROWS.map((row) => (
            <Skeleton className="h-12 w-full rounded-md" key={row} />
          ))}

        {leaderboardQuery.isError && (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Unable to load leaderboard.
          </div>
        )}

        {!leaderboardQuery.isLoading &&
          !leaderboardQuery.isError &&
          leaderboard.length === 0 && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No sales data found this month.
            </div>
          )}

        {!leaderboardQuery.isLoading &&
          !leaderboardQuery.isError &&
          leaderboard.length > 0 && (
            <Table className="border-separate border-spacing-y-1">
              <TableHeader>
                <TableRow className="border-0 hover:bg-transparent">
                  <TableHead className="h-8 w-12 px-3 text-xs text-muted-foreground">
                    Rank
                  </TableHead>
                  <TableHead className="h-8 px-3 text-xs text-muted-foreground">
                    Name
                  </TableHead>
                  <TableHead className="h-8 w-28 px-3 text-right text-xs text-muted-foreground">
                    Products Sold
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboard.map((row) => {
                  const person = row.salesPerson;
                  const name = person.name ?? "Unknown";
                  const isLeader = row.rank === 1 && row.totalProductsSold > 0;
                  const isSelected = person.id === selectedSalesPersonId;
                  const isCurrentPerson =
                    Boolean(currentSalesPersonId) &&
                    person.id === currentSalesPersonId;
                  const rowHighlightClass = isSelected
                    ? "border-sky-500/45 bg-sky-500/15 text-sky-800 shadow-[inset_3px_0_0_rgb(14_165_233)] dark:bg-sky-500/20 dark:text-sky-100"
                    : isLeader
                      ? isCurrentPerson
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 shadow-[inset_3px_0_0_rgb(16_185_129)] dark:bg-emerald-500/15 dark:text-emerald-200"
                        : "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                      : isCurrentPerson
                        ? "border-sky-500/35 bg-sky-500/10 text-sky-800 shadow-[inset_3px_0_0_rgb(14_165_233)] dark:bg-sky-500/15 dark:text-sky-200"
                        : "border-transparent text-muted-foreground";

                  return (
                    <TableRow
                      tabIndex={0}
                      onClick={() => onSelectedSalesPersonChange?.(row)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          onSelectedSalesPersonChange?.(row);
                        }
                      }}
                      className={cn(
                        "cursor-pointer border transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                        rowHighlightClass,
                      )}
                      key={person.id}
                      aria-selected={isSelected}
                    >
                      <TableCell className="h-12 rounded-l-md px-3 py-2">
                        <span className="flex justify-center text-sm font-medium tabular-nums">
                          {isLeader ? (
                            <span className="flex h-8 w-8 items-center justify-center rounded-md border border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300">
                              <Award className="h-4 w-4" />
                            </span>
                          ) : (
                            row.rank
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="min-w-0 px-3 py-2">
                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar>
                            {person.image && (
                              <AvatarImage src={person.image} alt={name} />
                            )}
                            <AvatarFallback className="text-xs">
                              {getInitials({
                                id: person.id,
                                name,
                                image: person.image,
                              })}
                            </AvatarFallback>
                          </Avatar>
                          <span
                            className={cn(
                              "truncate text-sm",
                              isLeader || isCurrentPerson || isSelected
                                ? "font-medium text-foreground"
                                : "text-foreground",
                            )}
                          >
                            {name}
                          </span>
                          {(isLeader || isCurrentPerson || isSelected) && (
                            <Badge
                              variant="secondary"
                              className={cn(
                                "h-5 shrink-0 rounded-md px-1.5 text-[10px] font-medium",
                                isSelected
                                  ? "bg-sky-500/15 text-sky-700 dark:text-sky-200"
                                  : isLeader
                                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                    : "bg-sky-500/15 text-sky-700 dark:text-sky-300",
                              )}
                            >
                              {isSelected
                                ? "Selected"
                                : isLeader && isCurrentPerson
                                  ? "Top · You"
                                  : isLeader
                                    ? "Top"
                                    : "You"}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="rounded-r-md px-3 py-2 text-right text-sm font-medium tabular-nums text-muted-foreground">
                        {row.totalProductsSold.toLocaleString("en-IN")}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
      </div>
    </section>
  );
}

function RevenueShareCell({ value }: { value: string }) {
  const share = Math.max(0, Math.min(100, Number(value) || 0));

  return (
    <div className="min-w-[10rem] space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <span className="font-medium tabular-nums">{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-emerald-600"
          style={{ width: `${share}%` }}
        />
      </div>
    </div>
  );
}

function StockSalesAnalyticsSection({
  isActivityOpen,
}: {
  isActivityOpen: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectedSalesPersonId, setSelectedSalesPersonId] = useState("");
  const period = getSalesAnalyticsPeriod(
    new URLSearchParams(searchParams.toString()),
  );
  const { month, year, saleMonth } = getSaleMonthFromSearchParams(
    new URLSearchParams(searchParams.toString()),
  );
  const yearOptions = useMemo(() => getSaleYearOptions(year), [year]);
  const analyticsQuery = useStockSalesAnalytics(
    period === "allTime" ? { period } : { period, saleMonth },
  );
  const analytics = analyticsQuery.data;
  const salesBreakdown = analytics?.salesBreakdown ?? [];
  const isAllTime = period === "allTime";
  const updateSalesAnalyticsParams = useCallback(
    (nextValues: {
      month?: string;
      period?: StockSalesAnalyticsPeriod;
      year?: string;
    }) => {
      const nextParams = new URLSearchParams(searchParams.toString());
      const nextPeriod =
        nextValues.year === "allTime"
          ? "allTime"
          : (nextValues.period ?? period);

      nextParams.set("tab", "sales-analytics");
      nextParams.delete("period");

      if (nextPeriod === "month") {
        nextParams.set("month", nextValues.month ?? month);
        nextParams.set("year", nextValues.year ?? year);
      } else {
        nextParams.delete("month");
        nextParams.set("year", "allTime");
      }

      router.replace(`${pathname}?${nextParams.toString()}`, {
        scroll: false,
      });
    },
    [month, pathname, period, router, searchParams, year],
  );
  const updateSaleMonthParams = useCallback(
    (nextValues: { month?: string; year?: string }) => {
      updateSalesAnalyticsParams({ ...nextValues, period: "month" });
    },
    [updateSalesAnalyticsParams],
  );
  const handleSelectedSalesPersonChange = useCallback(
    (row: StockSalesLeaderboardRow) => {
      setSelectedSalesPersonId(row.salesPerson.id);
    },
    [],
  );
  const cards: MetricCardData[] = [
    {
      label: "Sales People",
      value: analytics ? String(analytics.summary.totalSalesPeople) : "-",
    },
    {
      label: "Transactions",
      value: analytics ? String(analytics.summary.totalTransactions) : "-",
    },
    {
      label: "Revenue",
      value: analytics
        ? formatAnalyticsCurrency(analytics.summary.totalRevenue)
        : "-",
    },
    ...(isAllTime
      ? []
      : [
          {
            label: "Payable Incentive",
            value: analytics
              ? formatAnalyticsCurrency(analytics.summary.totalPayableIncentive)
              : "-",
          },
        ]),
  ];

  return (
    <section className="space-y-5 pb-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground">
            Sales Analytics
          </h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            {getAnalyticsTitle(period, saleMonth)}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {period === "month" && (
            <Select
              value={month}
              onValueChange={(value) => updateSaleMonthParams({ month: value })}
            >
              <SelectTrigger aria-label="Sale month" className="w-full sm:w-40">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {SALE_MONTH_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select
            value={period === "allTime" ? "allTime" : year}
            onValueChange={(value) =>
              updateSalesAnalyticsParams({
                period: value === "allTime" ? "allTime" : "month",
                year: value,
              })
            }
          >
            <SelectTrigger aria-label="Sale year" className="w-full sm:w-32">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="allTime">All Time</SelectItem>
              {yearOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <MetricsGrid>
        {analyticsQuery.isLoading
          ? cards.map((card) => (
              <div
                className="border-border/70 px-5 py-4 max-sm:border-b sm:border-r sm:last:border-r-0"
                key={card.label}
              >
                <Skeleton className="h-4 w-28" />
                <Skeleton className="mt-3 h-7 w-24" />
              </div>
            ))
          : cards.map((card) => <MetricCard key={card.label} card={card} />)}
      </MetricsGrid>

      <div className="space-y-5">
        <div className="overflow-hidden rounded-lg border border-border/70 bg-card">
          {analyticsQuery.isLoading && (
            <div className="space-y-3 p-4">
              {ANALYTICS_TABLE_SKELETON_ROWS.map((row) => (
                <Skeleton className="h-12 w-full" key={row} />
              ))}
            </div>
          )}

          {analyticsQuery.isError && (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Unable to load sales analytics.
            </div>
          )}

          {analytics && salesBreakdown.length === 0 && (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No sales data found for this period.
            </div>
          )}

          {analytics && salesBreakdown.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Salesperson</TableHead>
                  <TableHead className="text-right">Transactions</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Target</TableHead>
                  <TableHead>Revenue Share</TableHead>
                  {!isAllTime && (
                    <TableHead className="text-right">Incentive</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesBreakdown.map((row) => {
                  const targetProgress = getTargetProgress(
                    row.revenue,
                    row.target,
                  );

                  return (
                    <TableRow
                      key={row.salesPerson?.id ?? row.label ?? row.rank}
                    >
                      <TableCell>
                        <SalespersonCell row={row} />
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {row.transactions}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatAnalyticsCurrency(row.revenue)}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.target ? (
                          <>
                            <div className="font-medium tabular-nums">
                              {formatAnalyticsCurrency(row.target)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {targetProgress?.displayProgress ?? 0}% achieved
                            </div>
                          </>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            -
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <RevenueShareCell value={row.revenueShare} />
                      </TableCell>
                      {!isAllTime && (
                        <TableCell className="text-right">
                          {row.incentive ? (
                            <>
                              <div className="font-medium tabular-nums">
                                {formatAnalyticsCurrency(
                                  row.incentive.payableAmount,
                                )}{" "}
                                payable
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {formatAnalyticsCurrency(
                                  row.incentive.earnedAmount,
                                )}{" "}
                                earned - {row.incentive.multiplier}x
                              </div>
                            </>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              -
                            </span>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>

        <div
          className={cn(
            "grid gap-5 xl:items-start",
            isActivityOpen
              ? "grid-cols-1"
              : "xl:grid-cols-[minmax(22rem,0.9fr)_minmax(0,1.35fr)]",
          )}
        >
          <SalesLeaderboardCard
            className="max-w-none"
            highlightCurrentUser={false}
            onSelectedSalesPersonChange={handleSelectedSalesPersonChange}
            selectedSalesPersonId={selectedSalesPersonId}
            title={`Sales Leaderboard for ${formatSaleMonthLabel(getCurrentSaleMonth())}`}
          />
          <AdminSalesPerformanceCards
            compact={isActivityOpen}
            selectedSalesPersonId={selectedSalesPersonId}
          />
        </div>
      </div>
    </section>
  );
}

export function AdminDashboard({
  analytics,
  analyticsError,
  analyticsLoading,
  onRetryAnalytics,
}: AnalyticsDashboardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isActivityOpen = useActivitySidebar((state) => state.isOpen);
  const openActivity = useActivitySidebar((state) => state.open);
  const closeActivity = useActivitySidebar((state) => state.close);
  const activeTab = getAdminDashboardTab(
    new URLSearchParams(searchParams.toString()),
  );
  const handleTabChange = useCallback(
    (tab: string) => {
      const nextTab = ADMIN_DASHBOARD_TABS.has(tab as AdminDashboardTab)
        ? (tab as AdminDashboardTab)
        : "orders-enquiries";
      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.set("tab", nextTab);
      if (nextTab === "sales-analytics") {
        closeActivity();
      } else {
        openActivity();
      }
      router.replace(`${pathname}?${nextParams.toString()}`, {
        scroll: false,
      });
    },
    [closeActivity, openActivity, pathname, router, searchParams],
  );
  useEffect(() => {
    if (activeTab === "sales-analytics") {
      closeActivity();
      return;
    }

    openActivity();
  }, [activeTab, closeActivity, openActivity]);
  const cards: MetricCardData[] = analytics
    ? [
        {
          label: "Active Orders",
          value: String(analytics.currentSnapshot.activeOrders),
          href: "/orders-workspace?type=order",
          icon: (
            <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          ),
          accent: "bg-blue-500/10 dark:bg-blue-500/10",
        },
        {
          label: "Open Enquiries",
          value: String(analytics.currentSnapshot.openEnquiries),
          href: "/orders-workspace?type=enquiry",
          icon: (
            <MessageSquare className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          ),
          accent: "bg-amber-500/10 dark:bg-amber-500/10",
        },
        {
          label: "Orders Created",
          value: String(analytics.periodActivity.ordersCreated),
          helper: formatAnalyticsPeriod(analytics.period),
          icon: (
            <Award className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          ),
          accent: "bg-emerald-500/10 dark:bg-emerald-500/10",
        },
        {
          label: "Enquiry to Order",
          value: `${analytics.periodActivity.conversion.enquiryToOrderRate}%`,
          helper: `${analytics.periodActivity.conversion.enquiriesWithOrders} enquiries converted`,
          icon: (
            <ChartNoAxesColumn className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          ),
          accent: "bg-violet-500/10 dark:bg-violet-500/10",
        },
      ]
    : [];

  return (
    <div
      className={cn(
        "grid gap-5",
        isActivityOpen && "xl:grid-cols-[minmax(0,1fr)_360px]",
      )}
    >
      <div className="space-y-5">
        <div className="flex flex-col">
          <div className="min-w-0">
            <h1 className="min-w-0 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Admin Dashboard
            </h1>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              View analytics and get an overview of your ongoing records.
            </p>
          </div>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="gap-5"
        >
          <TabsList className="h-auto w-full justify-start gap-6 rounded-none border-0 border-b border-border bg-transparent p-0 text-muted-foreground">
            <TabsTrigger
              value="orders-enquiries"
              className="h-11 flex-none rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 shadow-none data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              <ChartNoAxesColumn className="h-4 w-4" />
              Orders & Enquiries
            </TabsTrigger>
            <TabsTrigger
              value="sales-analytics"
              className="h-11 flex-none rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 shadow-none data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              <Users className="h-4 w-4" />
              Sales Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders-enquiries" className="space-y-5">
            {analytics ? (
              <>
                <MetricsGrid>
                  {cards.map((card) => (
                    <MetricCard key={card.label} card={card} />
                  ))}
                </MetricsGrid>
                <AnalyticsCharts analytics={analytics} />
              </>
            ) : (
              <AnalyticsState
                error={analyticsError}
                isLoading={analyticsLoading}
                onRetry={onRetryAnalytics}
              />
            )}
          </TabsContent>

          <TabsContent value="sales-analytics">
            <StockSalesAnalyticsSection isActivityOpen={isActivityOpen} />
          </TabsContent>
        </Tabs>
      </div>

      <RecentActivitiesColumn />
    </div>
  );
}

export function OperationsDashboard({
  analytics,
  analyticsError,
  analyticsLoading,
  onRetryAnalytics,
}: AnalyticsDashboardProps) {
  const isActivityOpen = useActivitySidebar((state) => state.isOpen);

  return (
    <div
      className={cn(
        "grid gap-5",
        isActivityOpen && "xl:grid-cols-[minmax(0,1fr)_360px]",
      )}
    >
      <div className="space-y-5">
        <div className="flex flex-col">
          <div className="min-w-0">
            <h1 className="min-w-0 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Operations Dashboard
            </h1>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Get a bird's-eye view of the ongoing records.
            </p>
          </div>
        </div>
        {analytics ? (
          <>
            <MetricsGrid>
              <MetricCard
                card={{
                  label: "Active Orders",
                  value: String(analytics.currentSnapshot.activeOrders),
                  href: "/orders-workspace?type=order",
                }}
              />
              <MetricCard
                card={{
                  label: "Open Enquiries",
                  value: String(analytics.currentSnapshot.openEnquiries),
                  href: "/orders-workspace?type=enquiry",
                }}
              />
              <MetricCard
                card={{
                  label: "Overdue",
                  value: String(analytics.currentSnapshot.overdueOrders),
                }}
              />
              <MetricCard
                card={{
                  label: "Due Soon",
                  value: String(analytics.currentSnapshot.dueSoonOrders),
                }}
              />
            </MetricsGrid>
            <AnalyticsCharts analytics={analytics} />
          </>
        ) : (
          <AnalyticsState
            error={analyticsError}
            isLoading={analyticsLoading}
            onRetry={onRetryAnalytics}
          />
        )}
      </div>

      <RecentActivitiesColumn />
    </div>
  );
}

export function SalesDashboard({
  activeTab,
  onActiveTabChange,
  analytics,
  analyticsError,
  analyticsLoading,
  onRetryAnalytics,
  orders,
  storeOrders,
  storeLocation,
  storeRecordsLoading,
  storeRecordsError,
}: AnalyticsDashboardProps & {
  activeTab: SalesTab;
  onActiveTabChange: (tab: SalesTab) => void;
  orders: Order[];
  storeOrders: Order[];
  storeLocation: { name: string; city: string } | null;
  storeRecordsLoading: boolean;
  storeRecordsError: Error | null;
}) {
  const data = useMemo(() => {
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
    return {
      openOrders,
      openEnquiries,
      openStoreOrders: storeOrders.filter((order) => order.type === "order"),
      openStoreEnquiries: storeOrders.filter(
        (order) => order.type === "enquiry",
      ),
    };
  }, [orders, storeOrders]);

  const salesTabs = [
    {
      key: "orders" as const,
      label: "Open Orders",
      count: data.openOrders.length,
      icon: Package,
    },
    {
      key: "enquiries" as const,
      label: "Open Enquiries",
      count: data.openEnquiries.length,
      icon: MessageSquare,
    },
    ...(storeLocation
      ? [
          {
            key: "store-orders" as const,
            label: "Store Orders",
            count: data.openStoreOrders.length,
            icon: Store,
          },
          {
            key: "store-enquiries" as const,
            label: "Store Enquiries",
            count: data.openStoreEnquiries.length,
            icon: MessageSquare,
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-5 pb-5 sm:pb-6">
      <div className="flex flex-col">
        <h1 className="min-w-0 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          Sales Dashboard
        </h1>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          Keep on eye on your customer and sales pipeline.
        </p>
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(22rem,2fr)] lg:items-stretch">
        <div className="space-y-5">
          {analytics ? (
            <MetricsGrid className="xl:grid-cols-2">
              <MetricCard
                card={{
                  label: "Active Orders",
                  value: String(analytics.currentSnapshot.activeOrders),
                  href: "/orders-workspace?type=order",
                }}
              />
              <MetricCard
                card={{
                  label: "Open Enquiries",
                  value: String(analytics.currentSnapshot.openEnquiries),
                  href: "/orders-workspace?type=enquiry",
                }}
              />
              <MetricCard
                card={{
                  label: "Overdue",
                  value: String(analytics.currentSnapshot.overdueOrders),
                }}
              />
              <MetricCard
                card={{
                  label: "Enquiry to Order",
                  value: `${analytics.periodActivity.conversion.enquiryToOrderRate}%`,
                  helper: formatAnalyticsPeriod(analytics.period),
                }}
              />
            </MetricsGrid>
          ) : (
            <AnalyticsState
              error={analyticsError}
              isLoading={analyticsLoading}
              onRetry={onRetryAnalytics}
            />
          )}

          <MySalesAnalyticsCards />
        </div>

        <SalesLeaderboardCard className="w-full max-w-none" />
      </div>

      {analytics && <AnalyticsCharts analytics={analytics} />}

      <div>
        <div className="-mx-4 flex items-center gap-1 overflow-x-auto border-b border-border px-4 scrollbar-none sm:mx-0 sm:px-0">
          {salesTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onActiveTabChange(tab.key)}
                aria-pressed={activeTab === tab.key}
                className={cn(
                  "flex min-h-11 shrink-0 cursor-pointer items-center gap-1.5 border-b-2 px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                  activeTab === tab.key
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
                  {tab.count}
                </span>
              </button>
            );
          })}
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
          {(activeTab === "store-orders" || activeTab === "store-enquiries") &&
          storeRecordsLoading ? (
            <div className="space-y-3 p-4" aria-live="polite">
              <span className="sr-only">Loading store records</span>
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : null}
          {(activeTab === "store-orders" || activeTab === "store-enquiries") &&
          storeRecordsError ? (
            <div className="px-5 py-8 text-center">
              <p className="text-sm font-medium text-foreground">
                Store records could not be loaded.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {storeRecordsError.message}
              </p>
            </div>
          ) : null}
          {activeTab === "store-orders" &&
            !storeRecordsLoading &&
            !storeRecordsError &&
            (data.openStoreOrders.length > 0 ? (
              data.openStoreOrders.map((order) => (
                <RecordRow key={order.id} order={order} />
              ))
            ) : (
              <EmptyRows
                title="No open store orders"
                description={`There are no open orders for ${storeLocation?.name ?? "your store"}.`}
              />
            ))}
          {activeTab === "store-enquiries" &&
            !storeRecordsLoading &&
            !storeRecordsError &&
            (data.openStoreEnquiries.length > 0 ? (
              data.openStoreEnquiries.map((order) => (
                <EnquiryCard key={order.id} order={order} />
              ))
            ) : (
              <EmptyRows
                title="No open store enquiries"
                description={`There are no open enquiries for ${storeLocation?.name ?? "your store"}.`}
              />
            ))}
        </div>
      </div>
    </div>
  );
}
