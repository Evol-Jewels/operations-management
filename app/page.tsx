"use client";

import { AlertTriangle, CheckCircle2, LayoutGrid, List } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { RequireInternalAuth } from "@/components/auth/RequireInternalAuth";
import { KanbanBoard } from "@/components/dashboard/KanbanBoard";
import { OrderList } from "@/components/dashboard/OrderList";
import { PipelineSummary } from "@/components/dashboard/PipelineSummary";
import { RecentActivities } from "@/components/dashboard/RecentActivities";
import {
  SearchFilter,
  type TypeFilter,
} from "@/components/dashboard/SearchFilter";
import { TodaysFocus } from "@/components/dashboard/TodaysFocus";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useOrdersStore } from "@/lib/stores/orders-store";
import { cn, computeRiskSignal, getUrgencyLevel } from "@/lib/utils";
import { STAGES, type Stage, type UrgencyLevel } from "@/types";

export default function DashboardPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [lastMoved, setLastMoved] = useState<{
    name: string;
    stage: string;
  } | null>(null);

  const orders = useOrdersStore((state) => state.records);
  const moveRecordStage = useOrdersStore((state) => state.moveRecordStage);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [stageFilter, setStageFilter] = useState<Stage | null>(null);
  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyLevel | null>(null);
  const [staffSearch, setStaffSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState(false);

  const kanbanAllowed = typeFilter !== "enquiry";

  useEffect(() => {
    if (!kanbanAllowed && viewMode === "kanban") {
      setViewMode("list");
    }
  }, [kanbanAllowed, viewMode]);

  const typeCounts = useMemo(() => {
    return orders.reduce(
      (acc, order) => {
        acc[order.type] = (acc[order.type] ?? 0) + 1;
        return acc;
      },
      {} as Record<TypeFilter, number>,
    );
  }, [orders]);

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

  const allPeople = useMemo(() => {
    const sales = [...new Set(orders.map((o) => o.salespersonName))];
    const vendors = [
      ...new Set(
        orders.map((o) => o.vendorName).filter((v): v is string => !!v),
      ),
    ];
    return { sales, vendors };
  }, [orders]);

  const urgencyCounts = useMemo(() => {
    return orders.reduce(
      (acc, order) => {
        const level = getUrgencyLevel(order.deliveryDate);
        acc[level] = (acc[level] ?? 0) + 1;
        return acc;
      },
      {} as Record<UrgencyLevel, number>,
    );
  }, [orders]);

  const riskCount = useMemo(() => {
    return orders.filter(
      (order) =>
        order.currentStage !== "Customer Pickup" &&
        computeRiskSignal(order) !== null,
    ).length;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders.filter((order) => {
      if (order.type === "enquiry" && order.status === "closed") return false;
      if (typeFilter !== "all" && order.type !== typeFilter) return false;
      if (stageFilter && order.currentStage !== stageFilter) return false;

      if (urgencyFilter) {
        const level = getUrgencyLevel(order.deliveryDate);
        if (level !== urgencyFilter) return false;
      }

      if (riskFilter && computeRiskSignal(order) === null) return false;

      if (staffSearch.trim()) {
        const staffQuery = staffSearch.trim().toLowerCase();
        const matchesSales = order.salespersonName
          .toLowerCase()
          .includes(staffQuery);
        const matchesVendor = order.vendorName
          ?.toLowerCase()
          .includes(staffQuery);
        if (!matchesSales && !matchesVendor) return false;
      }

      if (query) {
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

        if (!haystack.includes(query)) return false;
      }

      return true;
    });
  }, [
    orders,
    riskFilter,
    search,
    stageFilter,
    staffSearch,
    typeFilter,
    urgencyFilter,
  ]);

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
  }, [riskFilter, stageFilter, staffSearch, typeFilter, urgencyFilter]);

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

  const handleOrderMove = (orderId: string, newStage: Stage) => {
    const movedOrder = orders.find((order) => order.id === orderId) ?? null;
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
      note: `Moved from ${movedOrder.currentStage} to ${newStage} via kanban board`,
    });

    setLastMoved({ name: movedOrder.customerName, stage: newStage });
    setTimeout(() => setLastMoved(null), 3000);
  };

  return (
    <RequireInternalAuth>
      <TooltipProvider>
        <div className="space-y-6 lg:space-y-7">
          {lastMoved && (
            <div className="flex items-center gap-2 rounded-2xl border border-emerald-200/80 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-700 shadow-sm dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              <span>
                <strong>{lastMoved.name}</strong> moved to{" "}
                <strong>{lastMoved.stage}</strong>
              </span>
            </div>
          )}

          <section className="overflow-hidden rounded-[2rem] border border-border/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(248,244,238,0.88)_55%,rgba(241,234,225,0.92))] p-5 shadow-[0_24px_70px_-42px_rgba(15,23,42,0.35)] sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                  Operations Dashboard
                </p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-[2rem]">
                  Monitor live work without losing the bottlenecks.
                </h1>
                <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                  Active orders, recent movement, and pipeline risk stay visible
                  in one clean workspace.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="min-w-28 rounded-2xl border border-border/70 bg-white/75 px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Open Records
                  </p>
                  <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                    {orders.length}
                  </p>
                </div>
                <div className="min-w-28 rounded-2xl border border-border/70 bg-white/75 px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    At Risk
                  </p>
                  <p className="mt-1 text-2xl font-semibold tracking-tight text-orange-600">
                    {riskCount}
                  </p>
                </div>
                <div className="min-w-28 rounded-2xl border border-border/70 bg-white/75 px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Overdue
                  </p>
                  <p className="mt-1 text-2xl font-semibold tracking-tight text-red-600">
                    {urgencyCounts.overdue ?? 0}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.8fr)_minmax(300px,0.9fr)] xl:grid-cols-[minmax(0,2.1fr)_360px]">
            <div className="space-y-6">
              <TodaysFocus orders={orders} />

              <section className="rounded-[2rem] border border-border/70 bg-card/92 p-5 shadow-[0_20px_60px_-38px_rgba(15,23,42,0.3)] backdrop-blur-sm">
                <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/80">
                      Current Orders and Enquiries
                    </span>
                    <h2 className="mt-1 text-base font-semibold tracking-tight text-foreground">
                      {filteredOrders.length} of {orders.length} records
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Stage cards, filters, and list or board view stay grouped
                      in one work area.
                    </p>
                  </div>

                  <div className="flex items-center gap-1 rounded-full border border-border/80 bg-background/90 p-1">
                    <button
                      type="button"
                      onClick={() => setViewMode("list")}
                      className={cn(
                        "flex min-h-11 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium transition-colors",
                        viewMode === "list"
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                      title="List view"
                    >
                      <List className="h-3.5 w-3.5" />
                      <span>List</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => kanbanAllowed && setViewMode("kanban")}
                      disabled={!kanbanAllowed}
                      className={cn(
                        "flex min-h-11 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium transition-colors",
                        viewMode === "kanban"
                          ? "bg-muted text-foreground"
                          : !kanbanAllowed
                            ? "cursor-not-allowed opacity-40"
                            : "text-muted-foreground hover:text-foreground",
                      )}
                      title={
                        kanbanAllowed
                          ? "Board view"
                          : "Board view only for orders"
                      }
                    >
                      <LayoutGrid className="h-3.5 w-3.5" />
                      <span>Board</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-5">
                  <PipelineSummary
                    stageCounts={stageCounts}
                    activeFilter={stageFilter}
                    onFilterChange={setStageFilter}
                    typeFilter={typeFilter}
                  />

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
                                type="button"
                                onClick={() =>
                                  setUrgencyFilter(
                                    urgencyFilter === "overdue"
                                      ? null
                                      : "overdue",
                                  )
                                }
                                className={cn(
                                  "flex min-h-9 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors",
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
                                {urgencyFilter === "overdue"
                                  ? "show all"
                                  : "filter"}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        )}

                        {urgencyCounts["due-soon"] > 0 && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() =>
                                  setUrgencyFilter(
                                    urgencyFilter === "due-soon"
                                      ? null
                                      : "due-soon",
                                  )
                                }
                                className={cn(
                                  "flex min-h-9 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors",
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
                                {urgencyFilter === "due-soon"
                                  ? "show all"
                                  : "filter"}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        )}

                        {urgencyCounts["on-track"] > 0 && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() =>
                                  setUrgencyFilter(
                                    urgencyFilter === "on-track"
                                      ? null
                                      : "on-track",
                                  )
                                }
                                className={cn(
                                  "flex min-h-9 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors",
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
                                {urgencyFilter === "on-track"
                                  ? "show all"
                                  : "filter"}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        )}

                        {riskCount > 0 && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() => setRiskFilter((v) => !v)}
                                className={cn(
                                  "flex min-h-9 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors",
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
                      </>
                    }
                  />

                  {viewMode === "kanban" ? (
                    <div className="rounded-[1.5rem] border border-border/70 bg-background/70 p-4">
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
                  ) : (
                    <OrderList orders={filteredOrders} />
                  )}

                  {hasFilters && filteredOrders.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Showing {filteredOrders.length} of {orders.length} records
                      {activeFilters.length > 0 && (
                        <span className="ml-1">
                          {" "}
                          · filtered by{" "}
                          {activeFilters.map((f) => f.label).join(", ")}
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </section>
            </div>

            <div className="lg:sticky lg:top-6 lg:self-start">
              <RecentActivities
                orders={orders}
                className="lg:max-h-[calc(100vh-3rem)]"
              />
            </div>
          </div>
        </div>
      </TooltipProvider>
    </RequireInternalAuth>
  );
}
