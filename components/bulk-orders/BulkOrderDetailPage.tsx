"use client";

import { ArrowLeft, FileText, Truck } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { type ReactNode, useState } from "react";
import { UrgencyDot } from "@/components/dashboard/UrgencyDot";
import { SpecLine, SpecSection } from "@/components/order/SpecSection";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useIsMobile } from "@/hooks/use-mobile";
import { useBulkOrder } from "@/hooks/useBulkOrders";
import {
  type BulkOrder,
  type BulkOrderAmounts,
  FILLED_FROM_STAGE,
  formatBulkDate,
  formatBulkOrderRef,
  summarizeBulkOrder,
} from "@/lib/bulkOrders";
import {
  cn,
  formatCurrency,
  formatDaysRemaining,
  getUrgencyLevel,
} from "@/lib/utils";
import { AmountBreakdown } from "./AmountBreakdown";
import { BulkDocumentTotals } from "./BulkDocumentTotals";
import { FulfilmentBadge } from "./BulkOrderBadges";
import { BulkOrderEditButton } from "./BulkOrderEditButton";
import {
  BulkOrderItemsTracker,
  type BulkOrderView,
} from "./BulkOrderItemsTracker";
import { CreatedByLine } from "./CreatedBy";
import { useBulkItemMove } from "./useBulkItemMove";

export const BULK_ORDERS_HREF = "/orders-workspace?type=bulk-orders";

export function BulkOrderLoading() {
  return (
    <div className="mx-auto max-w-3xl py-20 text-center text-sm text-muted-foreground">
      Loading record...
    </div>
  );
}

export function BulkOrderNotFound({ label }: { label: string }) {
  return (
    <div className="space-y-3 py-12 text-center">
      <h1 className="text-xl font-semibold">{label} not found</h1>
      <p className="text-sm text-muted-foreground">
        This record may have been removed or the link may be incorrect.
      </p>
      <Button asChild variant="outline">
        <Link href={BULK_ORDERS_HREF}>Back to bulk orders</Link>
      </Button>
    </div>
  );
}

function StatTile({
  label,
  value,
  hint,
  children,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  children?: ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-border bg-card px-3.5 py-3 sm:px-4 sm:py-3.5">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
        {label}
      </p>
      <p className="mt-1 truncate text-lg font-semibold tracking-tight tabular-nums text-foreground sm:mt-1.5 sm:text-xl">
        {value}
      </p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      {children}
    </div>
  );
}

function OrderInfoCard({
  order,
  amounts,
  wide,
}: {
  order: BulkOrder;
  amounts: BulkOrderAmounts;
  wide: boolean;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <div
        className={cn(
          "p-4 sm:px-5",
          wide
            ? "grid gap-6 @[40rem]/bulk-detail:grid-cols-2 @[56rem]/bulk-detail:grid-cols-3 @[48rem]/bulk-detail:gap-8"
            : "space-y-6",
        )}
      >
        <SpecSection icon={FileText} title="Packing list">
          <SpecLine
            label="Bulk order"
            value={formatBulkOrderRef(order.refCode)}
            mono
          />
          <SpecLine label="Packing list" value={order.packingListNumber} mono />
          <SpecLine
            label="Quotation date"
            value={formatBulkDate(order.quotationDate)}
          />
          <SpecLine
            label="Expected delivery"
            value={formatBulkDate(order.expectedDeliveryDate)}
          />
        </SpecSection>
        <SpecSection icon={Truck} title="Vendor details">
          <SpecLine label="Vendor name" value={order.vendorName} />
          <SpecLine label="City" value={order.vendorCity} />
        </SpecSection>
        <AmountBreakdown title="Amount summary" amounts={amounts} />
      </div>
      <BulkDocumentTotals refCode={order.refCode} />
    </section>
  );
}

export function BulkOrderDetailPage({ refCode }: { refCode: number }) {
  const { data: order, isLoading } = useBulkOrder(refCode);
  if (isLoading) return <BulkOrderLoading />;
  if (!order) return <BulkOrderNotFound label="Bulk order" />;
  return <BulkOrderDashboard order={order} />;
}

