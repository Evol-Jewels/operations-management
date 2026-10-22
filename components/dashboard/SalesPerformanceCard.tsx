"use client";

import { BadgeCheck, Lock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useMyStockSales,
  useSalesPersonStockSales,
} from "@/hooks/useStockSales";
import { getInitials } from "@/lib/people";
import {
  formatSalesCurrency,
  formatSalesPeriodLabel,
  getCurrentSaleMonth,
  getTargetProgress,
  type TargetProgress,
} from "@/lib/salesAnalytics";
import { cn } from "@/lib/utils";
import type {
  StockSalesAnalyticsQuery,
  StockSalesMeResponse,
} from "@/types/stock-sales-api";
import { SalesTargetMeter } from "./SalesTargetMeter";

function getMilestone(progress: TargetProgress | null) {
  if (!progress) return "No target set for this period";
  if (progress.percent >= 100) {
    return progress.exceededBy > 0
      ? `Exceeded by ${formatSalesCurrency(progress.exceededBy)}`
      : "Target reached";
  }

  return `${formatSalesCurrency(progress.remaining)} to go`;
}

function StatusBadge({
  isLoading,
  isEligible,
  hasTarget,
}: {
  isLoading: boolean;
  isEligible: boolean;
  hasTarget: boolean;
}) {
  if (isLoading) return <Skeleton className="h-6 w-20 rounded-md" />;

  const label = isEligible
    ? "Target met"
    : hasTarget
      ? "In progress"
      : "No target";

  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-md px-2 py-1 text-[11px] font-medium",
        isEligible
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          : hasTarget
            ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
            : "text-muted-foreground",
      )}
    >
      {label}
    </Badge>
  );
}

function StatTile({
  label,
  value,
  helper,
  icon,
  isLoading,
}: {
  label: string;
  value: string;
  helper?: string;
  icon?: React.ReactNode;
  isLoading: boolean;
}) {
  return (
    <div className="min-w-0 rounded-md border border-border/70 bg-background/60 p-2.5 @sm:p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {icon}
      </div>
      {isLoading ? (
        <Skeleton className="mt-2 h-6 w-24" />
      ) : (
        <p className="mt-1 text-base font-semibold tabular-nums tracking-tight break-words text-foreground @sm:text-lg">
          {value}
        </p>
      )}
      {helper && !isLoading && (
        <p className="mt-0.5 text-xs text-muted-foreground">{helper}</p>
      )}
    </div>
  );
}

export function SalesPerformanceCard({
  analytics,
  isLoading,
  title,
  showPerson = false,
  className,
}: {
  analytics?: StockSalesMeResponse;
  isLoading: boolean;
  title: string;
  showPerson?: boolean;
  className?: string;
}) {
  const person = analytics?.salesPerson;
  const revenue = analytics?.revenue ?? 0;
  const progress = getTargetProgress(revenue, analytics?.target);
  const isEligible =
    analytics?.incentive?.eligible ?? (progress?.percent ?? 0) >= 100;
  const periodLabel = analytics?.period
    ? formatSalesPeriodLabel(analytics.period)
    : "Selected period";

  return (
    <section
      className={cn(
        "@container flex min-w-0 flex-col rounded-lg border border-border/70 bg-card",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          {showPerson && (
            <Avatar className="size-9">
              {person?.image && (
                <AvatarImage src={person.image} alt={person.name ?? ""} />
              )}
              <AvatarFallback className="text-xs">
                {person
                  ? getInitials({
                      id: person.id,
                      name: person.name ?? "Unknown",
                      image: person.image,
                    })
                  : "–"}
              </AvatarFallback>
            </Avatar>
          )}
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-foreground">
              {title}
            </h2>
            <p className="truncate text-xs text-muted-foreground">
              {periodLabel}
            </p>
          </div>
        </div>
        <StatusBadge
          isLoading={isLoading}
          isEligible={isEligible}
          hasTarget={progress != null}
        />
      </div>

      <div className="grid flex-1 gap-4 p-3 @sm:p-4 @xl:grid-cols-[minmax(0,1fr)_14rem] @xl:items-center">
        <div className="min-w-0 space-y-2.5 @sm:space-y-3">
          <div className="rounded-md border border-border/70 bg-background/60 p-3">
            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground">
                  Target completion
                </p>
                <p className="mt-0.5 truncate text-sm text-foreground">
                  {isLoading ? "–" : getMilestone(progress)}
                </p>
              </div>
              <p className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">
                {isLoading ? "–" : progress ? `${progress.percent}%` : "N/A"}
              </p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-[width] duration-500",
                  isEligible ? "bg-emerald-500" : "bg-sky-500",
                )}
                style={{ width: `${isLoading ? 0 : (progress?.fill ?? 0)}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 @sm:gap-3">
            <StatTile
              label="Sales value"
              value={formatSalesCurrency(revenue)}
              isLoading={isLoading}
            />
            <StatTile
              label="Target"
              value={
                analytics?.target == null
                  ? "Not set"
                  : formatSalesCurrency(analytics.target)
              }
              isLoading={isLoading}
            />
            <StatTile
              label="Transactions"
              value={String(analytics?.transactions ?? 0)}
              isLoading={isLoading}
            />
            <StatTile
              label="Payable incentive"
              value={formatSalesCurrency(
                analytics?.incentive?.payableAmount ?? 0,
              )}
              helper={`${formatSalesCurrency(analytics?.incentive?.earnedAmount ?? 0)} earned · ${analytics?.incentive?.multiplier ?? "0.00"}x`}
              icon={
                isEligible ? (
                  <BadgeCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Lock className="size-3.5 text-muted-foreground" />
                )
              }
              isLoading={isLoading}
            />
          </div>
        </div>

        <SalesTargetMeter
          className="mx-auto w-full max-w-64"
          fillHeight={progress?.fill ?? 0}
          isIncentiveEligible={isEligible}
          isLoading={isLoading}
          progressValue={progress?.percent ?? 0}
        />
      </div>
    </section>
  );
}

export function MySalesPerformanceCard({ className }: { className?: string }) {
  const salesQuery = useMyStockSales({
    period: "month",
    saleMonth: getCurrentSaleMonth(),
  });

  return (
    <SalesPerformanceCard
      analytics={salesQuery.data}
      isLoading={salesQuery.isLoading}
      title="Your performance"
      className={className}
    />
  );
}

export function SalesPersonPerformanceCard({
  query,
  salesPersonId,
}: {
  query: StockSalesAnalyticsQuery;
  salesPersonId: string;
}) {
  const performanceQuery = useSalesPersonStockSales(
    { ...query, salesPersonId },
    { enabled: Boolean(salesPersonId) },
  );

  if (!salesPersonId) {
    return (
      <div className="flex min-h-64 items-center justify-center rounded-lg border border-dashed border-border/70 bg-card p-8 text-center text-sm text-muted-foreground">
        Select a salesperson to see their performance.
      </div>
    );
  }

  if (performanceQuery.isError) {
    return (
      <div className="flex min-h-64 items-center justify-center rounded-lg border border-border/70 bg-card p-8 text-center text-sm text-muted-foreground">
        Unable to load salesperson performance.
      </div>
    );
  }

  return (
    <SalesPerformanceCard
      analytics={performanceQuery.data}
      isLoading={performanceQuery.isLoading}
      title={performanceQuery.data?.salesPerson.name ?? "Salesperson"}
      showPerson
    />
  );
}
