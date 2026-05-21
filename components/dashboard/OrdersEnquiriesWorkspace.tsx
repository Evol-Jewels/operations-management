"use client";

import { CheckCircle2, LayoutGrid, List, Search, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useOrdersStore } from "@/lib/stores/orders-store";
import { cn, formatCurrency, formatDate, getUrgencyLevel } from "@/lib/utils";
import { type Order, type RecordType, STAGES, type Stage } from "@/types";
import { KanbanBoard } from "./KanbanBoard";
import { UrgencyDot } from "./UrgencyDot";

type TypeTab = "all" | RecordType;
type ViewMode = "table" | "kanban";
type DateFilter = "all" | "7d" | "30d" | "90d";

const STATUS_OPTIONS = ["all", "open", "closed", ...STAGES] as const;

function isWithinDateFilter(date: string, filter: DateFilter) {
  if (filter === "all") return true;
  const days = Number(filter.replace("d", ""));
  const created = new Date(date);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return created >= cutoff;
}

function getRecordStatus(order: Order) {
  if (order.type === "enquiry") {
    return order.status === "closed" ? "closed" : "open";
  }
  return order.currentStage;
}

function statusBadgeClass(status: string) {
  if (status === "closed" || status === "Customer Pickup") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300";
  }
  if (status === "open" || status === "Enquiry") {
    return "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300";
  }
  if (status === "Building" || status === "Certification") {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300";
  }
  return "border-border bg-muted text-muted-foreground";
}

function FilterSelect({
  label,
  value,
  onValueChange,
  children,
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <span className="text-[11px] font-medium text-muted-foreground">
        {label}
      </span>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="h-9 min-w-36 bg-background">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
    </div>
  );
}

