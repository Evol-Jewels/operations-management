"use client";

import { Filter, LayoutGrid, List, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEnquiries } from "@/hooks/useEnquiries";
import { mapBackendEnquiryListItemToOrder } from "@/lib/enquiryMappers";
import { getFirstName, getInitials, normalizePerson } from "@/lib/people";
import { useOrdersStore } from "@/lib/stores/orders-store";
import { cn, formatDate } from "@/lib/utils";
import {
  type EnquiryItemStatus,
  type Order,
  type PersonSummary,
  type RecordType,
  STAGES,
} from "@/types";
import { KanbanBoard, type KanbanColumnConfig } from "./KanbanBoard";

type TypeTab = "all" | RecordType;
type ViewMode = "table" | "kanban";
type DateFilter = "all" | "7d" | "30d" | "90d";

const ENQUIRY_STATUS_OPTIONS = [
  "all",
  "PENDING",
  "ESTIMATED",
  "CONVERTED",
  "CLOSED",
] as const;
const ORDER_STATUS_OPTIONS = ["all", ...STAGES] as const;
const ENQUIRY_KANBAN_COLUMNS: KanbanColumnConfig[] = [
  { id: "Enquiry", label: "Enquiry" },
  { id: "Estimation", label: "Estimation" },
  { id: "Order Confirmed", label: "Converted", shortLabel: "Converted" },
  { id: "Closed", label: "Closed" },
];

function isWithinDateFilter(date: string, filter: DateFilter) {
  if (filter === "all") return true;
  const days = Number(filter.replace("d", ""));
  const created = new Date(date);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return created >= cutoff;
}

function getEnquiryStatus(order: Order): EnquiryItemStatus {
  if (order.status === "closed") return "CLOSED";
  if (order.currentStage === "Order Confirmed") return "CONVERTED";
  if (order.currentStage === "Estimation") return "ESTIMATED";
  return "PENDING";
}

function getRecordStatus(order: Order) {
  if (order.type === "enquiry") return getEnquiryStatus(order);
  return order.currentStage;
}

function getKanbanStatus(record: Order): string {
  if (record.status === "closed") return "Closed";
  return record.currentStage;
}

function statusBadgeClass(status: string) {
  if (status === "CLOSED" || status === "Customer Pickup") {
    return "border-muted-foreground/20 bg-muted text-foreground dark:border-muted-foreground/20 dark:bg-muted/50";
  }
  if (status === "CONVERTED" || status === "Order Confirmed") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400";
  }
  if (status === "ESTIMATED" || status === "Estimation") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400";
  }
  if (status === "PENDING" || status === "Enquiry") {
    return "border-red-500/20 bg-red-500/10 text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400";
  }
  if (status === "Building" || status === "Certification") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400";
  }
  return "border-border bg-muted text-muted-foreground";
}

function FilterSelect({
  label,
  value,
  onValueChange,
  disabled,
  children,
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <span className="text-[11px] font-medium text-muted-foreground">
        {label}
      </span>
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger className="h-10 w-full bg-background disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
    </div>
  );
}

function OrdersNotAvailable() {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card py-20 text-center">
      <p className="text-base font-medium text-foreground">
        Orders are not available yet!
      </p>
      <p className="mt-1 text-sm text-muted-foreground">Coming soon!</p>
    </div>
  );
}

function PersonAvatar({
  person,
  className,
}: {
  person?: PersonSummary | string;
  className?: string;
}) {
  const normalized = normalizePerson(person);

  return (
    <Avatar className={cn("size-7 shrink-0", className)}>
      {normalized.image ? (
        <AvatarImage src={normalized.image} alt={normalized.name} />
      ) : null}
      <AvatarFallback className="text-xs font-medium">
        {getInitials(normalized)}
      </AvatarFallback>
    </Avatar>
  );
}

