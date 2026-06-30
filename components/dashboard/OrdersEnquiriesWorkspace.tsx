"use client";

import {
  Filter,
  LayoutGrid,
  List,
  PackagePlus,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type RefObject, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEnquiries } from "@/hooks/useEnquiries";
import { useOrders } from "@/hooks/useOrders";
import { useStockSales, useSyncStockSales } from "@/hooks/useStockSales";
import { getSessionRole } from "@/lib/auth";
import { authClient } from "@/lib/auth-client";
import { mapBackendEnquiryListItemToOrder } from "@/lib/enquiryMappers";
import { ENQUIRY_STATUS_LABELS, getRecordStatus } from "@/lib/enquiryStatus";
import { mapBackendOrderListItemToOrder } from "@/lib/orderMappers";
import { getFirstName, getInitials, normalizePerson } from "@/lib/people";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { Order, PersonSummary, RecordType } from "@/types";
import type { BackendEnquiryStatus } from "@/types/enquiry-api";
import type { BackendStockSaleRow } from "@/types/stock-sales-api";
import { KanbanBoard, type KanbanColumnConfig } from "./KanbanBoard";

type TypeTab = RecordType | "purchase";
type ViewMode = "table" | "kanban";
type DateFilter = "all" | "7d" | "30d" | "90d";

const TAB_STORAGE_KEY = "evol:orders-enquiries:tab";
const ENQUIRY_STATUSES: BackendEnquiryStatus[] = [
  "NEW",
  "ESTIMATED",
  "CONVERTED",
  "CLOSED",
];
const ENQUIRY_STATUS_OPTIONS = [
  "all",
  ...ENQUIRY_STATUSES.map((status) => ENQUIRY_STATUS_LABELS[status]),
] as const;
const ORDER_STAGES = [
  "New",
  "CAD Design",
  "In Production",
  "Certification",
  "At Store",
  "In Transit",
  "Delivered",
  "Closed",
  "Cancelled",
] as const;
const ORDER_STATUS_OPTIONS = ["all", ...ORDER_STAGES] as const;
const ORDER_KANBAN_COLUMNS: KanbanColumnConfig[] = ORDER_STAGES.map(
  (stage) => ({
    id: stage,
    label: stage,
  }),
);
const ENQUIRY_KANBAN_COLUMNS: KanbanColumnConfig[] = [
  ...ENQUIRY_STATUSES.map((status) => ({
    id: ENQUIRY_STATUS_LABELS[status],
    label: ENQUIRY_STATUS_LABELS[status],
  })),
];

function isTypeTab(value: unknown): value is TypeTab {
  return value === "order" || value === "enquiry" || value === "purchase";
}

function getTypeTabFromSearchParams(searchParams: URLSearchParams) {
  const type = searchParams.get("type");
  if (type === "enquiries") return "enquiry";
  if (type === "purchases") return "purchase";
  return isTypeTab(type) ? type : null;
}

function readStoredTypeTab(): TypeTab | null {
  if (typeof window === "undefined") return null;

  try {
    const value = window.localStorage.getItem(TAB_STORAGE_KEY);
    return isTypeTab(value) ? value : null;
  } catch {
    return null;
  }
}

function writeStoredTypeTab(tab: TypeTab) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(TAB_STORAGE_KEY, tab);
  } catch {
    // Storage can fail in private mode or when quota is exceeded.
  }
}

function isWithinDateFilter(date: string, filter: DateFilter) {
  if (filter === "all") return true;
  const days = Number(filter.replace("d", ""));
  const created = new Date(date);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return created >= cutoff;
}

function getKanbanStatus(record: Order): string {
  return getRecordStatus(record);
}

