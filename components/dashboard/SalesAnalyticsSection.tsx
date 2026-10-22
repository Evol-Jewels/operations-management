"use client";

import { BadgeCheck, IndianRupee, Receipt, Target, Trophy } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useStockSalesAnalytics } from "@/hooks/useStockSales";
import { getInitials } from "@/lib/people";
import {
  formatSalesCurrency,
  getSaleMonthFromSearchParams,
  getSaleYearOptions,
  getSalesAnalyticsQuery,
  getSalesAnalyticsView,
  getSalesAnalyticsViewLabel,
  getTargetProgress,
  type SalesAnalyticsView,
} from "@/lib/salesAnalytics";
import { cn } from "@/lib/utils";
import type {
  StockSalesAnalyticsBreakdownRow,
  StockSalesAnalyticsResponse,
  StockSalesLeaderboardRow,
} from "@/types/stock-sales-api";
import {
  type MetricCardData,
  MetricCard,
  MetricCardSkeleton,
  MetricsGrid,
  Panel,
} from "./DashboardPrimitives";
import { SalesAnalyticsDateFilter } from "./SalesAnalyticsDateFilter";
import { SalesLeaderboardCard } from "./SalesLeaderboardCard";
import { SalesPersonPerformanceCard } from "./SalesPerformanceCard";

const TABLE_SKELETON_ROWS = ["first", "second", "third", "fourth"] as const;

function getSummaryCards(
  analytics: StockSalesAnalyticsResponse,
  isAllTime: boolean,
): MetricCardData[] {
  const { summary, salesBreakdown } = analytics;
  const revenue = Number(summary.totalRevenue) || 0;
  const withTarget = salesBreakdown.filter((row) =>
    getTargetProgress(row.revenue, row.target),
  );
  const targetsMet = withTarget.filter(
    (row) => (getTargetProgress(row.revenue, row.target)?.percent ?? 0) >= 100,
  ).length;
  const topSeller = salesBreakdown.find((row) => Number(row.revenue) > 0);

  return [
    {
      label: "Revenue",
      value: formatSalesCurrency(revenue),
      helper:
        summary.totalTransactions > 0
          ? `Avg ${formatSalesCurrency(revenue / summary.totalTransactions)} per sale`
          : "No sales yet",
      icon: IndianRupee,
      tone: "emerald",
    },
    {
      label: "Transactions",
      value: summary.totalTransactions.toLocaleString("en-IN"),
      helper: `${summary.totalSalesPeople} salespeople`,
      icon: Receipt,
      tone: "blue",
    },
    isAllTime
      ? {
          label: "Top seller",
          value: topSeller?.salesPerson?.name ?? topSeller?.label ?? "–",
          helper: topSeller
            ? formatSalesCurrency(topSeller.revenue)
            : "No sales yet",
          icon: Trophy,
          tone: "amber",
        }
      : {
          label: "Targets met",
          value: withTarget.length
            ? `${targetsMet} of ${withTarget.length}`
            : "–",
          helper: withTarget.length
            ? "Salespeople at 100% or more"
            : "No targets set",
          icon: Target,
          tone: "violet",
        },
    ...(isAllTime
      ? []
      : [
          {
            label: "Payable incentive",
            value: formatSalesCurrency(summary.totalPayableIncentive),
            helper: `${formatSalesCurrency(summary.totalEarnedIncentive)} earned`,
            icon: BadgeCheck,
            tone: "amber" as const,
          },
        ]),
  ];
}

function SalespersonCell({ row }: { row: StockSalesAnalyticsBreakdownRow }) {
  const person = row.salesPerson;
  const name = person?.name ?? row.label ?? "Unknown";

  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="w-5 text-right text-xs tabular-nums text-muted-foreground">
        {row.rank}
      </span>
      <Avatar size="sm">
        {person?.image && <AvatarImage src={person.image} alt={name} />}
        <AvatarFallback className="text-[10px]">
          {getInitials({
            id: person?.id ?? name,
            name,
            image: person?.image ?? null,
          })}
        </AvatarFallback>
      </Avatar>
      <span className="truncate font-medium text-foreground">{name}</span>
    </div>
  );
}