function RecordsTable({
  records,
  onRowClick,
  showTypeColumn,
}: {
  records: Order[];
  onRowClick: (record: Order) => void;
  showTypeColumn: boolean;
}) {
  if (records.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border py-16 text-center">
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
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="min-w-56">Customer</TableHead>
              {showTypeColumn ? <TableHead>Type</TableHead> : null}
              <TableHead className="min-w-36">Status</TableHead>
              <TableHead className="min-w-36">Created</TableHead>
              <TableHead className="min-w-36">Created By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record) => {
              const status = getRecordStatus(record);
              const href =
                record.type === "enquiry"
                  ? `/enquiries/${record.refCode}`
                  : `/orders/${record.shareableToken}`;

              return (
                <TableRow
                  key={record.id}
                  className="cursor-pointer"
                  onClick={() => onRowClick(record)}
                >
                  <TableCell>
                    <div className="min-w-0">
                      <Link href={href} className="font-medium text-foreground">
                        {record.customerName}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {record.type === "enquiry"
                          ? `#${record.refCode}`
                          : (record.orderNumber ?? record.shareableToken)}
                      </p>
                    </div>
                  </TableCell>
                  {showTypeColumn ? (
                    <TableCell>
                      <Badge
                        variant={
                          record.type === "order" ? "default" : "outline"
                        }
                        className="capitalize"
                      >
                        {record.type}
                      </Badge>
                    </TableCell>
                  ) : null}
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "whitespace-nowrap",
                        statusBadgeClass(status),
                      )}
                    >
                      {status.toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(record.createdAt)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <PersonAvatar
                        person={record.createdBy ?? record.salespersonName}
                      />
                      <span className="truncate text-foreground">
                        {getFirstName(
                          record.createdBy ?? record.salespersonName,
                        )}
                      </span>
                    </div>
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

function RecordsMobileList({
  records,
  onRowClick,
  showTypeColumn,
}: {
  records: Order[];
  onRowClick: (record: Order) => void;
  showTypeColumn: boolean;
}) {
  if (records.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border py-10 text-center">
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
    <div className="space-y-3">
      {records.map((record) => {
        const status = getRecordStatus(record);

        return (
          <button
            key={record.id}
            type="button"
            onClick={() => onRowClick(record)}
            className="w-full rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">
                  {record.customerName}
                </p>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {record.type === "enquiry"
                    ? `#${record.refCode}`
                    : (record.orderNumber ?? record.shareableToken)}
                </p>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "shrink-0 whitespace-nowrap",
                  statusBadgeClass(status),
                )}
              >
                {status.toLowerCase()}
              </Badge>
            </div>
            <div className="mt-4 grid gap-2 text-xs text-muted-foreground">
              <div className="flex items-center justify-between gap-3">
                <span>Created</span>
                <span className="font-medium text-foreground">
                  {formatDate(record.createdAt)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Created by</span>
                <div className="flex min-w-0 items-center gap-2">
                  <PersonAvatar
                    person={record.createdBy ?? record.salespersonName}
                    className="size-6"
                  />
                  <span className="min-w-0 truncate font-medium text-foreground">
                    {getFirstName(record.createdBy ?? record.salespersonName)}
                  </span>
                </div>
              </div>
              {showTypeColumn ? (
                <div className="flex items-center justify-between gap-3">
                  <span>Type</span>
                  <Badge
                    variant={record.type === "order" ? "default" : "outline"}
                    className="capitalize"
                  >
                    {record.type}
                  </Badge>
                </div>
              ) : null}
            </div>
          </button>
        );
      })}
    </div>
  );
}

export function OrdersEnquiriesWorkspace() {
  const router = useRouter();
  const storeRecords = useOrdersStore((state) => state.records);
  const enquiriesQuery = useEnquiries();
  const [typeTab, setTypeTab] = useState<TypeTab>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const isKanbanMode = viewMode === "kanban";

  const apiEnquiries = useMemo(
    () =>
      (enquiriesQuery.data ?? []).map((enquiry) =>
        mapBackendEnquiryListItemToOrder(enquiry),
      ),
    [enquiriesQuery.data],
  );
  const records = useMemo(
    () => [
      ...storeRecords.filter((record) => record.type === "order"),
      ...apiEnquiries,
    ],
    [apiEnquiries, storeRecords],
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
          record.createdBy?.name ?? "",
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
  }, [dateFilter, records, search, statusFilter, typeTab]);

  const kanbanRecords = useMemo(
    () => records.filter((record) => record.type === "enquiry"),
    [records],
  );
  const enquiryKanbanColumns = useMemo(() => {
    const presentStatuses = new Set(kanbanRecords.map(getKanbanStatus));
    const visibleColumns = ENQUIRY_KANBAN_COLUMNS.filter((column) =>
      presentStatuses.has(column.id),
    );

    return visibleColumns.length > 0 ? visibleColumns : ENQUIRY_KANBAN_COLUMNS;
  }, [kanbanRecords]);
  const shownRecordCount = isKanbanMode
    ? kanbanRecords.length
    : filteredRecords.length;
  const totalRecordCount = isKanbanMode ? tabCounts.enquiry : records.length;
  const isFilterDisabled = isKanbanMode;

  const sectionHeading =
    typeTab === "all"
      ? "All records"
      : typeTab === "order"
        ? "Orders"
        : "Enquiries";
  const activeFilterCount =
    (search.trim() ? 1 : 0) +
    (statusFilter !== "all" ? 1 : 0) +
    (dateFilter !== "all" ? 1 : 0);
  const clearSecondaryFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setDateFilter("all");
  };
  const recordCountLabel = (
    <>
      <span className="sm:hidden">
        <strong className="font-medium text-foreground">
          {shownRecordCount}
        </strong>{" "}
        of{" "}
        <strong className="font-medium text-foreground">
          {totalRecordCount}
        </strong>
      </span>
      <span className="hidden sm:inline">
        Showing{" "}
        <strong className="font-medium text-foreground">
          {shownRecordCount}
        </strong>{" "}
        of{" "}
        <strong className="font-medium text-foreground">
          {totalRecordCount}
        </strong>{" "}
        records
      </span>
    </>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 text-left sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-3">
            <h1 className="min-w-0 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Orders and enquiries
            </h1>
            <Button asChild size="sm" className="shrink-0 sm:hidden">
              <Link href="/enquiries/new">+ New enquiry</Link>
            </Button>
          </div>
          <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">
            Filter, review, and move production records without crowding the
            dashboard.
          </p>
        </div>
        <Button asChild className="hidden sm:inline-flex">
          <Link href="/enquiries/new">+ New enquiry</Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pr-8 scrollbar-none sm:mx-0 sm:flex-wrap sm:px-0">
          {[
            { key: "all" as const, label: "All", count: tabCounts.all },
            { key: "order" as const, label: "Orders", count: tabCounts.order },
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
                "flex min-h-8 shrink-0 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors",
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

        <div className="hidden w-full items-center gap-1 rounded-lg border border-border bg-background p-1 lg:flex lg:w-auto">
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={cn(
              "flex min-h-9 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors sm:flex-none",
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
              "flex min-h-9 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors sm:flex-none",
              viewMode === "kanban"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <LayoutGrid className="h-4 w-4" />
            Kanban
          </button>
        </div>

        <div className="lg:hidden">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsMobileFiltersOpen(true)}
            className="w-full justify-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 ? (
              <Badge variant="secondary" className="ml-0.5 px-1.5">
                {activeFilterCount}
              </Badge>
            ) : null}
          </Button>
        </div>
      </div>

      <div className="hidden gap-3 lg:grid lg:grid-cols-[minmax(240px,1fr)_auto_auto] lg:items-end">
        <div className="grid gap-1.5">
          <span className="text-[11px] font-medium text-muted-foreground">
            Search
          </span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search customer or ID"
              className="pl-9"
              disabled={isFilterDisabled}
            />
          </div>
        </div>

        <FilterSelect
          label="Status"
          value={statusFilter}
          onValueChange={setStatusFilter}
          disabled={isFilterDisabled}
        >
          {(typeTab === "enquiry"
            ? ENQUIRY_STATUS_OPTIONS
            : ORDER_STATUS_OPTIONS
          ).map((status) => (
            <SelectItem key={status} value={status}>
              {status === "all" ? "All statuses" : status.toLowerCase()}
            </SelectItem>
          ))}
        </FilterSelect>

        <FilterSelect
          label="Creation Date"
          value={dateFilter}
          onValueChange={(value) => setDateFilter(value as DateFilter)}
          disabled={isFilterDisabled}
        >
          <SelectItem value="all">All time</SelectItem>
          <SelectItem value="7d">Last 7 days</SelectItem>
          <SelectItem value="30d">Last 30 days</SelectItem>
          <SelectItem value="90d">Last 90 days</SelectItem>
        </FilterSelect>
      </div>

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-medium text-foreground">
          {sectionHeading}
        </h2>
        <p className="shrink-0 text-sm text-muted-foreground">
          {recordCountLabel}
        </p>
      </div>

      <Sheet open={isMobileFiltersOpen} onOpenChange={setIsMobileFiltersOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-xl p-0 lg:hidden w-full sm:left-1/2 sm:-translate-x-1/2 sm:w-1/2"
        >
          <SheetHeader className="border-b border-border px-4 py-4 text-left">
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 px-4 py-4">
            <div className="grid gap-1.5">
              <span className="text-[11px] font-medium text-muted-foreground">
                Search
              </span>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search customer or ID"
                  className="pl-9"
                  disabled={isFilterDisabled}
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <span className="text-[11px] font-medium text-muted-foreground">
                View
              </span>
              <div className="flex w-full items-center gap-1 rounded-lg border border-border bg-background p-1">
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={cn(
                    "flex min-h-9 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors",
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
                    "flex min-h-9 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors",
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
            <FilterSelect
              label="Status"
              value={statusFilter}
              onValueChange={setStatusFilter}
              disabled={isFilterDisabled}
            >
              {(typeTab === "enquiry"
                ? ENQUIRY_STATUS_OPTIONS
                : ORDER_STATUS_OPTIONS
              ).map((status) => (
                <SelectItem key={status} value={status}>
                  {status === "all" ? "All statuses" : status.toLowerCase()}
                </SelectItem>
              ))}
            </FilterSelect>
            <FilterSelect
              label="Creation Date"
              value={dateFilter}
              onValueChange={(value) => setDateFilter(value as DateFilter)}
              disabled={isFilterDisabled}
            >
              <SelectItem value="all">All time</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </FilterSelect>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={clearSecondaryFilters}
              >
                Clear
              </Button>
              <Button
                type="button"
                onClick={() => setIsMobileFiltersOpen(false)}
              >
                Apply
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* <FilterSelect
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
      </FilterSelect> */}

      {enquiriesQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading enquiries...</p>
      ) : null}

      {typeTab === "order" ? (
        <OrdersNotAvailable />
      ) : viewMode === "table" ? (
        <>
          <div className="sm:hidden">
            <RecordsMobileList
              records={filteredRecords}
              showTypeColumn={typeTab !== "enquiry"}
              onRowClick={(record) =>
                router.push(
                  record.type === "enquiry"
                    ? `/enquiries/${record.refCode}`
                    : `/orders/${record.shareableToken}`,
                )
              }
            />
          </div>
          <div className="hidden sm:block">
            <RecordsTable
              records={filteredRecords}
              showTypeColumn={typeTab !== "enquiry"}
              onRowClick={(record) =>
                router.push(
                  record.type === "enquiry"
                    ? `/enquiries/${record.refCode}`
                    : `/orders/${record.shareableToken}`,
                )
              }
            />
          </div>
        </>
      ) : (
        <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <KanbanBoard
            orders={kanbanRecords}
            columns={enquiryKanbanColumns}
            getColumnId={getKanbanStatus}
            emptyLabel="No enquiries"
            onCardClick={(order) =>
              router.push(
                order.type === "enquiry"
                  ? `/enquiries/${order.refCode}`
                  : `/orders/${order.shareableToken}`,
              )
            }
          />
        </section>
      )}
    </div>
  );
}