function statusBadgeClass(status: string) {
  if (status === "Closed" || status === "Delivered" || status === "Cancelled") {
    return "border-muted-foreground/20 bg-muted text-foreground dark:border-muted-foreground/20 dark:bg-muted/50";
  }
  if (status === "Converted" || status === "Order Confirmed") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400";
  }
  if (status === "Estimated") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400";
  }
  if (status === "New") {
    return "border-red-500/20 bg-red-500/10 text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400";
  }
  if (status === "In Progress") {
    return "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400";
  }
  if (status === "In Production" || status === "Certification") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400";
  }
  return "border-border bg-muted text-muted-foreground";
}

function FilterSelect({
  label: _label,
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
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className="h-10 w-full bg-background disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-36">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>{children}</SelectContent>
    </Select>
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
                  : `/orders/${record.refCode}`;

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
                          : (record.orderNumber ?? `#${record.refCode}`)}
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
                      {status}
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
                    : (record.orderNumber ?? `#${record.refCode}`)}
                </p>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "shrink-0 whitespace-nowrap",
                  statusBadgeClass(status),
                )}
              >
                {status}
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

function formatStockSaleAmount(amount: string) {
  const parsed = Number(amount);
  return Number.isFinite(parsed) ? formatCurrency(parsed) : amount;
}

function formatStockSaleMonth(saleMonth: string | null) {
  if (!saleMonth) return "-";
  return new Date(saleMonth).toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  });
}

function getStockSaleProductCodes(sale: BackendStockSaleRow) {
  return sale.items.map((item) => item.productCode).filter(Boolean);
}

function getErrorMessage(error: unknown, fallback = "Something went wrong") {
  return error instanceof Error ? error.message : fallback;
}

