"use client";

import { History, RefreshCw, Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { BulkOrdersTab } from "@/components/bulk-orders/BulkOrdersTab";
import { OrderStatusDialog } from "@/components/order/OrderStatusDialog";
import {
  VendorDetailsDialog,
  type VendorDetailsValues,
} from "@/components/order/VendorDetailsDialog";
import { RepairsWorkspace } from "@/components/repairs/RepairsWorkspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEnquiries } from "@/hooks/useEnquiries";
import { useInfiniteOrders, useUpdateAnyOrderStatus } from "@/hooks/useOrders";
import {
  useRecentProductSales,
  useStockSales,
  useSyncStockSales,
} from "@/hooks/useStockSales";
import { captureProductEvent } from "@/lib/analytics";
import { getSessionRole } from "@/lib/auth";
import { authClient } from "@/lib/auth-client";
import { mapBackendEnquiryListItemToOrder } from "@/lib/enquiryMappers";
import { ENQUIRY_STATUS_LABELS, getRecordStatus } from "@/lib/enquiryStatus";
import { mapBackendOrderListItemToOrder } from "@/lib/orderMappers";
import { shouldPromptForVendorDetails } from "@/lib/orderVendorDetails";
import {
  getRecentSalesFilters,
  getRecentSalesRangeError,
  getRecentSalesUrlChanges,
  hasRecentSalesFilters,
  type RecentSalesFilters as RecentSalesFilterValues,
  toRecentProductSalesQuery,
} from "@/lib/recentSalesFilters";
import { cn } from "@/lib/utils";
import { isOlderTerminalRecord } from "@/lib/workspaceRecords";
import type { Order, RecordType } from "@/types";
import type { BackendEnquiryStatus } from "@/types/enquiry-api";
import type { BackendOrderStatus } from "@/types/order-api";
import { KanbanBoard, type KanbanColumnConfig } from "./KanbanBoard";
import { KanbanStageStrip } from "./KanbanStageStrip";
import { RecentProductSalesGrid } from "./RecentProductSalesGrid";
import { RecentSalesFilters } from "./RecentSalesFilters";
import { StockPurchasesTable } from "./StockPurchasesList";
import { WorkspaceHeader } from "./WorkspaceHeader";
import {
  type DateFilter,
  type SortBy,
  WorkspaceRecordFilters,
} from "./WorkspaceRecordFilters";
import { WorkspaceRecordsList } from "./WorkspaceRecordsList";

type TypeTab =
  | RecordType
  | "bulk-order"
  | "purchase"
  | "recent-sale"
  | "repair";
type ViewMode = "table" | "kanban";

const TAB_STORAGE_KEY = "evol:orders-enquiries:tab";
const ENQUIRY_STATUSES: BackendEnquiryStatus[] = [
  "NEW",
  "ESTIMATED",
  "CONVERTED",
  "CLOSED",
];
const ORDER_STAGES = [
  "New",
  "CAD Design",
  "In Production",
  "Certification",
  "At Store",
  "In Photoshoot",
  "Editing",
  "Post Editing",
  "Website Upload",
  "In Transit",
  "Delivered",
  "Closed",
  "Cancelled",
] as const;
const ORDER_KANBAN_COLUMNS: KanbanColumnConfig[] = ORDER_STAGES.map(
  (stage) => ({
    id: stage,
    label: stage,
  }),
);
const ORDER_STAGE_TO_STATUS: Record<
  (typeof ORDER_STAGES)[number],
  BackendOrderStatus
> = {
  New: "NEW",
  "CAD Design": "CAD_DESIGN",
  "In Production": "IN_PRODUCTION",
  Certification: "CERTIFICATION",
  "At Store": "AT_STORE",
  "In Photoshoot": "IN_PHOTOSHOOT",
  Editing: "EDITING",
  "Post Editing": "POST_EDITING",
  "Website Upload": "WEBSITE_UPLOAD",
  "In Transit": "IN_TRANSIT",
  Delivered: "DELIVERED",
  Closed: "CLOSED",
  Cancelled: "CANCELLED",
};
const PHOTOGRAPHY_ORDER_STAGES = [
  "In Photoshoot",
  "Editing",
  "Post Editing",
  "Website Upload",
] as const;
const KANBAN_BLOCKED_ORDER_STAGES = new Set<string>(["Closed", "Cancelled"]);
const ENQUIRY_KANBAN_COLUMNS: KanbanColumnConfig[] = [
  ...ENQUIRY_STATUSES.map((status) => ({
    id: ENQUIRY_STATUS_LABELS[status],
    label: ENQUIRY_STATUS_LABELS[status],
  })),
];
const ORDER_TYPES = ["STOCK", "CUSTOMER", "STOCK_REFILL"] as const;
const DATE_FILTERS: DateFilter[] = ["all", "7d", "30d", "90d", "custom"];
const SORT_FIELDS: SortBy[] = [
  "createdAt",
  "updatedAt",
  "name",
  "deliveryDate",
];
const RECENT_HISTORY_COLUMNS = ["Closed", "Cancelled", "Converted"];

function getDefaultSort(tab: TypeTab): {
  sortBy: SortBy;
  sortOrder: "asc" | "desc";
} {
  return tab === "order"
    ? { sortBy: "deliveryDate", sortOrder: "asc" }
    : { sortBy: "updatedAt", sortOrder: "desc" };
}

function isTypeTab(value: unknown): value is TypeTab {
  return (
    value === "order" ||
    value === "enquiry" ||
    value === "purchase" ||
    value === "repair" ||
    value === "bulk-order" ||
    value === "recent-sale"
  );
}

function getTypeTabFromSearchParams(searchParams: URLSearchParams) {
  const type = searchParams.get("type");
  if (type === "enquiries") return "enquiry";
  if (type === "purchases") return "purchase";
  if (type === "recent-sales") return "recent-sale";
  if (type === "repairs") return "repair";
  if (type === "bulk-orders") return "bulk-order";
  return isTypeTab(type) ? type : null;
}

function getViewModeFromSearchParams(searchParams: URLSearchParams) {
  const view = searchParams.get("view");
  return view === "table" || view === "kanban" ? view : null;
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

function getInitialTypeTab(searchParams: URLSearchParams): TypeTab {
  return (
    getTypeTabFromSearchParams(searchParams) ?? readStoredTypeTab() ?? "order"
  );
}

function getDefaultViewMode(tab: TypeTab): ViewMode {
  return tab === "order" || tab === "enquiry" ? "kanban" : "table";
}

function getInitialViewMode(searchParams: URLSearchParams): ViewMode {
  const tab = getInitialTypeTab(searchParams);
  return getViewModeFromSearchParams(searchParams) ?? getDefaultViewMode(tab);
}

function isValidLocalDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function getWorkspaceFilters(searchParams: URLSearchParams) {
  const tab = getInitialTypeTab(searchParams);
  const view = getInitialViewMode(searchParams);
  const status = searchParams.get("status") ?? "all";
  const validStatuses =
    tab === "enquiry" ? Object.values(ENQUIRY_STATUS_LABELS) : ORDER_STAGES;
  const orderType = searchParams.get("orderType") ?? "all";
  const date = searchParams.get("date") ?? "all";
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";
  const defaultSort = getDefaultSort(tab);
  const [requestedSortBy, requestedSortOrder] = (
    searchParams.get("sort") ?? `${defaultSort.sortBy}:${defaultSort.sortOrder}`
  ).split(":");
  const sortBy: SortBy = SORT_FIELDS.some((field) => field === requestedSortBy)
    ? (requestedSortBy as SortBy)
    : defaultSort.sortBy;

  return {
    search: (searchParams.get("search") ?? "").slice(0, 255),
    status:
      view === "table" && validStatuses.some((value) => value === status)
        ? status
        : "all",
    orderType: ORDER_TYPES.some((value) => value === orderType)
      ? orderType
      : "all",
    dateFilter: DATE_FILTERS.find((value) => value === date) ?? "all",
    olderColumns: RECENT_HISTORY_COLUMNS.filter((column) => {
      const older = searchParams.get("older");
      return older === "show" || older?.split(",").includes(column);
    }),
    dateFrom: isValidLocalDate(from) ? from : "",
    dateTo: isValidLocalDate(to) ? to : "",
    recentSales: getRecentSalesFilters(searchParams),
    sortBy:
      tab === "enquiry" && sortBy === "deliveryDate" ? "createdAt" : sortBy,
    sortOrder:
      requestedSortOrder === "asc" || requestedSortOrder === "desc"
        ? requestedSortOrder
        : defaultSort.sortOrder,
  } as const;
}

function dateBoundary(value: string, endOfDay = false) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(
    year,
    month - 1,
    day,
    endOfDay ? 23 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 999 : 0,
  ).toISOString();
}

function getKanbanStatus(record: Order): string {
  return getRecordStatus(record);
}

function isOrderStage(value: string): value is (typeof ORDER_STAGES)[number] {
  return ORDER_STAGES.some((stage) => stage === value);
}

function getErrorMessage(error: unknown, fallback = "Something went wrong") {
  return error instanceof Error ? error.message : fallback;
}

export function OrdersEnquiriesWorkspace() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlFilters = useMemo(
    () => getWorkspaceFilters(searchParams),
    [searchParams],
  );
  const { data: session } = authClient.useSession();
  const isPhotography = getSessionRole(session) === "PHOTOGRAPHY";
  const [typeTab, setTypeTab] = useState<TypeTab>(() => {
    const initialTab = getInitialTypeTab(searchParams);
    return isPhotography ? "order" : initialTab;
  });
  const [statusOrder, setStatusOrder] = useState<Order | null>(null);
  const updateOrderStatusMutation = useUpdateAnyOrderStatus();
  const [search, setSearch] = useState(urlFilters.search);
  const [debouncedSearch, setDebouncedSearch] = useState(
    urlFilters.search.trim(),
  );
  const [orderType, setOrderType] = useState(urlFilters.orderType);
  const [sortBy, setSortBy] = useState<SortBy>(urlFilters.sortBy);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(
    urlFilters.sortOrder,
  );
  const [dateFrom, setDateFrom] = useState(urlFilters.dateFrom);
  const [dateTo, setDateTo] = useState(urlFilters.dateTo);
  const [recentSalesFilters, setRecentSalesFilters] =
    useState<RecentSalesFilterValues>(urlFilters.recentSales);
  useEffect(() => {
    const timeout = window.setTimeout(
      () => setDebouncedSearch(search.trim()),
      300,
    );
    return () => window.clearTimeout(timeout);
  }, [search]);
  const sessionRole = session ? getSessionRole(session) : "";
  const canViewPurchases = ["ADMIN", "OPERATIONS"].includes(sessionRole);
  const canViewRecentSales = canViewPurchases;
  const canSyncPurchases = ["ADMIN", "OPERATIONS"].includes(sessionRole);
  const stockSalesQuery = useStockSales(
    { limit: 40, search: search.trim() || undefined },
    { enabled: typeTab === "purchase" && canViewPurchases },
  );
  const syncStockSalesMutation = useSyncStockSales();
  const stockSalesLoadMoreRef = useRef<HTMLDivElement>(null);
  const recentSalesRangeError = getRecentSalesRangeError(recentSalesFilters);
  const recentProductSalesQuery = useRecentProductSales(
    toRecentProductSalesQuery(recentSalesFilters, debouncedSearch),
    {
      enabled:
        typeTab === "recent-sale" &&
        canViewRecentSales &&
        !recentSalesRangeError,
      limit: 12,
    },
  );
  const recentProductSalesLoadMoreRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(() =>
    getInitialViewMode(searchParams),
  );
  const [statusFilter, setStatusFilter] = useState(urlFilters.status);
  const [dateFilter, setDateFilter] = useState<DateFilter>(
    urlFilters.dateFilter,
  );
  const [olderColumns, setOlderColumns] = useState(urlFilters.olderColumns);
  const [terminalRecordsCutoff] = useState(() => Date.now() - 30 * 86400000);
  useEffect(() => {
    setSearch(urlFilters.search);
    setStatusFilter(urlFilters.status);
    setOrderType(urlFilters.orderType);
    setDateFilter(urlFilters.dateFilter);
    setOlderColumns(urlFilters.olderColumns);
    setDateFrom(urlFilters.dateFrom);
    setDateTo(urlFilters.dateTo);
    setRecentSalesFilters(urlFilters.recentSales);
    setSortBy(urlFilters.sortBy);
    setSortOrder(urlFilters.sortOrder);
  }, [urlFilters]);
  const createdFrom = useMemo(
    () =>
      dateFilter === "custom"
        ? dateFrom
          ? dateBoundary(dateFrom)
          : undefined
        : dateFilter === "all"
          ? undefined
          : new Date(
              Date.now() - Number(dateFilter.replace("d", "")) * 86400000,
            ).toISOString(),
    [dateFilter, dateFrom],
  );
  const createdTo =
    dateFilter === "custom" && dateTo ? dateBoundary(dateTo, true) : undefined;
  const selectedOrderStatus =
    viewMode === "table"
      ? Object.entries(ORDER_STAGE_TO_STATUS).find(
          ([stage]) => stage === statusFilter,
        )?.[1]
      : undefined;
  const selectedEnquiryStatus =
    viewMode === "table"
      ? ENQUIRY_STATUSES.find(
          (status) => ENQUIRY_STATUS_LABELS[status] === statusFilter,
        )
      : undefined;
  const ordersQuery = useInfiniteOrders(
    {
      search: debouncedSearch || undefined,
      status: selectedOrderStatus,
      orderType:
        orderType === "all"
          ? undefined
          : (orderType as "STOCK" | "CUSTOMER" | "STOCK_REFILL"),
      createdFrom,
      createdTo,
      sortBy,
      sortOrder,
    },
    { enabled: typeTab === "order" },
  );
  const enquiriesQuery = useEnquiries(
    {
      search: debouncedSearch || undefined,
      status: selectedEnquiryStatus,
      createdFrom,
      createdTo,
      sortBy: sortBy === "deliveryDate" ? "createdAt" : sortBy,
      sortOrder,
    },
    { enabled: typeTab === "enquiry" },
  );
  const [pendingKanbanMove, setPendingKanbanMove] = useState<{
    record: Order;
    newColumnId: string;
  } | null>(null);
  const isKanbanMode = viewMode === "kanban";

  const replaceWorkspaceUrl = useCallback(
    (changes: Record<string, string | null>) => {
      const params = new URLSearchParams(window.location.search);
      for (const [key, value] of Object.entries(changes)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      const queryString = params.toString();
      window.history.replaceState(
        null,
        "",
        `${pathname}${queryString ? `?${queryString}` : ""}${window.location.hash}`,
      );
    },
    [pathname],
  );

  useEffect(() => {
    const queryTab = getTypeTabFromSearchParams(searchParams);
    if (
      queryTab &&
      (!isPhotography || queryTab === "order") &&
      ((queryTab !== "purchase" && queryTab !== "recent-sale") ||
        canViewPurchases)
    ) {
      setTypeTab(queryTab);
      setViewMode(getInitialViewMode(searchParams));
    }
  }, [canViewPurchases, isPhotography, searchParams]);

  useEffect(() => {
    if (
      session &&
      ((!canViewPurchases &&
        (typeTab === "purchase" || typeTab === "recent-sale")) ||
        (isPhotography && typeTab !== "order"))
    ) {
      setTypeTab("order");
      setViewMode("kanban");
    }
  }, [canViewPurchases, isPhotography, session, typeTab]);

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

  useEffect(() => {
    if (typeTab !== "recent-sale" || !canViewRecentSales) return;

    const sentinel = recentProductSalesLoadMoreRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (
          entry.isIntersecting &&
          recentProductSalesQuery.hasNextPage &&
          !recentProductSalesQuery.isFetchingNextPage
        ) {
          recentProductSalesQuery.fetchNextPage();
        }
      },
      { rootMargin: "480px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [
    canViewRecentSales,
    recentProductSalesQuery.fetchNextPage,
    recentProductSalesQuery.hasNextPage,
    recentProductSalesQuery.isFetchingNextPage,
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
      (ordersQuery.data?.pages.flat() ?? []).map((order) =>
        mapBackendOrderListItemToOrder(order),
      ),
    [ordersQuery.data],
  );
  const allRecords = useMemo(
    () => (typeTab === "order" ? apiOrders : apiEnquiries),
    [apiEnquiries, apiOrders, typeTab],
  );
  const records = useMemo(
    () =>
      dateFilter !== "all"
        ? allRecords
        : allRecords.filter(
            (record) =>
              olderColumns.includes(getRecordStatus(record)) ||
              !isOlderTerminalRecord(record, terminalRecordsCutoff),
          ),
    [allRecords, terminalRecordsCutoff, dateFilter, olderColumns],
  );
  const stockSales = useMemo(
    () => stockSalesQuery.data?.pages.flatMap((page) => page.data) ?? [],
    [stockSalesQuery.data],
  );
  const stockSalesTotal = stockSalesQuery.data?.pages[0]?.total;
  const recentProductSales = useMemo(
    () =>
      recentProductSalesQuery.data?.pages.flatMap((page) => page.data) ?? [],
    [recentProductSalesQuery.data],
  );
  const recentProductSalesTotal = recentProductSalesQuery.data?.pages[0]?.total;

  const tabCounts = useMemo(
    () => ({
      order: typeTab === "order" ? records.length : undefined,
      enquiry: typeTab === "enquiry" ? records.length : undefined,
      purchase: typeTab === "purchase" ? stockSalesTotal : undefined,
      recentSale:
        typeTab === "recent-sale" ? recentProductSalesTotal : undefined,
    }),
    [records.length, recentProductSalesTotal, stockSalesTotal, typeTab],
  );
  const typeTabs = useMemo(
    () => [
      { key: "order" as const, label: "Orders", count: tabCounts.order },
      ...(!isPhotography
        ? [
            {
              key: "enquiry" as const,
              label: "Enquiries",
              count: tabCounts.enquiry,
            },
            { key: "bulk-order" as const, label: "Bulk orders" },
            { key: "repair" as const, label: "Repairs" },
          ]
        : []),
      ...(canViewPurchases
        ? [
            {
              key: "purchase" as const,
              label: "Purchases",
              count: tabCounts.purchase,
            },
            {
              key: "recent-sale" as const,
              label: "Recent sales",
              count: tabCounts.recentSale,
            },
          ]
        : []),
    ],
    [
      canViewPurchases,
      isPhotography,
      tabCounts.enquiry,
      tabCounts.order,
      tabCounts.purchase,
      tabCounts.recentSale,
    ],
  );

  const filteredRecords = useMemo(() => {
    return records;
  }, [records]);

  const kanbanRecords = useMemo(
    () => records.filter((record) => record.type === typeTab),
    [records, typeTab],
  );
  const kanbanColumns = (
    typeTab === "order" ? ORDER_KANBAN_COLUMNS : ENQUIRY_KANBAN_COLUMNS
  ).map((column) => {
    if (dateFilter !== "all" || !RECENT_HISTORY_COLUMNS.includes(column.id)) {
      return column;
    }

    const showOlder = olderColumns.includes(column.id);
    const recentColumn = {
      ...column,
      emptyDescription: showOlder ? undefined : "in the last 30 days",
    };
    const olderCount = allRecords.filter(
      (record) =>
        getRecordStatus(record) === column.id &&
        isOlderTerminalRecord(record, terminalRecordsCutoff),
    ).length;
    if (olderCount === 0) return recentColumn;

    return {
      ...recentColumn,
      footer: (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-pressed={showOlder}
          aria-label={`${showOlder ? "Hide" : "Show"} previous ${column.label.toLowerCase()} ${typeTab === "order" ? "orders" : "enquiries"}`}
          className="h-9 w-full text-xs text-muted-foreground"
          onClick={() => {
            const nextColumns = showOlder
              ? olderColumns.filter((id) => id !== column.id)
              : [...olderColumns, column.id];
            setOlderColumns(nextColumns);
            replaceWorkspaceUrl({ older: nextColumns.join(",") || null });
          }}
        >
          <History aria-hidden="true" className="size-3.5" />
          {showOlder ? "Hide" : "Show"} previous{" "}
          {typeTab === "order" ? "orders" : "enquiries"} ({olderCount})
        </Button>
      ),
    };
  });
  const shownRecordCount = isKanbanMode
    ? kanbanRecords.length
    : filteredRecords.length;

  const sectionHeading =
    typeTab === "order"
      ? "Orders"
      : typeTab === "enquiry"
        ? "Enquiries"
        : typeTab === "purchase"
          ? "Purchases"
          : "Recent product sales";
  const activeFilterCount =
    (viewMode === "table" && statusFilter !== "all" ? 1 : 0) +
    (typeTab === "order" && orderType !== "all" ? 1 : 0);
  const clearSecondaryFilters = () => {
    setStatusFilter("all");
    setOrderType("all");
    replaceWorkspaceUrl({ status: null, orderType: null });
    captureProductEvent("workspace_filters_cleared", {
      record_type: typeTab,
      active_filter_count: activeFilterCount,
    });
  };
  const updateRecentSalesFilters = (
    changes: Partial<RecentSalesFilterValues>,
  ) => {
    setRecentSalesFilters((current) => ({ ...current, ...changes }));
    replaceWorkspaceUrl(getRecentSalesUrlChanges(changes));
    captureProductEvent("recent_sales_filter_changed", {
      filter_keys: Object.keys(changes).join(","),
    });
  };
  const handleTypeTabChange = (tab: TypeTab) => {
    setTypeTab(tab);
    const hasExplicitSort = searchParams.has("sort");
    const defaultSort = getDefaultSort(tab);
    const nextSortBy = hasExplicitSort
      ? tab === "enquiry" && sortBy === "deliveryDate"
        ? "createdAt"
        : sortBy
      : defaultSort.sortBy;
    const nextSortOrder = hasExplicitSort ? sortOrder : defaultSort.sortOrder;
    setSortBy(nextSortBy);
    setSortOrder(nextSortOrder);
    replaceWorkspaceUrl({
      type: tab,
      view: viewMode,
      status: null,
      sort: hasExplicitSort ? `${nextSortBy}:${nextSortOrder}` : null,
    });
    setStatusFilter("all");
    captureProductEvent("workspace_tab_changed", {
      from_tab: typeTab,
      to_tab: tab,
    });
  };
  const handleViewModeChange = (nextViewMode: ViewMode) => {
    setViewMode(nextViewMode);
    if (nextViewMode === "kanban") setStatusFilter("all");
    replaceWorkspaceUrl({
      type: typeTab,
      view: nextViewMode,
      ...(nextViewMode === "kanban" ? { status: null } : {}),
    });
  };
  const handleSyncPurchases = async () => {
    captureProductEvent("purchase_sync_started");
    try {
      const summary = await syncStockSalesMutation.mutateAsync();
      captureProductEvent("purchase_sync_completed", {
        transactions_inserted: summary.transactionsInserted,
      });
      toast.success(
        `Purchase sync completed: ${summary.transactionsInserted} purchases imported`,
      );
    } catch (error) {
      captureProductEvent("purchase_sync_failed");
      toast.error(getErrorMessage(error, "Could not sync purchases"));
    }
  };
  const commitKanbanOrderMove = async (
    record: Order,
    newColumnId: string,
    vendorDetails?: VendorDetailsValues,
  ) => {
    if (!record.refCode || !isOrderStage(newColumnId)) return false;

    try {
      await updateOrderStatusMutation.mutateAsync({
        refCode: record.refCode,
        input: {
          status: ORDER_STAGE_TO_STATUS[newColumnId],
          ...vendorDetails,
        },
      });
      captureProductEvent("order_status_changed", {
        from_status: record.currentStage,
        to_status: newColumnId,
        surface: "kanban",
        vendor_prompt: Boolean(vendorDetails),
      });
      toast.success(`Order moved to ${newColumnId}`);
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not update order status"));
      return false;
    }
  };

  const handleKanbanOrderMove = async (record: Order, newColumnId: string) => {
    if (record.type === "enquiry") {
      toast.error(
        "Enquiry status can't be changed in kanban mode, please open enquiry detail",
      );
      return;
    }

    if (
      isPhotography &&
      !PHOTOGRAPHY_ORDER_STAGES.some((stage) => stage === newColumnId)
    ) {
      toast.error(
        `Orders can only be moved to ${PHOTOGRAPHY_ORDER_STAGES.join(", ")}.`,
      );
      return;
    }

    if (
      KANBAN_BLOCKED_ORDER_STAGES.has(record.currentStage) ||
      KANBAN_BLOCKED_ORDER_STAGES.has(newColumnId)
    ) {
      toast.error(
        isPhotography
          ? KANBAN_BLOCKED_ORDER_STAGES.has(record.currentStage)
            ? "Closed or cancelled orders cannot be changed."
            : "Select this order to update its status."
          : "Closed or cancelled orders can't be changed in kanban mode, please open order detail",
      );
      return;
    }

    if (!record.refCode || !isOrderStage(newColumnId)) return;

    if (
      !isPhotography &&
      shouldPromptForVendorDetails(
        record.orderStatus,
        ORDER_STAGE_TO_STATUS[newColumnId],
      )
    ) {
      setPendingKanbanMove({ record, newColumnId });
      return;
    }

    await commitKanbanOrderMove(record, newColumnId);
  };

  const handleConfirmKanbanVendor = async (values: VendorDetailsValues) => {
    if (!pendingKanbanMove) return;

    const didMove = await commitKanbanOrderMove(
      pendingKanbanMove.record,
      pendingKanbanMove.newColumnId,
      values,
    );
    if (didMove) setPendingKanbanMove(null);
  };
  const handleRecordClick = (record: Order) => {
    if (isPhotography) {
      if (record.type === "order") setStatusOrder(record);
      return;
    }
    router.push(
      record.type === "enquiry"
        ? `/enquiries/${record.refCode}`
        : `/orders/${record.refCode}`,
    );
  };
  const sectionCount =
    typeTab === "purchase"
      ? stockSalesTotal
      : typeTab === "recent-sale"
        ? recentProductSalesTotal
        : shownRecordCount;

  return (
    <div
      className={cn(
        isKanbanMode && (typeTab === "order" || typeTab === "enquiry")
          ? "flex h-[calc(100svh-var(--mobile-top-h,0px)-var(--mobile-nav-h,0px)-2.25rem)] min-h-[30rem] flex-col gap-3 sm:h-[calc(100svh-var(--mobile-top-h,0px)-var(--mobile-nav-h,0px)-3rem)] md:gap-4 lg:min-h-[36rem] [&>*]:shrink-0"
          : "space-y-3 md:space-y-4",
      )}
    >
      <WorkspaceHeader
        isPhotography={isPhotography}
        tabs={typeTabs}
        activeTab={typeTab}
        onTabChange={handleTypeTabChange}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        showViewToggle={
          typeTab === "order" || typeTab === "enquiry" || typeTab === "repair"
        }
      />

      {typeTab !== "repair" && typeTab !== "bulk-order" && (
        <div className="flex w-full flex-col gap-3 md:gap-4 lg:flex-row lg:items-start lg:gap-8">
          <div
            className={cn(
              "flex min-h-9 shrink-0 items-center justify-between gap-3",
              "max-lg:sr-only",
            )}
          >
            <h2 className="whitespace-nowrap text-base font-medium text-foreground">
              {sectionHeading}{" "}
              <span className="text-muted-foreground">({sectionCount})</span>
            </h2>
          </div>

          {(typeTab === "order" || typeTab === "enquiry") && (
            <WorkspaceRecordFilters
              recordType={typeTab}
              search={search}
              onSearchChange={(value) => {
                setSearch(value);
                replaceWorkspaceUrl({ search: value || null });
              }}
              status={statusFilter}
              onStatusChange={(value) => {
                setStatusFilter(value);
                replaceWorkspaceUrl({ status: value === "all" ? null : value });
              }}
              orderType={orderType}
              onOrderTypeChange={(value) => {
                setOrderType(value);
                replaceWorkspaceUrl({
                  orderType: value === "all" ? null : value,
                });
              }}
              dateFilter={dateFilter}
              onDateFilterChange={(value) => {
                setDateFilter(value);
                if (value !== "custom") {
                  setDateFrom("");
                  setDateTo("");
                }
                replaceWorkspaceUrl({
                  date: value === "all" ? null : value,
                  ...(value === "custom" ? {} : { from: null, to: null }),
                });
              }}
              dateFrom={dateFrom}
              dateTo={dateTo}
              onCustomRangeChange={(from, to) => {
                setDateFrom(from);
                setDateTo(to);
                replaceWorkspaceUrl({
                  date: "custom",
                  from: from || null,
                  to: to || null,
                });
              }}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortChange={(field, direction) => {
                setSortBy(field);
                setSortOrder(direction);
                replaceWorkspaceUrl({
                  sort: `${field}:${direction}`,
                });
              }}
              onReset={clearSecondaryFilters}
              viewMode={viewMode}
              onViewModeChange={handleViewModeChange}
            />
          )}

          {typeTab === "purchase" ? (
            <div className="flex w-full items-center gap-2 lg:w-auto lg:min-w-0 lg:flex-1 lg:justify-end">
              <div className="relative min-w-0 flex-1 sm:max-w-xs lg:w-80 lg:flex-none">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    replaceWorkspaceUrl({ search: event.target.value || null });
                  }}
                  onBlur={() => {
                    const query = search.trim();
                    if (!query) return;
                    captureProductEvent("workspace_search_used", {
                      record_type: typeTab,
                      query_length: query.length,
                      surface: "purchase_search",
                    });
                  }}
                  placeholder="Search customer, product code, or salesperson"
                  className="h-10 pl-9"
                  aria-label="Search purchases"
                  maxLength={255}
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
                  {syncStockSalesMutation.isPending ? (
                    "Syncing..."
                  ) : (
                    <>
                      <span className="sm:hidden">Sync</span>
                      <span className="hidden sm:inline">Sync purchases</span>
                    </>
                  )}
                </Button>
              ) : null}
            </div>
          ) : null}

          {typeTab === "recent-sale" ? (
            <RecentSalesFilters
              search={search}
              onSearchChange={(value) => {
                setSearch(value);
                replaceWorkspaceUrl({ search: value || null });
              }}
              filters={recentSalesFilters}
              onChange={updateRecentSalesFilters}
            />
          ) : null}
        </div>
      )}

      {statusOrder && (
        <OrderStatusDialog
          key={statusOrder.id}
          order={statusOrder}
          stages={isPhotography ? PHOTOGRAPHY_ORDER_STAGES : ORDER_STAGES}
          isPending={updateOrderStatusMutation.isPending}
          onClose={() => setStatusOrder(null)}
          onSubmit={(stage) => commitKanbanOrderMove(statusOrder, stage)}
        />
      )}
      <VendorDetailsDialog
        open={Boolean(pendingKanbanMove)}
        onOpenChange={(open) => {
          if (!open) setPendingKanbanMove(null);
        }}
        vendorName={pendingKanbanMove?.record.vendorName}
        vendorId={pendingKanbanMove?.record.vendorId}
        vendorDeliveryDate={pendingKanbanMove?.record.vendorDeliveryDate}
        title="Add vendor details"
        description={`Please add vendor details before moving this order to ${
          pendingKanbanMove?.newColumnId ?? "the next status"
        }. Both fields are optional and can be updated later.`}
        confirmLabel={
          pendingKanbanMove
            ? `Move to ${pendingKanbanMove.newColumnId}`
            : "Move order"
        }
        isPending={updateOrderStatusMutation.isPending}
        onSubmit={handleConfirmKanbanVendor}
      />

      {(
        typeTab === "order"
          ? ordersQuery.isLoading
          : typeTab === "enquiry"
            ? enquiriesQuery.isLoading
            : false
      ) ? (
        <p className="text-sm text-muted-foreground">Loading records...</p>
      ) : null}
      {(typeTab === "order"
        ? ordersQuery.isError
        : typeTab === "enquiry"
          ? enquiriesQuery.isError
          : false) && (
        <p role="alert" className="text-sm text-destructive">
          Could not load records. Please try again.
        </p>
      )}

      {typeTab === "bulk-order" ? (
        <BulkOrdersTab canManageRefills={canViewPurchases} />
      ) : typeTab === "repair" ? (
        <RepairsWorkspace
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
        />
      ) : typeTab === "recent-sale" ? (
        <RecentProductSalesGrid
          sales={recentProductSales}
          isLoading={recentProductSalesQuery.isLoading}
          isError={recentProductSalesQuery.isError}
          isFetchingNextPage={recentProductSalesQuery.isFetchingNextPage}
          hasNextPage={Boolean(recentProductSalesQuery.hasNextPage)}
          loadMoreRef={recentProductSalesLoadMoreRef}
          isFiltered={
            Boolean(debouncedSearch) ||
            hasRecentSalesFilters(recentSalesFilters)
          }
        />
      ) : typeTab === "purchase" ? (
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
          <KanbanStageStrip
            label="Filter by status"
            className="lg:hidden"
            stages={[
              { id: "all", label: "All" },
              ...(typeTab === "order"
                ? ORDER_KANBAN_COLUMNS
                : ENQUIRY_KANBAN_COLUMNS
              ).map((column) => ({ id: column.id, label: column.label })),
            ]}
            activeId={statusFilter}
            onSelect={(value) => {
              setStatusFilter(value);
              replaceWorkspaceUrl({ status: value === "all" ? null : value });
            }}
          />
          <WorkspaceRecordsList
            records={filteredRecords}
            showOrderType={typeTab === "order"}
            canOpenDetails={!isPhotography}
            onRowClick={handleRecordClick}
          />
        </>
      ) : (
        <section className="min-h-0 flex-1 md:rounded-xl md:border md:border-border md:bg-card md:p-3 md:shadow-sm lg:p-4">
          <KanbanBoard
            orders={kanbanRecords}
            columns={kanbanColumns}
            getColumnId={getKanbanStatus}
            emptyLabel={typeTab === "order" ? "No orders" : "No enquiries"}
            onOrderMove={(order, newColumnId) => {
              void handleKanbanOrderMove(order, newColumnId);
            }}
            onCardClick={handleRecordClick}
            canMoveCard={
              typeTab === "order" && !isPhotography
                ? (order) =>
                    !KANBAN_BLOCKED_ORDER_STAGES.has(order.currentStage)
                : undefined
            }
            moveTargetIds={ORDER_STAGES.filter(
              (stage) => !KANBAN_BLOCKED_ORDER_STAGES.has(stage),
            )}
            cardActionLabel={
              isPhotography ? "Click to update order status" : undefined
            }
          />
        </section>
      )}
      {typeTab === "order" && ordersQuery.hasNextPage && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            type="button"
            disabled={ordersQuery.isFetchingNextPage}
            onClick={() => void ordersQuery.fetchNextPage()}
          >
            {ordersQuery.isFetchingNextPage ? "Loading..." : "Load more orders"}
          </Button>
        </div>
      )}
    </div>
  );
}