function RecordsTable({ records }: { records: Order[] }) {
  if (records.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border py-16 text-center">
        <p className="text-sm font-medium text-muted-foreground">
          No records match these filters
        </p>
        <p className="mt-1 text-xs text-muted-foreground/70">
          Clear filters or switch tabs to see more records.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="min-w-56">Customer</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="min-w-36">Status</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="min-w-36">Created</TableHead>
              <TableHead className="min-w-36">Created By</TableHead>
              <TableHead className="min-w-36">Delivery</TableHead>
              <TableHead className="text-right">Value</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record) => {
              const urgency = getUrgencyLevel(record.deliveryDate);
              const status = getRecordStatus(record);
              const href =
                record.type === "enquiry"
                  ? `/enquiries/${record.shareableToken}`
                  : `/orders/${record.shareableToken}`;

              return (
                <TableRow key={record.id}>
                  <TableCell>
                    <div className="min-w-0">
                      <Link
                        href={href}
                        className="font-medium text-foreground hover:underline"
                      >
                        {record.customerName}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {record.orderNumber ?? record.shareableToken}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={record.type === "order" ? "default" : "outline"}
                      className="capitalize"
                    >
                      {record.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "whitespace-nowrap",
                        statusBadgeClass(status),
                      )}
                    >
                      {status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {record.category}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(record.createdAt)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {record.salespersonName}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <UrgencyDot level={urgency} />
                      <span className="text-sm text-muted-foreground">
                        {record.deliveryDate
                          ? formatDate(record.deliveryDate)
                          : "No date"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {record.totalEstimate
                      ? formatCurrency(record.totalEstimate)
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="icon-sm">
                      <Link href={href}>
                        <span className="sr-only">Open record</span>
                        <List className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function OrdersEnquiriesWorkspace() {
  const router = useRouter();
  const records = useOrdersStore((state) => state.records);
  const moveRecordStage = useOrdersStore((state) => state.moveRecordStage);
  const [typeTab, setTypeTab] = useState<TypeTab>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [createdByFilter, setCreatedByFilter] = useState("all");
  const [lastMoved, setLastMoved] = useState<{
    name: string;
    stage: Stage;
  } | null>(null);

  const createdByOptions = useMemo(
    () => [...new Set(records.map((record) => record.salespersonName))].sort(),
    [records],
  );

  const tabCounts = useMemo(
    () => ({
      all: records.length,
      order: records.filter((record) => record.type === "order").length,
      enquiry: records.filter((record) => record.type === "enquiry").length,
    }),
    [records],
  );

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    return records.filter((record) => {
      if (typeTab !== "all" && record.type !== typeTab) return false;
      if (
        createdByFilter !== "all" &&
        record.salespersonName !== createdByFilter
      ) {
        return false;
      }
      if (!isWithinDateFilter(record.createdAt, dateFilter)) return false;

      if (statusFilter !== "all") {
        const status = getRecordStatus(record);
        if (status !== statusFilter && record.currentStage !== statusFilter) {
          return false;
        }
      }

      if (query) {
        const haystack = [
          record.customerName,
          record.orderNumber ?? "",
          record.shareableToken,
          record.category,
          record.salespersonName,
          record.vendorName ?? "",
          record.customerPhone ?? "",
        ]
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(query)) return false;
      }

      return true;
    });
  }, [createdByFilter, dateFilter, records, search, statusFilter, typeTab]);

  const kanbanRecords = filteredRecords.filter(
    (record) => record.type === "order",
  );

  function clearFilters() {
    setSearch("");
    setStatusFilter("all");
    setDateFilter("all");
    setCreatedByFilter("all");
  }

  function handleOrderMove(orderId: string, newStage: Stage) {
    const movedOrder = records.find((record) => record.id === orderId);
    if (!movedOrder || movedOrder.currentStage === newStage) return;

    const timestamp = new Date().toISOString();
    moveRecordStage(orderId, newStage, {
      id: `act-${Date.now()}-kanban`,
      orderId: movedOrder.id,
      postedBy: "Dashboard User",
      actorRole: "sales",
      timestamp,
      type: "stage_change",
      previousStage: movedOrder.currentStage,
      newStage,
      note: `Moved from ${movedOrder.currentStage} to ${newStage} via orders workspace`,
    });

    setLastMoved({ name: movedOrder.customerName, stage: newStage });
    setTimeout(() => setLastMoved(null), 3000);
  }

  const hasFilters =
    search.trim() ||
    statusFilter !== "all" ||
    dateFilter !== "all" ||
    createdByFilter !== "all";

  return (
    <div className="space-y-6">
      {lastMoved && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200/80 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-700 shadow-sm dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
          <span>
            <strong>{lastMoved.name}</strong> moved to{" "}
            <strong>{lastMoved.stage}</strong>
          </span>
        </div>
      )}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Orders Workspace
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            Orders and enquiries
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Filter, review, and move production records without crowding the
            dashboard.
          </p>
        </div>
        <Button asChild>
          <Link href="/enquiries/new">Create New Enquiry</Link>
        </Button>
      </div>

      <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex flex-wrap gap-2">
            {[
              { key: "all" as const, label: "All", count: tabCounts.all },
              {
                key: "order" as const,
                label: "Orders",
                count: tabCounts.order,
              },
              {
                key: "enquiry" as const,
                label: "Enquiries",
                count: tabCounts.enquiry,
              },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setTypeTab(tab.key)}
                className={cn(
                  "flex min-h-9 cursor-pointer items-center gap-2 rounded-full border px-3 text-sm font-medium transition-colors",
                  typeTab === tab.key
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-background text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px]",
                    typeTab === tab.key
                      ? "bg-background/20 text-background"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-1">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={cn(
                "flex min-h-9 cursor-pointer items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors",
                viewMode === "table"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <List className="h-4 w-4" />
              Table
            </button>
            <button
              type="button"
              onClick={() => setViewMode("kanban")}
              className={cn(
                "flex min-h-9 cursor-pointer items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors",
                viewMode === "kanban"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <LayoutGrid className="h-4 w-4" />
              Kanban
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(240px,1fr)_auto_auto_auto_auto] lg:items-end">
          <div className="grid gap-1.5">
            <span className="text-[11px] font-medium text-muted-foreground">
              Search
            </span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Customer, order ID, product, salesperson"
                className="pl-9"
              />
            </div>
          </div>

          <FilterSelect
            label="Status"
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            {STATUS_OPTIONS.map((status) => (
              <SelectItem key={status} value={status}>
                {status === "all" ? "All statuses" : status}
              </SelectItem>
            ))}
          </FilterSelect>

          <FilterSelect
            label="Creation Date"
            value={dateFilter}
            onValueChange={(value) => setDateFilter(value as DateFilter)}
          >
            <SelectItem value="all">All time</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </FilterSelect>

          <FilterSelect
            label="Created By"
            value={createdByFilter}
            onValueChange={setCreatedByFilter}
          >
            <SelectItem value="all">Everyone</SelectItem>
            {createdByOptions.map((person) => (
              <SelectItem key={person} value={person}>
                {person}
              </SelectItem>
            ))}
          </FilterSelect>

          <Button
            type="button"
            variant="outline"
            onClick={clearFilters}
            disabled={!hasFilters}
            className="lg:mb-0"
          >
            <X className="h-4 w-4" />
            Clear
          </Button>
        </div>
      </section>

      <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
        <p>
          Showing{" "}
          <span className="font-medium text-foreground">
            {filteredRecords.length}
          </span>{" "}
          of{" "}
          <span className="font-medium text-foreground">{records.length}</span>{" "}
          records
        </p>
        {viewMode === "kanban" && typeTab !== "order" && (
          <p>Kanban shows order records only.</p>
        )}
      </div>

      {viewMode === "table" ? (
        <RecordsTable records={filteredRecords} />
      ) : (
        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <KanbanBoard
            orders={kanbanRecords}
            onOrderMove={handleOrderMove}
            onCardClick={(order) =>
              router.push(
                order.type === "enquiry"
                  ? `/enquiries/${order.shareableToken}`
                  : `/orders/${order.shareableToken}`,
              )
            }
          />
        </section>
      )}
    </div>
  );
}
