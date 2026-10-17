"use client";

import { Award } from "lucide-react";
import { useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useMyStockSales,
  useStockSalesLeaderboard,
} from "@/hooks/useStockSales";
import { getInitials } from "@/lib/people";
import {
  formatSalesPeriodLabel,
  getCurrentSaleMonth,
} from "@/lib/salesAnalytics";
import { cn } from "@/lib/utils";
import type {
  StockSalesAnalyticsQuery,
  StockSalesLeaderboardRow,
} from "@/types/stock-sales-api";
import { Panel } from "./DashboardPrimitives";

const SKELETON_ROWS = ["first", "second", "third", "fourth"] as const;

function LeaderboardRow({
  row,
  isCurrentUser,
  isSelected,
  onSelect,
}: {
  row: StockSalesLeaderboardRow;
  isCurrentUser: boolean;
  isSelected: boolean;
  onSelect?: (row: StockSalesLeaderboardRow) => void;
}) {
  const person = row.salesPerson;
  const name = person.name ?? "Unknown";
  const isLeader = row.rank === 1 && row.totalProductsSold > 0;
  const content = (
    <>
      <span className="flex w-7 shrink-0 justify-center text-sm font-medium tabular-nums text-muted-foreground">
        {isLeader ? (
          <Award className="size-4.5 text-amber-500" aria-label="Rank 1" />
        ) : (
          row.rank
        )}
      </span>
      <Avatar className="size-8">
        {person.image && <AvatarImage src={person.image} alt={name} />}
        <AvatarFallback className="text-[11px]">
          {getInitials({ id: person.id, name, image: person.image })}
        </AvatarFallback>
      </Avatar>
      <span className="flex min-w-0 flex-1 items-center gap-2">
        <span className="truncate text-sm font-medium text-foreground">
          {name}
        </span>
        {isCurrentUser && (
          <Badge
            variant="secondary"
            className="h-5 shrink-0 rounded-md bg-sky-500/15 px-1.5 text-[10px] text-sky-700 dark:text-sky-300"
          >
            You
          </Badge>
        )}
      </span>
      <span className="shrink-0 text-right">
        <span className="block text-sm font-semibold tabular-nums text-foreground">
          {row.totalProductsSold.toLocaleString("en-IN")}
        </span>
        <span className="block text-[10px] text-muted-foreground">sold</span>
      </span>
    </>
  );
  const className = cn(
    "flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors",
    isSelected
      ? "bg-sky-500/10 ring-1 ring-sky-500/30 ring-inset"
      : isCurrentUser && "bg-sky-500/5",
  );

  if (!onSelect) return <div className={className}>{content}</div>;

  return (
    <button
      type="button"
      onClick={() => onSelect(row)}
      aria-pressed={isSelected}
      className={cn(
        className,
        !isSelected && "hover:bg-muted/60",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
      )}
    >
      {content}
    </button>
  );
}

export function SalesLeaderboardCard({
  className,
  highlightCurrentUser = true,
  onSelect,
  query,
  selectedSalesPersonId,
}: {
  className?: string;
  highlightCurrentUser?: boolean;
  onSelect?: (row: StockSalesLeaderboardRow) => void;
  query?: StockSalesAnalyticsQuery;
  selectedSalesPersonId?: string;
}) {
  const analyticsQuery = query ?? {
    period: "month",
    saleMonth: getCurrentSaleMonth(),
  };
  const leaderboardQuery = useStockSalesLeaderboard(analyticsQuery);
  const mySalesQuery = useMyStockSales(analyticsQuery, {
    enabled: highlightCurrentUser,
  });
  const leaderboard = leaderboardQuery.data?.leaderboard ?? [];
  const currentSalesPersonId = highlightCurrentUser
    ? mySalesQuery.data?.salesPerson.id
    : undefined;
  const period = leaderboardQuery.data?.period;

  useEffect(() => {
    if (!onSelect || selectedSalesPersonId || leaderboard.length === 0) return;
    onSelect(leaderboard[0]);
  }, [leaderboard, onSelect, selectedSalesPersonId]);

  return (
    <Panel
      title="Sales leaderboard"
      description={
        period
          ? `Products sold · ${formatSalesPeriodLabel(period)}`
          : "Products sold"
      }
      className={className}
      contentClassName="max-h-[28rem] overflow-y-auto px-2 pt-2 pb-2"
    >
      {leaderboardQuery.isLoading && (
        <div className="space-y-1.5 px-2">
          {SKELETON_ROWS.map((row) => (
            <Skeleton className="h-12 w-full rounded-md" key={row} />
          ))}
        </div>
      )}

      {leaderboardQuery.isError && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Unable to load leaderboard.
        </p>
      )}

      {leaderboardQuery.isSuccess && leaderboard.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No sales recorded for this period.
        </p>
      )}

      {leaderboard.length > 0 && (
        <ol className="space-y-0.5">
          {leaderboard.map((row) => (
            <li key={row.salesPerson.id}>
              <LeaderboardRow
                row={row}
                isCurrentUser={row.salesPerson.id === currentSalesPersonId}
                isSelected={row.salesPerson.id === selectedSalesPersonId}
                onSelect={onSelect}
              />
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}