function BulkOrderDashboard({ order }: { order: BulkOrder }) {
  const searchParams = useSearchParams();
  const { requestMove, dialog } = useBulkItemMove(order.refCode);
  const { items } = order;
  const isMobile = useIsMobile();
  const viewParam = searchParams.get("view");
  const [chosenView, setView] = useState<BulkOrderView | null>(
    viewParam === "table" || viewParam === "kanban" ? viewParam : null,
  );
  const view = chosenView ?? (isMobile ? "table" : "kanban");
  const summary = summarizeBulkOrder(order);
  const isDone = summary.status === "Filled" || summary.status === "Cancelled";
  const urgency = getUrgencyLevel(order.expectedDeliveryDate);
  const percent = summary.pieces
    ? Math.round((summary.filled / summary.pieces) * 100)
    : 0;
  const plural = (count: number, word: string) =>
    `${count} ${word}${count === 1 ? "" : "s"}`;

  const handleViewChange = (nextView: BulkOrderView) => {
    setView(nextView);
    const params = new URLSearchParams(window.location.search);
    params.set("view", nextView);
    window.history.replaceState(null, "", `?${params.toString()}`);
  };

  return (
    <div className="@container/bulk-detail mx-auto w-full min-w-0 max-w-6xl">
      <Button
        variant="ghost"
        size="sm"
        asChild
        className="-ml-2 mb-3 gap-1.5 text-muted-foreground sm:mb-5"
      >
        <Link href={BULK_ORDERS_HREF}>
          <ArrowLeft className="size-3.5" />
          All bulk orders
        </Link>
      </Button>

      <header className="mb-4 space-y-2.5 border-b border-border pb-4 sm:mb-6 sm:space-y-3 sm:pb-5">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="break-words text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {order.vendorName}
          </h1>
          <span className="font-mono text-base text-muted-foreground sm:text-lg">
            {formatBulkOrderRef(order.refCode)}
          </span>
          <div className="ml-auto">
            <BulkOrderEditButton refCode={order.refCode} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2 text-xs text-muted-foreground sm:text-sm">
          <FulfilmentBadge
            status={summary.status}
            withIcon
            className="h-7 px-3"
          />
          <CreatedByLine person={order.createdBy} createdAt={order.createdAt} />
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1.5">
            <FileText className="size-3.5" aria-hidden="true" />
            <span className="font-mono text-foreground">
              {order.packingListNumber}
            </span>
          </span>
          {!isDone && (
            <span
              title={`Expected ${formatBulkDate(order.expectedDeliveryDate)}`}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                urgency === "overdue" &&
                  "bg-red-500/10 text-red-600 dark:text-red-400",
                urgency === "due-soon" &&
                  "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                urgency === "on-track" &&
                  "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
              )}
            >
              <UrgencyDot level={urgency} />
              {formatDaysRemaining(order.expectedDeliveryDate)}
            </span>
          )}
        </div>
      </header>

      <div className="mb-4 grid grid-cols-2 gap-2.5 sm:mb-5 sm:gap-3 @[40rem]/bulk-detail:grid-cols-4">
        <StatTile
          label="Pieces filled"
          value={`${summary.filled}/${summary.pieces}`}
        >
          <Progress
            value={percent}
            aria-label={`${percent}% of pieces filled`}
            className={cn(
              "mt-2.5 h-1.5 bg-muted",
              summary.status === "Filled"
                ? "[&>[data-slot=progress-indicator]]:bg-emerald-500"
                : "[&>[data-slot=progress-indicator]]:bg-foreground",
            )}
          />
        </StatTile>
        <StatTile
          label="Pending"
          value={summary.pending}
          hint={
            summary.pendingLines
              ? `pcs across ${plural(summary.pendingLines, "line")} · filled at ${FILLED_FROM_STAGE}`
              : "Everything is at store"
          }
        />
        <StatTile
          label="Product lines"
          value={summary.lines}
          hint={[
            `${summary.filledLines} filled`,
            summary.cancelledLines
              ? `${summary.cancelledLines} cancelled`
              : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        />
        <StatTile
          label="Active line total"
          value={formatCurrency(summary.amounts.quoted)}
          hint={
            summary.cancelledAmount
              ? `Excludes ${formatCurrency(summary.cancelledAmount)} cancelled`
              : `${order.currency} · line quotations`
          }
        />
      </div>

      {view === "kanban" ? (
        <div className="space-y-5">
          <OrderInfoCard order={order} amounts={summary.amounts} wide />
          <BulkOrderItemsTracker
            refCode={order.refCode}
            items={items}
            view={view}
            onViewChange={handleViewChange}
            onMove={requestMove}
          />
        </div>
      ) : (
        <div className="grid min-w-0 items-start gap-5 @[60rem]/bulk-detail:grid-cols-[minmax(0,1fr)_320px] @[60rem]/bulk-detail:gap-7">
          <main className="min-w-0">
            <BulkOrderItemsTracker
              refCode={order.refCode}
              items={items}
              view={view}
              onViewChange={handleViewChange}
              onMove={requestMove}
            />
          </main>
          <aside className="min-w-0 @[60rem]/bulk-detail:sticky @[60rem]/bulk-detail:top-6 @[60rem]/bulk-detail:self-start">
            <OrderInfoCard
              order={order}
              amounts={summary.amounts}
              wide={false}
            />
          </aside>
        </div>
      )}
      <div className="h-16" />
      {dialog}
    </div>
  );
}
