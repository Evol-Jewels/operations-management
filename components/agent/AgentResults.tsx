import {
  ArrowUpRight,
  Building2,
  CircleDollarSign,
  Target,
  Trophy,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type {
  AgentEnquiryResult,
  AgentMessage,
  AgentOrderResult,
  AgentOrderUpdateResult,
  AgentProductAnalyticsResult,
  AgentSalesAnalyticsResult,
  AgentSalesLeaderboardResult,
  AgentUsersResult,
} from "@/types/agent-api";

import { InventoryResults } from "./InventoryResults";

const enquiryStatusLabels: Record<string, string> = {
  NEW: "New",
  ESTIMATED: "Estimated",
  CLOSED: "Closed",
  CONVERTED: "Converted",
};

const orderStatusLabels: Record<string, string> = {
  NEW: "New",
  IN_PRODUCTION: "In production",
  CAD_DESIGN: "CAD design",
  IN_TRANSIT: "In transit",
  CERTIFICATION: "Certification",
  AT_STORE: "At store",
  DELIVERED: "Delivered",
  CLOSED: "Closed",
  CANCELLED: "Cancelled",
};

function money(value: string | number | null | undefined) {
  if (value === null || value === undefined) return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? formatCurrency(parsed) : null;
}

function periods(period: string) {
  if (period === "allTime") return "All time";
  if (period === "year") return "This year";
  if (period === "range") return "Selected range";
  return "This month";
}

function ResultCard({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group block overflow-hidden rounded-xl border bg-card transition-colors hover:border-foreground/25 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {children}
    </Link>
  );
}

function EnquiryResults({ result }: { result: AgentEnquiryResult }) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        {result.items.length
          ? `${result.offset + 1}–${result.offset + result.items.length} of ${result.total} enquiries`
          : "No matching enquiries"}
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {result.items.map((enquiry) => (
          <ResultCard
            key={enquiry.id}
            href={`/enquiries?refCode=${encodeURIComponent(enquiry.code)}`}
          >
            <div className="p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="truncate font-mono text-xs text-muted-foreground">
                  {enquiry.code}
                </span>
                <ArrowUpRight
                  className="size-4 shrink-0 text-muted-foreground group-hover:text-foreground"
                  aria-hidden="true"
                />
              </div>
              <p className="mt-2 truncate text-sm font-medium">
                {enquiry.name}
              </p>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {enquiry.phoneNumber}
                {enquiry.itemCount !== undefined
                  ? ` · ${enquiry.itemCount} item${enquiry.itemCount === 1 ? "" : "s"}`
                  : ""}
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                {enquiry.budget ? (
                  <span className="text-sm font-semibold tabular-nums">
                    {money(enquiry.budget)}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    No budget
                  </span>
                )}
                <Badge variant="secondary" className="text-[10px] font-normal">
                  {enquiryStatusLabels[enquiry.status] ?? enquiry.status}
                </Badge>
              </div>
              <p className="mt-3 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                <UserRound className="size-3 shrink-0" aria-hidden="true" />
                {enquiry.salesPerson || "Unassigned"}
                {enquiry.updatedAt
                  ? ` · Updated ${formatDate(enquiry.updatedAt)}`
                  : ""}
              </p>
            </div>
          </ResultCard>
        ))}
      </div>
    </div>
  );
}

function OrderResults({ result }: { result: AgentOrderResult }) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        {result.items.length
          ? `${result.offset + 1}–${result.offset + result.items.length} of ${result.total} orders`
          : "No matching orders"}
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {result.items.map((order) => (
          <ResultCard
            key={order.id}
            href={`/orders?refCode=${encodeURIComponent(order.code)}`}
          >
            <div className="p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="truncate font-mono text-xs text-muted-foreground">
                  {order.code}
                </span>
                <ArrowUpRight
                  className="size-4 shrink-0 text-muted-foreground group-hover:text-foreground"
                  aria-hidden="true"
                />
              </div>
              <p className="mt-2 truncate text-sm font-medium">{order.name}</p>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {[
                  order.productCode ?? order.productType.toLowerCase(),
                  order.vendor,
                  order.isCadRequired ? "CAD required" : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <span className="truncate text-xs text-muted-foreground">
                  {order.salesPerson || "Unassigned"}
                </span>
                <Badge variant="secondary" className="text-[10px] font-normal">
                  {orderStatusLabels[order.status] ?? order.status}
                </Badge>
              </div>
              {order.estimatedDeliveryDate && (
                <p className="mt-3 truncate text-xs text-muted-foreground">
                  Delivery {formatDate(order.estimatedDeliveryDate)}
                </p>
              )}
            </div>
          </ResultCard>
        ))}
      </div>
    </div>
  );
}

