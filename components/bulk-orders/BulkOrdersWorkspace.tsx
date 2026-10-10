"use client";

import { formatDistanceToNowStrict } from "date-fns";
import { CalendarDays, Layers, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { UrgencyDot } from "@/components/dashboard/UrgencyDot";
import { WorkspaceCard } from "@/components/dashboard/WorkspaceCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  type BulkOrder,
  type FulfilmentFilter,
  formatBulkDate,
  formatBulkOrderRef,
  matchesOrderFilter,
  summarizeBulkOrder,
} from "@/lib/bulkOrders";
import { getFirstName } from "@/lib/people";
import { useBulkOrdersStore } from "@/lib/stores/bulk-orders-store";
import { formatCurrency, getUrgencyLevel } from "@/lib/utils";
import { FulfilmentBadge, FulfilmentProgress } from "./BulkOrderBadges";
import { CreatedByCell } from "./CreatedBy";

const FILTERS: Array<{ value: FulfilmentFilter; label: string }> = [
  { value: "all", label: "All bulk orders" },
  { value: "pending", label: "Has pending items" },
  { value: "filled", label: "Fully filled" },
];

function getHref(order: BulkOrder) {
  return `/bulk-orders/${order.refCode}`;
}

function DeliveryDate({
  order,
  isFilled,
}: {
  order: BulkOrder;
  isFilled: boolean;
}) {
  const urgency = isFilled
    ? "none"
    : getUrgencyLevel(order.expectedDeliveryDate);
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      {!isFilled && <UrgencyDot level={urgency} />}
      {formatBulkDate(order.expectedDeliveryDate)}
    </span>
  );
}

export function BulkOrdersWorkspace() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FulfilmentFilter>("all");
  const query = search.trim().toLowerCase();
  const orders = useBulkOrdersStore((state) => state.orders);
  const rows = orders
    .map((order) => ({ order, summary: summarizeBulkOrder(order) }))
    .filter(
      ({ order, summary }) =>
        matchesOrderFilter(filter, summary.status) &&
        [
          formatBulkOrderRef(order.refCode),
          order.packingListNumber,
          order.vendorName,
          ...order.items.map((item) => item.vendorDesignNumber),
        ].some((value) => value.toLowerCase().includes(query)),
    );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <h2 className="text-base font-medium lg:mr-auto">
          Bulk orders{" "}
          <span className="text-muted-foreground">({rows.length})</span>
        </h2>
        <div className="relative min-w-0 lg:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            aria-label="Search bulk orders by vendor, packing list, or design"
            placeholder="Search vendor, packing list, or design"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
            maxLength={255}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={filter}
            onValueChange={(value) =>
              setFilter(
                FILTERS.find((option) => option.value === value)?.value ??
                  "all",
              )
            }
          >
            <SelectTrigger aria-label="Filter bulk orders by fulfilment">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FILTERS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(search || filter !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("");
                setFilter("all");
              }}
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <Layers className="size-7 text-muted-foreground" />
          <p className="text-sm font-medium">
            No bulk orders match these filters
          </p>
          <p className="max-w-sm px-4 text-sm text-muted-foreground">
            Try another search or clear the filters.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:hidden">
            {rows.map(({ order, summary }) => {
              const isFilled =
                summary.status === "Filled" || summary.status === "Cancelled";
              return (
                <WorkspaceCard
                  key={order.refCode}
                  urgency={
                    isFilled
                      ? "none"
                      : getUrgencyLevel(order.expectedDeliveryDate)
                  }
                  onClick={() => router.push(getHref(order))}
                >
                  <div className="space-y-3 pl-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {order.vendorName}
                        </p>
                        <p className="mt-1 truncate font-mono text-[11px] text-muted-foreground">
                          {formatBulkOrderRef(order.refCode)} ·{" "}
                          {order.packingListNumber}
                        </p>
                      </div>
                      <FulfilmentBadge
                        status={summary.status}
                        className="shrink-0"
                      />
                    </div>
                    <FulfilmentProgress
                      filled={summary.filled}
                      total={summary.pieces}
                    />
                    <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-2 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="size-3" aria-hidden="true" />
                        Due {formatBulkDate(order.expectedDeliveryDate)}
                      </span>
                      <span className="font-medium tabular-nums text-foreground">
                        {formatCurrency(summary.amounts.quoted)}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Created by{" "}
                      <span className="font-medium text-foreground">
                        {getFirstName(order.createdBy)}
                      </span>{" "}
                      {formatDistanceToNowStrict(new Date(order.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </WorkspaceCard>
              );
            })}
          </div>

          <div className="hidden overflow-hidden rounded-xl border bg-card sm:block">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="min-w-56">
                      Bulk order / Vendor
                    </TableHead>
                    <TableHead className="min-w-36">Status</TableHead>
                    <TableHead className="min-w-48">Pieces filled</TableHead>
                    <TableHead className="text-right">Lines</TableHead>
                    <TableHead className="text-right">Quoted total</TableHead>
                    <TableHead className="min-w-36">
                      Expected delivery
                    </TableHead>
                    <TableHead className="min-w-36">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map(({ order, summary }) => (
                    <TableRow
                      key={order.refCode}
                      className="cursor-pointer"
                      onClick={() => router.push(getHref(order))}
                    >
                      <TableCell>
                        <Link
                          href={getHref(order)}
                          className="font-medium text-foreground hover:underline"
                        >
                          {order.vendorName}
                        </Link>
                        <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                          {formatBulkOrderRef(order.refCode)} ·{" "}
                          {order.packingListNumber}
                        </p>
                      </TableCell>
                      <TableCell>
                        <FulfilmentBadge status={summary.status} />
                      </TableCell>
                      <TableCell>
                        <FulfilmentProgress
                          filled={summary.filled}
                          total={summary.pieces}
                          className="max-w-44"
                        />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {summary.filledLines}/
                        {summary.lines - summary.cancelledLines}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatCurrency(summary.amounts.quoted)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <DeliveryDate
                          order={order}
                          isFilled={
                            summary.status === "Filled" ||
                            summary.status === "Cancelled"
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <CreatedByCell
                          person={order.createdBy}
                          createdAt={order.createdAt}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
