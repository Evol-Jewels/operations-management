"use client";

import Link from "next/link";
import {
  Bar,
  EvilBarChart,
  Legend as EvilBarLegend,
  Tooltip as EvilBarTooltip,
  Grid,
  XAxis,
  YAxis,
} from "@/components/evilcharts/charts/bar-chart";
import type { ChartConfig } from "@/components/evilcharts/ui/chart";
import {
  type DistributionSegment,
  formatAnalyticsPeriod,
  formatTrendDate,
  getFunnelSegments,
  getStageCounts,
  getUrgencySegments,
  type StageCount,
} from "@/lib/ordersAnalytics";
import { cn } from "@/lib/utils";
import type { OrdersEnquiriesAnalyticsResponse } from "@/types/orders-enquiries-analytics-api";
import { Panel } from "./DashboardPrimitives";

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

function getShare(value: number, total: number) {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

function StageBars({ stages }: { stages: StageCount[] }) {
  const max = Math.max(...stages.map((stage) => stage.value), 1);

  if (stages.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No active orders right now.
      </p>
    );
  }

  return (
    <ul className="-mx-2 space-y-0.5">
      {stages.map((stage) => (
        <li key={stage.label}>
          <Link
            href={stage.href}
            className="group grid min-h-10 grid-cols-[minmax(6rem,8.5rem)_minmax(0,1fr)_2rem] items-center gap-3 rounded-md px-2 py-1 sm:min-h-9 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            <span className="truncate text-sm text-muted-foreground transition-colors group-hover:text-foreground">
              {stage.label}
            </span>
            <span className="h-2 overflow-hidden rounded-full bg-muted">
              <span
                className="block h-full rounded-full bg-emerald-600 dark:bg-emerald-500"
                style={{
                  width: `${stage.value > 0 ? Math.max((stage.value / max) * 100, 2) : 0}%`,
                }}
              />
            </span>
            <span className="text-right text-sm font-medium tabular-nums text-foreground">
              {stage.value}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Distribution({
  segments,
  totalLabel,
}: {
  segments: DistributionSegment[];
  totalLabel: string;
}) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);

  return (
    <div className="@container">
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">
          {total}
        </span>
        <span className="text-xs text-muted-foreground">{totalLabel}</span>
      </div>

      <div
        className="mt-3 flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-muted"
        aria-hidden="true"
      >
        {segments
          .filter((segment) => segment.value > 0)
          .map((segment) => (
            <div
              key={segment.label}
              className={cn("h-full", segment.className)}
              style={{ flex: `${segment.value} 1 0%` }}
            />
          ))}
      </div>

      <ul className="mt-4 grid gap-x-6 gap-y-2 @sm:grid-cols-2">
        {segments.map((segment) => (
          <li key={segment.label} className="flex items-center gap-2 text-sm">
            <span
              className={cn(
                "size-2.5 shrink-0 rounded-full",
                segment.className,
              )}
            />
            <span className="min-w-0 flex-1 truncate text-muted-foreground">
              {segment.label}
            </span>
            <span className="font-medium tabular-nums text-foreground">
              {segment.value}
            </span>
            <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">
              {getShare(segment.value, total)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
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
      className="h-52 w-full sm:h-64"
      barRadius={3}
      chartProps={{ margin: { top: 4, right: 4, bottom: 0, left: -20 } }}
    >
      <Grid vertical={false} />
      <XAxis dataKey="label" minTickGap={32} />
      <YAxis allowDecimals={false} />
      <EvilBarTooltip variant="frosted-glass" />
      <EvilBarLegend variant="circle" align="right" isClickable />
      <Bar dataKey="enquiriesCreated" enableHoverHighlight />
      <Bar dataKey="ordersCreated" enableHoverHighlight />
    </EvilBarChart>
  );
}

export function OrdersAnalyticsCharts({
  analytics,
}: {
  analytics: OrdersEnquiriesAnalyticsResponse;
}) {
  const { currentSnapshot, periodActivity } = analytics;
  const periodLabel = formatAnalyticsPeriod(analytics.period);

  return (
    <div className="@container">
      <div className="grid gap-4 @2xl:grid-cols-5">
        <Panel
          title="Orders by stage"
          description="Open the stage to see its orders"
          className="@2xl:col-span-3"
        >
          <StageBars stages={getStageCounts(currentSnapshot.orderStages)} />
        </Panel>

        <div className="grid gap-4 @md:grid-cols-2 @2xl:col-span-2 @2xl:grid-cols-1">
          <Panel
            title="Delivery urgency"
            description="Active orders by delivery date"
          >
            <Distribution
              segments={getUrgencySegments(currentSnapshot)}
              totalLabel="active orders"
            />
          </Panel>
          <Panel title="Enquiry funnel" description={`Created ${periodLabel}`}>
            <Distribution
              segments={getFunnelSegments(periodActivity.enquiryFunnel)}
              totalLabel="enquiries"
            />
          </Panel>
        </div>

        <Panel
          title="Orders and enquiries created"
          description={`Daily, ${periodLabel}`}
          className="@2xl:col-span-5"
        >
          <ActivityTrendChart trends={periodActivity.trends} />
        </Panel>
      </div>
    </div>
  );
}
