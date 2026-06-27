"use client";

import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Award,
  ChartNoAxesColumn,
  Inbox,
  IndianRupee,
  MessageSquare,
  Package,
  Users,
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
import { Input } from "@/components/ui/input";
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
import { useStockSalesAnalytics } from "@/hooks/useStockSales";
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
import type {
  StockSalesAnalyticsLeaderboardRow,
  StockSalesAnalyticsPeriod,
} from "@/types/stock-sales-api";
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

function buildUrgencyData(urgency: Record<UrgencyLevel, number>): ChartDatum[] {
  return (Object.keys(URGENCY_COLORS) as UrgencyLevel[]).map((level) => ({
    label: URGENCY_LABELS[level],
    value: urgency[level],
    color: URGENCY_COLORS[level],
  }));
}

function buildStatusData(status: {
  open: number;
  converted: number;
  closed: number;
}): ChartDatum[] {
  return [
    { label: "Open", value: status.open, color: "oklch(0.55 0.13 178)" },
    { label: "Converted", value: status.converted, color: "oklch(0.68 0.19 46)" },
    { label: "Closed", value: status.closed, color: "oklch(0.38 0.09 225)" },
  ];
}

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
          title="Status breakdown"
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
  const urgency: Record<UrgencyLevel, number> = {
    overdue: 0,
    "due-soon": 0,
    "on-track": 0,
    none: 0,
  };
  for (const order of allOrders) {
    urgency[getUrgencyLevel(order.deliveryDate)] += 1;
  }
  const status = {
    open: openEnquiries.length,
    converted: allOrders.filter((order) => order.sourceEnquiryId).length,
    closed: closedEnquiries.length,
  };

  return {
    allOrders,
    openEnquiries,
    closedEnquiries,
    revenue,
    averageOrderValue,
    stageCounts,
    urgency,
    status,
    riskItems: getRiskItems(orders),
  };
}

function getCurrentSaleMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
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

function formatAnalyticsCurrency(value: string) {
  return formatCurrency(Number(value) || 0);
}

function getAnalyticsPeriodTitle(
  period: StockSalesAnalyticsPeriod,
  saleMonth: string,
) {
  return `Sales Analytics for ${
    period === "allTime" ? "All Time" : formatSaleMonthLabel(saleMonth)
  }`;
}

function SalespersonCell({
  row,
}: {
  row: StockSalesAnalyticsLeaderboardRow;
}) {
  const person = row.salesPerson;
  const name = person.name ?? "Unknown";

  return (
    <div className="flex min-w-[12rem] items-center gap-3">
      <Avatar size="sm">
        {person.image && <AvatarImage src={person.image} alt={name} />}
        <AvatarFallback className="text-[10px]">
          {getInitials({ id: person.id, name, image: person.image })}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate font-medium text-foreground">{name}</p>
        <p className="truncate text-xs text-muted-foreground">{person.id}</p>
      </div>
    </div>
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

  const status = {
    open: openEnquiries.length,
    converted: activeOrders.filter((order) => order.sourceEnquiryId).length,
    closed: 0,
  };

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
    urgency,
    status,
    riskItems: getRiskItems(activeRecords),
  };
}

function StockSalesAnalyticsSection() {
  const [period, setPeriod] = useState<StockSalesAnalyticsPeriod>("month");
  const [saleMonth, setSaleMonth] = useState(getCurrentSaleMonth);
  const analyticsQuery = useStockSalesAnalytics(
    period === "allTime" ? { period } : { period, saleMonth },
  );
  const analytics = analyticsQuery.data;
  const isAllTime = period === "allTime";
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
            label: "Incentive",
            value: analytics
              ? formatAnalyticsCurrency(analytics.summary.totalIncentive)
              : "-",
          },
        ]),
  ];

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground">
            Sales Analytics
          </h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            {getAnalyticsPeriodTitle(period, saleMonth)}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select
            value={period}
            onValueChange={(value) =>
              setPeriod(value as StockSalesAnalyticsPeriod)
            }
          >
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="allTime">All Time</SelectItem>
            </SelectContent>
          </Select>
          {period === "month" && (
            <Input
              aria-label="Sale month"
              className="w-full sm:w-40"
              type="month"
              value={saleMonth}
              onChange={(event) => setSaleMonth(event.target.value)}
            />
          )}
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

      <Panel
        title="Salesperson Leaderboard"
        action={
          analytics && (
            <span className="text-xs text-muted-foreground">
              {analytics.period}
            </span>
          )
        }
      >
        <div className="overflow-hidden rounded-lg border border-border/70 bg-card">
          {analyticsQuery.isLoading && (
            <div className="space-y-3 p-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton className="h-12 w-full" key={index} />
              ))}
            </div>
          )}

          {analyticsQuery.isError && (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Unable to load sales analytics.
            </div>
          )}

          {analytics && analytics.leaderboard.length === 0 && (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No sales data found for this period.
            </div>
          )}

          {analytics && analytics.leaderboard.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Rank</TableHead>
                  <TableHead>Salesperson</TableHead>
                  <TableHead className="text-right">Transactions</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead>Revenue Share</TableHead>
                  {!isAllTime && (
                    <TableHead className="text-right">Incentive</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.leaderboard.map((row) => (
                  <TableRow key={row.salesPerson.id}>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold",
                          row.rank === 1
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {row.rank === 1 ? (
                          <Award className="h-4 w-4" />
                        ) : (
                          row.rank
                        )}
                      </span>
                    </TableCell>
                    <TableCell>
                      <SalespersonCell row={row} />
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {row.transactions}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatAnalyticsCurrency(row.revenue)}
                    </TableCell>
                    <TableCell>
                      <RevenueShareCell value={row.revenueShare} />
                    </TableCell>
                    {!isAllTime && (
                      <TableCell className="text-right">
                        <div className="font-medium tabular-nums">
                          {formatAnalyticsCurrency(row.incentive.amount)}
                        </div>
                        <div
                          className={cn(
                            "text-xs",
                            row.incentive.eligible
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-muted-foreground",
                          )}
                        >
                          {row.incentive.eligible
                            ? "Eligible"
                            : "Not eligible"}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </Panel>
    </section>
  );
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

        <Tabs defaultValue="orders-enquiries" className="gap-5">
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

            <StageAndBreakdownCharts
              stageTitle="Orders by stage"
              stageCounts={analytics.stageCounts}
              urgencyData={buildUrgencyData(analytics.urgency)}
              statusData={buildStatusData(analytics.status)}
            />
          </TabsContent>

          <TabsContent value="sales-analytics">
            <StockSalesAnalyticsSection />
          </TabsContent>
        </Tabs>
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

        <StageAndBreakdownCharts
          stageTitle="Records by stage"
          stageCounts={analytics.stageCounts}
          urgencyData={buildUrgencyData(analytics.urgency)}
          statusData={buildStatusData(analytics.status)}
        />
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