function TargetCell({
  row,
  className = "w-44",
}: {
  row: StockSalesAnalyticsBreakdownRow;
  className?: string;
}) {
  const progress = getTargetProgress(row.revenue, row.target);

  if (!progress || !row.target) {
    return <span className="text-sm text-muted-foreground">No target</span>;
  }

  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span
          className={cn(
            "font-semibold tabular-nums",
            progress.percent >= 100
              ? "text-emerald-700 dark:text-emerald-400"
              : "text-foreground",
          )}
        >
          {progress.percent}%
        </span>
        <span className="truncate text-muted-foreground">
          of {formatSalesCurrency(row.target)}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full",
            progress.percent >= 100 ? "bg-emerald-500" : "bg-sky-500",
          )}
          style={{ width: `${progress.fill}%` }}
        />
      </div>
    </div>
  );
}

function SalesBreakdownList({
  rows,
  isAllTime,
  selectedSalesPersonId,
  onSelect,
}: {
  rows: StockSalesAnalyticsBreakdownRow[];
  isAllTime: boolean;
  selectedSalesPersonId: string;
  onSelect: (salesPersonId: string) => void;
}) {
  return (
    <ul className="grid grid-cols-1 divide-y divide-border/70 sm:grid-cols-2 sm:divide-y-0">
      {rows.map((row) => {
        const salesPersonId = row.salesPerson?.id;
        const isSelected =
          Boolean(salesPersonId) && salesPersonId === selectedSalesPersonId;
        const meta = [
          `${row.transactions} sales`,
          `${row.revenueShare}% share`,
          !isAllTime && row.incentive
            ? `${formatSalesCurrency(row.incentive.payableAmount)} incentive`
            : null,
        ].filter(Boolean);

        return (
          <li
            key={salesPersonId ?? row.label ?? row.rank}
            className="border-border/70 sm:border-b sm:odd:border-r"
          >
            <button
              type="button"
              disabled={!salesPersonId}
              aria-pressed={isSelected}
              onClick={() => salesPersonId && onSelect(salesPersonId)}
              className={cn(
                "w-full space-y-2 px-4 py-3 text-left transition-colors focus-visible:bg-muted/50 focus-visible:outline-none",
                isSelected ? "bg-muted/60" : "hover:bg-muted/40",
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <SalespersonCell row={row} />
                <span className="shrink-0 font-semibold tabular-nums text-foreground">
                  {formatSalesCurrency(row.revenue)}
                </span>
              </div>
              <div className="pl-8">
                <TargetCell row={row} className="w-full" />
                <p className="mt-1.5 truncate text-xs text-muted-foreground">
                  {meta.join(" · ")}
                </p>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function SalesBreakdownTable({
  rows,
  isAllTime,
  selectedSalesPersonId,
  onSelect,
}: {
  rows: StockSalesAnalyticsBreakdownRow[];
  isAllTime: boolean;
  selectedSalesPersonId: string;
  onSelect: (salesPersonId: string) => void;
}) {
  return (
    <Table className="min-w-[42rem]">
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="pl-4">Salesperson</TableHead>
          <TableHead className="text-right">Revenue</TableHead>
          <TableHead>Target achieved</TableHead>
          <TableHead className="text-right">Transactions</TableHead>
          <TableHead className="text-right">Share</TableHead>
          {!isAllTime && (
            <TableHead className="pr-4 text-right">Incentive</TableHead>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => {
          const salesPersonId = row.salesPerson?.id;
          const isSelected =
            Boolean(salesPersonId) && salesPersonId === selectedSalesPersonId;

          return (
            <TableRow
              key={salesPersonId ?? row.label ?? row.rank}
              data-state={isSelected ? "selected" : undefined}
              tabIndex={salesPersonId ? 0 : undefined}
              onClick={() => salesPersonId && onSelect(salesPersonId)}
              onKeyDown={(event) => {
                if (!salesPersonId) return;
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect(salesPersonId);
                }
              }}
              className={cn(
                salesPersonId &&
                  "cursor-pointer focus-visible:bg-muted/50 focus-visible:outline-none",
              )}
            >
              <TableCell className="max-w-56 py-3 pl-4">
                <SalespersonCell row={row} />
              </TableCell>
              <TableCell className="text-right font-semibold tabular-nums">
                {formatSalesCurrency(row.revenue)}
              </TableCell>
              <TableCell>
                <TargetCell row={row} />
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {row.transactions}
              </TableCell>
              <TableCell className="text-right tabular-nums text-muted-foreground">
                {row.revenueShare}%
              </TableCell>
              {!isAllTime && (
                <TableCell className="pr-4 text-right">
                  {row.incentive ? (
                    <>
                      <div className="font-medium tabular-nums">
                        {formatSalesCurrency(row.incentive.payableAmount)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatSalesCurrency(row.incentive.earnedAmount)} earned
                        · {row.incentive.multiplier}x
                      </div>
                    </>
                  ) : (
                    <span className="text-muted-foreground">–</span>
                  )}
                </TableCell>
              )}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

export function SalesAnalyticsSection() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectedSalesPersonId, setSelectedSalesPersonId] = useState("");
  const currentParams = new URLSearchParams(searchParams.toString());
  const view = getSalesAnalyticsView(currentParams);
  const { month, year, saleMonth } =
    getSaleMonthFromSearchParams(currentParams);
  const yearOptions = useMemo(() => getSaleYearOptions(year), [year]);
  const salesQuery = getSalesAnalyticsQuery(view, { saleMonth, year });
  const analyticsQuery = useStockSalesAnalytics(salesQuery);
  const analytics = analyticsQuery.data;
  const rows = analytics?.salesBreakdown ?? [];
  const isAllTime = view === "allTime";
  const periodLabel = getSalesAnalyticsViewLabel(view, saleMonth);

  const replaceParams = useCallback(
    (update: (params: URLSearchParams) => void) => {
      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.set("tab", "sales-analytics");
      nextParams.delete("period");
      update(nextParams);
      router.replace(`${pathname}?${nextParams.toString()}`, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const handleViewChange = (nextView: SalesAnalyticsView) =>
    replaceParams((params) => {
      params.set("salesRange", nextView);
      params.delete("month");
      params.delete("year");
      if (nextView === "month") params.set("month", month);
      if (nextView === "month" || nextView === "year") params.set("year", year);
    });

  const handleCalendarChange = (next: { month?: string; year?: string }) =>
    replaceParams((params) => {
      const calendarView = view === "year" ? "year" : "month";
      params.set("salesRange", calendarView);
      params.set("year", next.year ?? year);
      if (calendarView === "month") params.set("month", next.month ?? month);
      else params.delete("month");
    });

  const handleLeaderboardSelect = useCallback(
    (row: StockSalesLeaderboardRow) =>
      setSelectedSalesPersonId(row.salesPerson.id),
    [],
  );

  return (
    <section className="space-y-4 pb-6 sm:space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold text-foreground">
            {periodLabel}
          </h2>
          <p className="hidden text-sm text-muted-foreground sm:block">
            Store sales, targets and incentives by salesperson
          </p>
        </div>
        <SalesAnalyticsDateFilter
          label={periodLabel}
          month={month}
          onMonthChange={(value) => handleCalendarChange({ month: value })}
          onViewChange={handleViewChange}
          onYearChange={(value) => handleCalendarChange({ year: value })}
          view={view}
          year={year}
          yearOptions={yearOptions}
        />
      </div>

      <MetricsGrid>
        {analytics
          ? getSummaryCards(analytics, isAllTime).map((card) => (
              <MetricCard key={card.label} card={card} />
            ))
          : TABLE_SKELETON_ROWS.map((row) => <MetricCardSkeleton key={row} />)}
      </MetricsGrid>

      <Panel
        title="Salesperson breakdown"
        description="Select a salesperson to view their performance"
        contentClassName="px-0 pb-1 pt-2"
      >
        {analyticsQuery.isLoading && (
          <div className="space-y-2 px-4 pb-3">
            {TABLE_SKELETON_ROWS.map((row) => (
              <Skeleton className="h-11 w-full" key={row} />
            ))}
          </div>
        )}

        {analyticsQuery.isError && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Unable to load sales analytics.
          </p>
        )}

        {analytics && rows.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No sales recorded for this period.
          </p>
        )}

        {rows.length > 0 && (
          <>
            <div className="lg:hidden">
              <SalesBreakdownList
                rows={rows}
                isAllTime={isAllTime}
                selectedSalesPersonId={selectedSalesPersonId}
                onSelect={setSelectedSalesPersonId}
              />
            </div>
            <div className="max-lg:hidden">
              <SalesBreakdownTable
                rows={rows}
                isAllTime={isAllTime}
                selectedSalesPersonId={selectedSalesPersonId}
                onSelect={setSelectedSalesPersonId}
              />
            </div>
          </>
        )}
      </Panel>

      <div className="grid gap-5 md:grid-cols-2 md:items-start xl:grid-cols-[minmax(18rem,22rem)_minmax(0,1fr)]">
        <SalesLeaderboardCard
          highlightCurrentUser={false}
          onSelect={handleLeaderboardSelect}
          query={salesQuery}
          selectedSalesPersonId={selectedSalesPersonId}
        />
        <SalesPersonPerformanceCard
          query={salesQuery}
          salesPersonId={selectedSalesPersonId}
        />
      </div>
    </section>
  );
}