function StockSaleProductCodes({ sale }: { sale: BackendStockSaleRow }) {
  const codes = getStockSaleProductCodes(sale);
  const visibleCodes = codes.slice(0, 2);
  const hiddenCount = codes.length - visibleCodes.length;

  if (codes.length === 0) {
    return <span className="text-muted-foreground">-</span>;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex max-w-72 flex-wrap gap-1">
            {visibleCodes.map((code) => (
              <Badge
                className="font-mono text-[11px] font-medium"
                key={code}
                variant="secondary"
              >
                {code}
              </Badge>
            ))}
            {hiddenCount > 0 && (
              <Badge
                className="border-border bg-transparent text-muted-foreground"
                variant="outline"
              >
                +{hiddenCount} more
              </Badge>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-80" side="top" sideOffset={6}>
          <div className="flex flex-wrap gap-1.5">
            {codes.map((code) => (
              <span
                className="rounded border border-background/20 px-1.5 py-0.5 font-mono text-[11px]"
                key={code}
              >
                {code}
              </span>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function StockPurchasesTable({
  sales,
  isLoading,
  isError,
  isFetchingNextPage,
  hasNextPage,
  loadMoreRef,
}: {
  sales: BackendStockSaleRow[];
  isLoading: boolean;
  isError: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  loadMoreRef: RefObject<HTMLDivElement | null>;
}) {
  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground">Loading purchases...</p>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-dashed border-border py-16 text-center">
        <p className="text-sm font-medium text-muted-foreground">
          Could not load purchases
        </p>
      </div>
    );
  }

  if (sales.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border py-16 text-center">
        <p className="text-sm font-medium text-muted-foreground">
          No stock purchases found
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card my-4">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="min-w-52">Customer</TableHead>
              <TableHead className="w-72 min-w-72">Product codes</TableHead>
              <TableHead className="min-w-32">Amount</TableHead>
              <TableHead className="min-w-40">Sales person</TableHead>
              <TableHead className="min-w-36">Store</TableHead>
              <TableHead className="min-w-40">Source</TableHead>
              <TableHead className="min-w-28">Month</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.map((sale) => (
              <TableRow key={sale.id}>
                <TableCell>
                  <p className="font-medium text-foreground">
                    {sale.customerName}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {sale.stockType ?? "Stock sale"}
                  </p>
                </TableCell>
                <TableCell className="w-72 min-w-72">
                  <StockSaleProductCodes sale={sale} />
                </TableCell>
                <TableCell className="font-medium text-foreground">
                  {formatStockSaleAmount(sale.totalAmount)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {sale.salesPerson?.name ?? "-"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {sale.location?.name ?? sale.storeName ?? "-"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {sale.source ?? "-"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatStockSaleMonth(sale.saleMonth)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div ref={loadMoreRef} className="h-4" />
      {isFetchingNextPage ? (
        <p className="py-3 text-center text-xs text-muted-foreground">
          Fetching more purchases...
        </p>
      ) : !hasNextPage ? (
        <p className="py-3 text-center text-xs text-muted-foreground">
          -- End of List --
        </p>
      ) : null}
    </div>
  );
}

export function OrdersEnquiriesWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = authClient.useSession();
  const [typeTab, setTypeTab] = useState<TypeTab>(() => {
    const queryTab = getTypeTabFromSearchParams(searchParams);
    return queryTab ?? readStoredTypeTab() ?? "order";
  });
  const enquiriesQuery = useEnquiries({}, { enabled: typeTab === "enquiry" });
  const ordersQuery = useOrders(
    { limit: 100 },
    { enabled: typeTab === "order" },
  );
  const [search, setSearch] = useState("");
  const sessionRole = session ? getSessionRole(session) : "";
  const canCreateOrder = ["ADMIN", "OPERATIONS"].includes(sessionRole);
  const canViewPurchases = ["ADMIN", "OPERATIONS"].includes(sessionRole);
  const canSyncPurchases = ["ADMIN", "OPERATIONS"].includes(sessionRole);
  const stockSalesQuery = useStockSales(
    { limit: 40, search: search.trim() || undefined },
    { enabled: typeTab === "purchase" && canViewPurchases },
  );
  const syncStockSalesMutation = useSyncStockSales();
  const stockSalesLoadMoreRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const isKanbanMode = viewMode === "kanban";

  useEffect(() => {
    const queryTab = getTypeTabFromSearchParams(searchParams);
    if (queryTab && (queryTab !== "purchase" || canViewPurchases)) {
      setTypeTab(queryTab);
    }
  }, [canViewPurchases, searchParams]);

  useEffect(() => {
    if (session && !canViewPurchases && typeTab === "purchase") {
      setTypeTab("order");
    }
  }, [canViewPurchases, session, typeTab]);

  useEffect(() => {
    writeStoredTypeTab(typeTab);
  }, [typeTab]);

  useEffect(() => {
    if (typeTab !== "purchase" || !canViewPurchases) return;

    const sentinel = stockSalesLoadMoreRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (
          entry.isIntersecting &&
          stockSalesQuery.hasNextPage &&
          !stockSalesQuery.isFetchingNextPage
        ) {
          stockSalesQuery.fetchNextPage();
        }
      },
      { rootMargin: "360px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [
    stockSalesQuery.fetchNextPage,
    stockSalesQuery.hasNextPage,
    stockSalesQuery.isFetchingNextPage,
    canViewPurchases,
    typeTab,
  ]);

  const apiEnquiries = useMemo(
    () =>
      (enquiriesQuery.data ?? []).map((enquiry) =>
        mapBackendEnquiryListItemToOrder(enquiry),
      ),
    [enquiriesQuery.data],
  );
  const apiOrders = useMemo(
    () =>
      (ordersQuery.data ?? []).map((order) =>
        mapBackendOrderListItemToOrder(order),
      ),
    [ordersQuery.data],
  );
  const records = useMemo(
    () => (typeTab === "order" ? apiOrders : apiEnquiries),
    [apiEnquiries, apiOrders, typeTab],
  );
  const stockSales = useMemo(
    () => stockSalesQuery.data?.pages.flatMap((page) => page.data) ?? [],
    [stockSalesQuery.data],
  );

  const tabCounts = useMemo(
    () => ({
      order: typeTab === "order" ? records.length : undefined,
      enquiry: typeTab === "enquiry" ? records.length : undefined,
      purchase: typeTab === "purchase" ? stockSales.length : undefined,
    }),
    [records.length, stockSales.length, typeTab],
  );
  const typeTabs = useMemo(
    () => [
      { key: "order" as const, label: "Orders", count: tabCounts.order },
      {
        key: "enquiry" as const,
        label: "Enquiries",
        count: tabCounts.enquiry,
      },
      ...(canViewPurchases
        ? [
            {
              key: "purchase" as const,
              label: "Purchases",
              count: tabCounts.purchase,
            },
          ]
        : []),
    ],
    [canViewPurchases, tabCounts.enquiry, tabCounts.order, tabCounts.purchase],
  );

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    return records.filter((record) => {
      if (record.type !== typeTab) return false;
      if (!isWithinDateFilter(record.createdAt, dateFilter)) return false;

      if (statusFilter !== "all") {
        const status = getRecordStatus(record);
        if (status !== statusFilter) {
          return false;
        }
      }

      if (query) {
        const haystack = [
          record.customerName,
          record.orderNumber ?? "",
          record.refCode ? String(record.refCode) : "",
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
    () => records.filter((record) => record.type === typeTab),
    [records, typeTab],
  );
  const kanbanColumns =
    typeTab === "order" ? ORDER_KANBAN_COLUMNS : ENQUIRY_KANBAN_COLUMNS;
  const shownRecordCount = isKanbanMode
    ? kanbanRecords.length
    : filteredRecords.length;
  const purchasesShownCount = stockSales.length;
  const isFilterDisabled = isKanbanMode || typeTab === "purchase";

  const sectionHeading =
    typeTab === "order"
      ? "Orders"
      : typeTab === "enquiry"
        ? "Enquiries"
        : "Purchases";
  const activeFilterCount =
    (search.trim() ? 1 : 0) +
    (statusFilter !== "all" ? 1 : 0) +
    (dateFilter !== "all" ? 1 : 0);
  const clearSecondaryFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setDateFilter("all");
  };
  const handleTypeTabChange = (tab: TypeTab) => {
    setTypeTab(tab);
    if (tab === "purchase") {
      setViewMode("table");
    }
    setStatusFilter("all");
  };
  const handleSyncPurchases = async () => {
    try {
      const summary = await syncStockSalesMutation.mutateAsync();
      toast.success(
        `Purchase sync completed: ${summary.transactionsInserted} purchases imported`,
      );
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not sync purchases"));
    }
  };
  const sectionCount =
    typeTab === "purchase" ? purchasesShownCount : shownRecordCount;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 text-left sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-3">
            <h1 className="min-w-0 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Orders and enquiries
            </h1>
            <div className="flex shrink-0 items-center gap-2 sm:hidden">
              <Button asChild size="sm">
                <Link href="/enquiries/new">
                  <Plus className="h-4 w-4" />
                  New enquiry
                </Link>
              </Button>
              {canCreateOrder ? (
                <Button asChild size="sm" variant="secondary">
                  <Link href="/orders/new">
                    <PackagePlus className="h-4 w-4" />
                    New order
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>
          <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">
            Filter, review, and move production records without crowding the
            dashboard.
          </p>
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <Button asChild>
            <Link href="/enquiries/new">
              <Plus className="h-4 w-4" />
              New enquiry
            </Link>
          </Button>
          {canCreateOrder ? (
            <Button asChild variant="secondary">
              <Link href="/orders/new">
                <PackagePlus className="h-4 w-4" />
                New order
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pr-8 scrollbar-none sm:mx-0 sm:flex-wrap sm:px-0">
          {typeTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleTypeTabChange(tab.key)}
              className={cn(
                "flex min-h-8 shrink-0 cursor-pointer items-center rounded-full border px-4 text-sm font-medium transition-colors",
                typeTab === tab.key
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div
          className={cn(
            "hidden w-full items-center gap-1 rounded-lg border border-border bg-background p-1 lg:w-auto",
            typeTab === "purchase" ? "lg:hidden" : "lg:flex",
          )}
        >
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
      </div>

      <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
        <div className="flex min-w-0 items-center justify-between gap-3 lg:block">
          <h2 className="shrink-0 text-base font-medium text-foreground lg:min-w-28">
            {sectionHeading}{" "}
            <span className="text-muted-foreground">({sectionCount})</span>
          </h2>

          <div className={cn("lg:hidden", typeTab === "purchase" && "hidden")}>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsMobileFiltersOpen(true)}
              className="h-10 shrink-0 justify-center gap-2"
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

        <div
          className={cn(
            "hidden justify-items-end min-w-0 flex-1 gap-3 lg:grid lg:grid-cols-[minmax(160px,1fr)_minmax(140px,180px)_minmax(120px,160px)] lg:items-center",
            typeTab === "purchase" && "lg:hidden",
          )}
        >
          <div className="relative w-1/2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search customer or ID"
              className="pl-9"
              disabled={isFilterDisabled}
            />
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
                {status === "all" ? "All statuses" : status}
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

        {typeTab === "purchase" ? (
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:w-auto lg:min-w-0 lg:flex-1 lg:justify-end">
            <div className="relative w-full sm:max-w-xs lg:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search customer, product code, or salesperson"
                className="h-10 pl-9"
                aria-label="Search purchases"
              />
            </div>
            {canSyncPurchases ? (
              <Button
                variant="outline"
                type="button"
                className="h-10 justify-center gap-2"
                onClick={() => void handleSyncPurchases()}
                disabled={syncStockSalesMutation.isPending}
              >
                <RefreshCw
                  className={cn(
                    "h-4 w-4",
                    syncStockSalesMutation.isPending && "animate-spin",
                  )}
                />
                {syncStockSalesMutation.isPending
                  ? "Syncing..."
                  : "Sync purchases"}
              </Button>
            ) : null}
          </div>
        ) : null}
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
                  {status === "all" ? "All statuses" : status}
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

      {(
        typeTab === "order"
          ? ordersQuery.isLoading
          : typeTab === "enquiry"
            ? enquiriesQuery.isLoading
            : false
      ) ? (
        <p className="text-sm text-muted-foreground">Loading records...</p>
      ) : null}

      {typeTab === "purchase" ? (
        <StockPurchasesTable
          sales={stockSales}
          isLoading={stockSalesQuery.isLoading}
          isError={stockSalesQuery.isError}
          isFetchingNextPage={stockSalesQuery.isFetchingNextPage}
          hasNextPage={Boolean(stockSalesQuery.hasNextPage)}
          loadMoreRef={stockSalesLoadMoreRef}
        />
      ) : viewMode === "table" ? (
        <>
          <div className="sm:hidden">
            <RecordsMobileList
              records={filteredRecords}
              showTypeColumn={false}
              onRowClick={(record) =>
                router.push(
                  record.type === "enquiry"
                    ? `/enquiries/${record.refCode}`
                    : `/orders/${record.refCode}`,
                )
              }
            />
          </div>
          <div className="hidden sm:block">
            <RecordsTable
              records={filteredRecords}
              showTypeColumn={false}
              onRowClick={(record) =>
                router.push(
                  record.type === "enquiry"
                    ? `/enquiries/${record.refCode}`
                    : `/orders/${record.refCode}`,
                )
              }
            />
          </div>
        </>
      ) : (
        <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <KanbanBoard
            orders={kanbanRecords}
            columns={kanbanColumns}
            getColumnId={getKanbanStatus}
            emptyLabel={typeTab === "order" ? "No orders" : "No enquiries"}
            onCardClick={(order) =>
              router.push(
                order.type === "enquiry"
                  ? `/enquiries/${order.refCode}`
                  : `/orders/${order.refCode}`,
              )
            }
          />
        </section>
      )}
    </div>
  );
}