function UserResults({ result }: { result: AgentUsersResult }) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        {result.items.length
          ? `${result.offset + 1}–${result.offset + result.items.length} of ${result.total} team members`
          : "No matching team members"}
      </p>
      <div className="divide-y overflow-hidden rounded-xl border bg-card">
        {result.items.map((user) => (
          <div
            key={user.id}
            className="flex items-center justify-between gap-3 px-4 py-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {[
                  user.role ? user.role.toLowerCase() : null,
                  user.department,
                  user.location,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            <div className="shrink-0 text-right">
              {user.monthlySalesTarget && (
                <p className="text-xs tabular-nums text-muted-foreground">
                  Target {money(user.monthlySalesTarget)}
                </p>
              )}
              <Badge
                variant="secondary"
                className="mt-1 text-[10px] font-normal"
              >
                {user.status.toLowerCase()}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OrderUpdate({ result }: { result: AgentOrderUpdateResult }) {
  const label = orderStatusLabels[result.status] ?? result.status;
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3">
      <Badge variant="secondary" className="text-[10px] font-normal">
        {label}
      </Badge>
      <p className="min-w-0 truncate text-sm">
        Order{" "}
        <Link
          href={`/orders?refCode=${encodeURIComponent(result.code)}`}
          className="font-mono underline-offset-2 hover:underline"
        >
          {result.code}
        </Link>{" "}
        updated{result.message ? `: ${result.message}` : ""}
      </p>
    </div>
  );
}

function SalesAnalytics({ result }: { result: AgentSalesAnalyticsResult }) {
  const revenue = money(result.revenue);
  const personal = result.salesPerson !== undefined;
  return (
    <div className="space-y-2 rounded-xl border bg-card p-4">
      <p className="text-xs text-muted-foreground">
        {personal && result.salesPerson
          ? `${result.salesPerson} · sales · ${periods(result.period)}`
          : `Sales · ${periods(result.period)}`}
      </p>
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        {revenue && (
          <div>
            <p className="text-xs text-muted-foreground">Revenue</p>
            <p className="text-lg font-semibold tabular-nums">{revenue}</p>
          </div>
        )}
        {result.transactions !== undefined && (
          <div>
            <p className="text-xs text-muted-foreground">Transactions</p>
            <p className="text-lg font-semibold tabular-nums">
              {result.transactions}
            </p>
          </div>
        )}
        {result.target && (
          <div>
            <p className="text-xs text-muted-foreground">Target</p>
            <p className="text-lg font-semibold tabular-nums">
              {money(result.target)}
            </p>
          </div>
        )}
        {result.incentive?.payableAmount && (
          <div>
            <p className="text-xs text-muted-foreground">Incentive payable</p>
            <p className="text-lg font-semibold tabular-nums">
              {money(result.incentive.payableAmount)}
            </p>
          </div>
        )}
      </div>
      {result.summary?.totalTransactions !== undefined && (
        <div className="flex flex-wrap gap-x-6 gap-y-2 border-t pt-2">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CircleDollarSign className="size-3" aria-hidden="true" />
            {result.summary.totalTransactions} transactions
          </span>
          {result.summary.totalRevenue !== undefined && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Target className="size-3" aria-hidden="true" />
              {money(result.summary.totalRevenue)} overall
            </span>
          )}
          {result.summary.totalPayableIncentive !== undefined && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Trophy className="size-3" aria-hidden="true" />
              {money(result.summary.totalPayableIncentive)} payable incentives
            </span>
          )}
        </div>
      )}
      {result.breakdown?.length ? (
        <div className="divide-y overflow-hidden rounded-lg border">
          {result.breakdown.map((row) => (
            <div
              key={`${row.rank}-${row.salesPerson}`}
              className="flex items-center justify-between gap-3 px-3 py-2"
            >
              <span className="min-w-0 flex items-center gap-2 truncate text-xs">
                <span className="w-6 shrink-0 text-right font-medium tabular-nums text-muted-foreground">
                  #{row.rank}
                </span>
                <span className="truncate font-medium">{row.salesPerson}</span>
              </span>
              <span className="shrink-0 text-right">
                <span className="text-xs font-medium tabular-nums">
                  {money(row.revenue)}
                </span>
                <span className="ml-2 text-[10px] text-muted-foreground">
                  {row.transactions} txns · {row.revenueShare}
                </span>
              </span>
            </div>
          ))}
          {result.breakdownTruncated && (
            <p className="px-3 py-2 text-[10px] text-muted-foreground">
              Showing top {result.breakdown.length} — ask for more details for
              others.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}

function SalesLeaderboard({ result }: { result: AgentSalesLeaderboardResult }) {
  if (!result.leaderboard.length)
    return (
      <p className="rounded-xl border bg-card px-4 py-3 text-sm text-muted-foreground">
        No ranked sales people for {periods(result.period).toLowerCase()}.
      </p>
    );
  return (
    <div className="space-y-2 rounded-xl border bg-card p-4">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Trophy className="size-3 shrink-0" aria-hidden="true" />
        Sales leaderboard · {periods(result.period)}
      </p>
      <div className="divide-y overflow-hidden rounded-lg border">
        {result.leaderboard.map((row) => (
          <div
            key={`${row.rank}-${row.salesPerson.id}`}
            className="flex items-center justify-between gap-3 px-3 py-2"
          >
            <span className="min-w-0 flex items-center gap-2 truncate text-xs">
              <span className="w-6 shrink-0 text-right font-medium tabular-nums text-muted-foreground">
                #{row.rank}
              </span>
              <span className="truncate font-medium">
                {row.salesPerson.name ?? "Unknown"}
              </span>
            </span>
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
              {row.totalProductsSold} products sold
            </span>
          </div>
        ))}
      </div>
      <p className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <Building2 className="size-3" aria-hidden="true" />
        Ask for one person's revenue and incentive with person analytics.
      </p>
    </div>
  );
}

function ProductAnalytics({ result }: { result: AgentProductAnalyticsResult }) {
  return (
    <div className="space-y-2 rounded-xl border bg-card p-4">
      <p className="text-xs text-muted-foreground">Inventory analytics</p>
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        {Object.entries(result.summary).map(([key, value]) => (
          <div key={key}>
            <p className="text-xs text-muted-foreground">
              {key
                .replace(/^(total)/, "")
                .replace(/([A-Z])/g, " $1")
                .toLowerCase()}
            </p>
            <p className="font-semibold tabular-nums">
              {key.toLowerCase().includes("price")
                ? money(value)
                : value.toLocaleString("en-IN")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AgentResultView({ message }: { message: AgentMessage }) {
  if (message.inventory) return <InventoryResults result={message.inventory} />;
  if (message.orders) return <OrderResults result={message.orders} />;
  if (message.enquiries) return <EnquiryResults result={message.enquiries} />;
  if (message.salesAnalytics)
    return <SalesAnalytics result={message.salesAnalytics} />;
  if (message.salesLeaderboard)
    return <SalesLeaderboard result={message.salesLeaderboard} />;
  if (message.orderUpdate) return <OrderUpdate result={message.orderUpdate} />;
  if (message.users) return <UserResults result={message.users} />;
  if (message.productAnalytics)
    return <ProductAnalytics result={message.productAnalytics} />;
  return null;
}
