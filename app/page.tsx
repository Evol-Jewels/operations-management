"use client";

import { AlertTriangle, CheckCircle2, LayoutGrid, List } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { KanbanBoard } from "@/components/dashboard/KanbanBoard";
import { OrderList } from "@/components/dashboard/OrderList";
import { PipelineSummary } from "@/components/dashboard/PipelineSummary";
import {
  SearchFilter,
  type TypeFilter,
} from "@/components/dashboard/SearchFilter";
import { TodaysFocus } from "@/components/dashboard/TodaysFocus";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { mockOrders } from "@/lib/mock-data";
import {
  cn,
  computeRiskSignal,
  formatDate,
  getUrgencyLevel,
} from "@/lib/utils";
import {
  type ActivityEntry,
  type Order,
  STAGES,
  type Stage,
  type UrgencyLevel,
} from "@/types";

export default function DashboardPage() {
  const router = useRouter();

  // View mode state
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [lastMoved, setLastMoved] = useState<{
    name: string;
    stage: string;
  } | null>(null);
  const [orders, setOrders] = useState<Order[]>(() =>
    mockOrders.map((order) => ({
      ...order,
      activityFeed: [...order.activityFeed],
    })),
  );

  // Search and filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [stageFilter, setStageFilter] = useState<Stage | null>(null);
  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyLevel | null>(null);
  const [staffSearch, setStaffSearch] = useState("");
  const kanbanAllowed = typeFilter !== "enquiry";
  useEffect(() => {
    if (!kanbanAllowed && viewMode === "kanban") {
      setViewMode("list");
    }
  }, [kanbanAllowed, viewMode]);

  // Derive counts for type toggle (unfiltered)
  const typeCounts = useMemo(() => {
    return orders.reduce(
      (acc, o) => {
        acc[o.type] = (acc[o.type] ?? 0) + 1;
        return acc;
      },
      {} as Record<TypeFilter, number>,
    );
  }, [orders]);

  // Derive pipeline counts (filtered by type if typeFilter is active)
  const stageCounts = useMemo(() => {
    const counts = Object.fromEntries(STAGES.map((s) => [s, 0])) as Record<
      Stage,
      number
    >;
    for (const order of orders) {
      if (typeFilter !== "all" && order.type !== typeFilter) continue;
      counts[order.currentStage] = (counts[order.currentStage] ?? 0) + 1;
    }
    return counts;
  }, [orders, typeFilter]);

  // All unique people (sales + vendor) for the combobox
  const allPeople = useMemo(() => {
    const sales = [...new Set(orders.map((o) => o.salespersonName))];
    const vendors = [
      ...new Set(
        orders.map((o) => o.vendorName).filter((v): v is string => !!v),
      ),
    ];
    return { sales, vendors };
  }, [orders]);

  // Urgency breakdown (unfiltered)
  const urgencyCounts = useMemo(() => {
    return orders.reduce(
      (acc, o) => {
        const level = getUrgencyLevel(o.deliveryDate);
        acc[level] = (acc[level] ?? 0) + 1;
        return acc;
      },
      {} as Record<UrgencyLevel, number>,
    );
  }, [orders]);

  // Risk breakdown — stale + stuck (unfiltered, excludes completed)
  const riskCount = useMemo(() => {
    return orders.filter(
      (o) =>
        o.currentStage !== "Customer Pickup" && computeRiskSignal(o) !== null,
    ).length;
  }, [orders]);

  // Risk filter state
  const [riskFilter, setRiskFilter] = useState(false);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((order) => {
      // Type filter
      if (typeFilter !== "all" && order.type !== typeFilter) return false;

      // Stage filter
      if (stageFilter && order.currentStage !== stageFilter) return false;

      // Urgency filter
      if (urgencyFilter) {
        const level = getUrgencyLevel(order.deliveryDate);
        if (level !== urgencyFilter) return false;
      }

      // Risk filter — only at-risk orders (stale or stuck)
      if (riskFilter && computeRiskSignal(order) === null) return false;

      // Staff search (matches salesperson OR vendor)
      if (staffSearch.trim()) {
        const staffQ = staffSearch.trim().toLowerCase();
        const matchesSales = order.salespersonName
          .toLowerCase()
          .includes(staffQ);
        const matchesVendor = order.vendorName?.toLowerCase().includes(staffQ);
        if (!matchesSales && !matchesVendor) return false;
      }

      // General search
      if (q) {
        const haystack = [
          order.customerName,
          order.orderNumber ?? "",
          order.shareableToken,
          order.vendorName ?? "",
          order.salespersonName,
          order.category,
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [
    search,
    typeFilter,
    stageFilter,
    urgencyFilter,
    riskFilter,
    staffSearch,
    orders,
  ]);

  // Handle order move from kanban
  const handleOrderMove = (orderId: string, newStage: Stage) => {
    let movedOrder: Order | null = null;
    const timestamp = new Date().toISOString();

    setOrders((prev) => {
      const index = prev.findIndex((o) => o.id === orderId);
      if (index === -1) return prev;

      const order = prev[index];
      if (order.currentStage === newStage) return prev;

      movedOrder = order;

      const updatedOrder: Order = {
        ...order,
        currentStage: newStage,
        lastUpdatedAt: timestamp,
        activityFeed: [
          ...order.activityFeed,
          {
            id: `act-${Date.now()}-kanban`,
            orderId: order.id,
            postedBy: "Dashboard User",
            actorRole: "sales",
            timestamp,
            type: "stage_change",
            previousStage: order.currentStage,
            newStage,
            note: `Moved from ${order.currentStage} to ${newStage} via kanban board`,
          },
        ],
      };

      const next = [...prev];
      next[index] = updatedOrder;
      return next;
    });

    if (!movedOrder) return;

    setLastMoved({ name: (movedOrder as Order).customerName, stage: newStage });
    setTimeout(() => setLastMoved(null), 3000);
  };

  // Active filters for chips
  const activeFilters = useMemo(() => {
    const filters: { key: string; label: string; onRemove: () => void }[] = [];
    if (typeFilter !== "all") {
      filters.push({
        key: "type",
        label: typeFilter === "order" ? "Orders only" : "Enquiries only",
        onRemove: () => setTypeFilter("all"),
      });
    }
    if (stageFilter) {
      filters.push({
        key: "stage",
        label: `Stage: ${stageFilter}`,
        onRemove: () => setStageFilter(null),
      });
    }
    if (urgencyFilter) {
      const labels: Record<UrgencyLevel, string> = {
        overdue: "Overdue",
        "due-soon": "Due soon",
        "on-track": "On track",
        none: "No date",
      };
      filters.push({
        key: "urgency",
        label: labels[urgencyFilter],
        onRemove: () => setUrgencyFilter(null),
      });
    }
    if (riskFilter) {
      filters.push({
        key: "risk",
        label: "At risk",
        onRemove: () => setRiskFilter(false),
      });
    }
    if (staffSearch.trim()) {
      filters.push({
        key: "staff",
        label: `People: ${staffSearch.trim()}`,
        onRemove: () => setStaffSearch(""),
      });
    }
    return filters;
  }, [typeFilter, stageFilter, urgencyFilter, riskFilter, staffSearch]);

  const hasFilters =
    !!search ||
    typeFilter !== "all" ||
    !!stageFilter ||
    !!urgencyFilter ||
    riskFilter ||
    !!staffSearch.trim();

  function clearFilters() {
    setSearch("");
    setTypeFilter("all");
    setStageFilter(null);
    setUrgencyFilter(null);
    setRiskFilter(false);
    setStaffSearch("");
  }

  return (
    <TooltipProvider>
      <div className="space-y-5">
        {/* Success toast for kanban moves */}
        {lastMoved && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            <span>
              <strong>{lastMoved.name}</strong> moved to{" "}
              <strong>{lastMoved.stage}</strong>
            </span>
          </div>
        )}

        {/* ── Page header ──────────────────────────────────────────────── */}
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Operations Dashboard
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {filteredOrders.length} of {orders.length} records
            {typeFilter !== "all" && (
              <span className="ml-1 text-foreground">
                · {typeFilter === "order" ? "orders" : "enquiries"} only
              </span>
            )}
          </p>
        </div>

        {/* ── Pipeline summary (counts filtered by type) ─────────────── */}
        <PipelineSummary
          stageCounts={stageCounts}
          activeFilter={stageFilter}
          onFilterChange={setStageFilter}
          typeFilter={typeFilter}
        />

        {/* ── Needs attention — at-risk chip strip ─────────────────────── */}
        <TodaysFocus orders={orders} onShowAll={() => setRiskFilter(true)} />

        {/* ── Search + filters (urgency pills live in the search row) ──── */}
        <SearchFilter
          search={search}
          onSearchChange={setSearch}
          typeFilter={typeFilter}
          onTypeChange={setTypeFilter}
          typeCounts={typeCounts}
          staffSearch={staffSearch}
          onStaffChange={setStaffSearch}
          allPeople={allPeople}
          activeFilters={activeFilters}
          hasFilters={hasFilters}
          onClear={clearFilters}
          quickFilters={
            <>
              {urgencyCounts.overdue > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() =>
                        setUrgencyFilter(
                          urgencyFilter === "overdue" ? null : "overdue",
                        )
                      }
                      className={cn(
                        "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors",
                        urgencyFilter === "overdue"
                          ? "border-red-400 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300"
                          : "border-border bg-card text-muted-foreground hover:border-red-300 hover:bg-red-50/50",
                      )}
                    >
                      <span className="h-2 w-2 rounded-full bg-red-500" />
                      <span className="font-medium">
                        {urgencyCounts.overdue}
                      </span>
                      <span>overdue</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="text-xs">
                      Click to{" "}
                      {urgencyFilter === "overdue" ? "show all" : "filter"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              )}
              {urgencyCounts["due-soon"] > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() =>
                        setUrgencyFilter(
                          urgencyFilter === "due-soon" ? null : "due-soon",
                        )
                      }
                      className={cn(
                        "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors",
                        urgencyFilter === "due-soon"
                          ? "border-amber-400 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300"
                          : "border-border bg-card text-muted-foreground hover:border-amber-300 hover:bg-amber-50/50",
                      )}
                    >
                      <span className="h-2 w-2 rounded-full bg-amber-400" />
                      <span className="font-medium">
                        {urgencyCounts["due-soon"]}
                      </span>
                      <span>due soon</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="text-xs">
                      Click to{" "}
                      {urgencyFilter === "due-soon" ? "show all" : "filter"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              )}
              {urgencyCounts["on-track"] > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() =>
                        setUrgencyFilter(
                          urgencyFilter === "on-track" ? null : "on-track",
                        )
                      }
                      className={cn(
                        "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors",
                        urgencyFilter === "on-track"
                          ? "border-emerald-400 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                          : "border-border bg-card text-muted-foreground hover:border-emerald-300 hover:bg-emerald-50/50",
                      )}
                    >
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span className="font-medium">
                        {urgencyCounts["on-track"]}
                      </span>
                      <span>on track</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="text-xs">
                      Click to{" "}
                      {urgencyFilter === "on-track" ? "show all" : "filter"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              )}
              {riskCount > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setRiskFilter((v) => !v)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors",
                        riskFilter
                          ? "border-orange-400 bg-orange-50 text-orange-700 dark:border-orange-700 dark:bg-orange-950 dark:text-orange-300"
                          : "border-border bg-card text-muted-foreground hover:border-orange-300 hover:bg-orange-50/50",
                      )}
                    >
                      <AlertTriangle className="h-3 w-3 text-orange-500" />
                      <span className="font-medium">{riskCount}</span>
                      <span>at risk</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="text-xs">
                      Stale (7+ days no update) or stuck in stage
                    </p>
                  </TooltipContent>
                </Tooltip>
              )}
              {!kanbanAllowed && viewMode === "kanban" && (
                <p className="text-[11px] text-muted-foreground">
                  Switch to All/Orders for board view.
                </p>
              )}
            </>
          }
        />

        {/* ── Content: List or Kanban ──────────────────────────────────── */}
        {viewMode === "list" ? (
          <OrderList orders={filteredOrders} />
        ) : (
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Drag cards between stages to update order status
              </p>
              <p className="text-xs text-muted-foreground">
                {filteredOrders.length}{" "}
                {filteredOrders.length === 1 ? "item" : "items"}
              </p>
            </div>
            <KanbanBoard
              orders={filteredOrders}
              onOrderMove={handleOrderMove}
              onCardClick={(order) =>
                router.push(`/orders/${order.shareableToken}`)
              }
            />
          </div>
        )}

        {/* ── Results info ─────────────────────────────────────────────── */}
        {hasFilters && filteredOrders.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Showing {filteredOrders.length} of {orders.length} records
            {activeFilters.length > 0 && (
              <span className="ml-1">
                · filtered by {activeFilters.map((f) => f.label).join(", ")}
              </span>
            )}
          </p>
        )}
      </div>
    </TooltipProvider>
  );
}
