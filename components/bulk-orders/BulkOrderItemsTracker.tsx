"use client";

import { LayoutGrid, List, Package, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { UrgencyDot } from "@/components/dashboard/UrgencyDot";
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
  BULK_ITEM_STAGES,
  type BulkItemStage,
  type BulkOrderItem,
  type FulfilmentFilter,
  formatBulkDate,
  getBulkItemHref,
  getBulkItemStatus,
  isBulkItemPending,
  matchesItemFilter,
} from "@/lib/bulkOrders";
import { cn, formatCurrency } from "@/lib/utils";
import { BulkItemThumbnail } from "./BulkItemThumbnail";
import { FulfilmentBadge, StageBadge } from "./BulkOrderBadges";
import { BulkOrderItemCard, getBulkItemUrgency } from "./BulkOrderItemCard";
import { BulkOrderKanbanBoard } from "./BulkOrderKanbanBoard";

export type BulkOrderView = "table" | "kanban";

const VIEWS = [
  { value: "table", label: "Table", icon: List },
  { value: "kanban", label: "Kanban", icon: LayoutGrid },
] as const;

function ItemsTable({
  refCode,
  items,
}: {
  refCode: number;
  items: BulkOrderItem[];
}) {
  const router = useRouter();

  return (
    <>
      <div className="grid gap-3 sm:hidden">
        {items.map((item) => (
          <BulkOrderItemCard
            key={item.serialNumber}
            refCode={refCode}
            item={item}
            showStage
          />
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-xl border bg-card sm:block">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-12">#</TableHead>
                <TableHead className="min-w-56">Design</TableHead>
                <TableHead className="min-w-32">Stage</TableHead>
                <TableHead className="min-w-40">Status</TableHead>
                <TableHead className="min-w-32">Est. delivery</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const href = getBulkItemHref(refCode, item.serialNumber);
                const status = getBulkItemStatus(item);
                return (
                  <TableRow
                    key={item.serialNumber}
                    className={cn(
                      "cursor-pointer",
                      status === "Cancelled" && "text-muted-foreground",
                    )}
                    onClick={() => router.push(href)}
                  >
                    <TableCell className="tabular-nums text-muted-foreground">
                      {item.serialNumber}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <BulkItemThumbnail item={item} />
                        <div className="min-w-0">
                          <Link
                            href={href}
                            className="font-mono text-sm font-medium text-foreground hover:underline"
                          >
                            {item.vendorDesignNumber}
                          </Link>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {item.category} · {item.productSize}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StageBadge stage={item.stage} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm tabular-nums">
                          {item.quantity} pcs
                        </span>
                        <FulfilmentBadge status={status} />
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <span className="inline-flex items-center gap-2 whitespace-nowrap">
                        {isBulkItemPending(item) && (
                          <UrgencyDot level={getBulkItemUrgency(item)} />
                        )}
                        {formatBulkDate(item.estimatedDeliveryDate)}
                      </span>
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-medium tabular-nums",
                        status === "Cancelled" && "line-through",
                      )}
                    >
                      {formatCurrency(item.amounts.quoted)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}

export function BulkOrderItemsTracker({
  refCode,
  items,
  view,
  onViewChange,
  onMove,
}: {
  refCode: number;
  items: BulkOrderItem[];
  view: BulkOrderView;
  onViewChange: (view: BulkOrderView) => void;
  onMove: (item: BulkOrderItem, stage: BulkItemStage) => void;
}) {
  const [filter, setFilter] = useState<FulfilmentFilter>("all");
  const [stage, setStage] = useState<BulkItemStage | "all">("all");
  const [search, setSearch] = useState("");
  const query = search.trim().toLowerCase();
  const activeStage = view === "table" ? stage : "all";
  const countOf = (value: FulfilmentFilter) =>
    items.filter((item) => matchesItemFilter(value, item)).length;
  const cancelledCount = countOf("cancelled");
  const filters: Array<{ value: FulfilmentFilter; label: string }> = [
    { value: "all", label: `All items (${items.length})` },
    { value: "pending", label: `Pending (${countOf("pending")})` },
    { value: "filled", label: `Filled (${countOf("filled")})` },
    ...(cancelledCount || filter === "cancelled"
      ? [
          {
            value: "cancelled" as const,
            label: `Cancelled (${cancelledCount})`,
          },
        ]
      : []),
  ];
  const hasFilters =
    Boolean(query) || filter !== "all" || activeStage !== "all";
  const visibleItems = items.filter(
    (item) =>
      matchesItemFilter(filter, item) &&
      (activeStage === "all" || item.stage === activeStage) &&
      [item.vendorDesignNumber, item.category, item.productSize].some((value) =>
        value.toLowerCase().includes(query),
      ),
  );

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1 basis-56">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            aria-label="Search items by design, category, or size"
            placeholder="Search design or category"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
            maxLength={255}
          />
        </div>
        <Select
          value={filter}
          onValueChange={(value) =>
            setFilter(
              filters.find((option) => option.value === value)?.value ?? "all",
            )
          }
        >
          <SelectTrigger aria-label="Filter items by fulfilment">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {filters.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {view === "table" && (
          <Select
            value={stage}
            onValueChange={(value) =>
              setStage(
                BULK_ITEM_STAGES.find((option) => option === value) ?? "all",
              )
            }
          >
            <SelectTrigger aria-label="Filter items by stage">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All stages</SelectItem>
              {BULK_ITEM_STAGES.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setFilter("all");
              setStage("all");
            }}
          >
            Clear
          </Button>
        )}
        <div className="ml-auto flex shrink-0 items-center gap-1 rounded-lg border border-border bg-background p-1">
          {VIEWS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              aria-label={`${label} view`}
              aria-pressed={view === value}
              onClick={() => onViewChange(value)}
              className={cn(
                "flex min-h-7 cursor-pointer items-center gap-1.5 rounded-md px-2.5 text-sm font-medium transition-colors",
                view === value
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {visibleItems.length === 0 ? (
        <div className="rounded-xl border border-dashed px-5 py-10 text-center">
          <Package className="mx-auto mb-3 size-6 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            No items match these filters
          </p>
        </div>
      ) : view === "kanban" ? (
        <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <BulkOrderKanbanBoard
            refCode={refCode}
            items={visibleItems}
            onMove={onMove}
          />
        </section>
      ) : (
        <ItemsTable refCode={refCode} items={visibleItems} />
      )}
    </section>
  );
}
