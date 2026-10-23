"use client";

import {
  AlertTriangle,
  ArrowRight,
  ChartNoAxesColumn,
  Clock,
  MessageSquare,
  Package,
  PanelRightClose,
  PanelRightOpen,
  ShoppingBag,
  Store,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { OrderTypeBadge } from "@/components/orders/order-type-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getOrderEnquiryUiStatus,
  isEnquiryClosed,
  isEnquiryFinalized,
} from "@/lib/enquiryStatus";
import { formatAnalyticsPeriod, formatDuration } from "@/lib/ordersAnalytics";
import { getInitials } from "@/lib/people";
import { useActivitySidebar } from "@/lib/stores/activity-sidebar-store";
import {
  cn,
  formatDaysRemaining,
  formatRelativeTime,
  getUrgencyLevel,
} from "@/lib/utils";
import type { Order } from "@/types";
import type { OrdersEnquiriesAnalyticsResponse } from "@/types/orders-enquiries-analytics-api";
import {
  AnalyticsState,
  DashboardHeader,
  EmptyRows,
  MetricCard,
  type MetricCardData,
  MetricsGrid,
} from "./DashboardPrimitives";
import { OrdersAnalyticsCharts } from "./OrdersAnalyticsCharts";
import { RecentActivities } from "./RecentActivities";
import { SalesAnalyticsSection } from "./SalesAnalyticsSection";
import { SalesLeaderboardCard } from "./SalesLeaderboardCard";
import { MySalesPerformanceCard } from "./SalesPerformanceCard";

export type SalesTab =
  | "orders"
  | "enquiries"
  | "store-orders"
  | "store-enquiries";
type AdminDashboardTab = "orders-enquiries" | "sales-analytics";

interface AnalyticsDashboardProps {
  analytics?: OrdersEnquiriesAnalyticsResponse;
  analyticsError: Error | null;
  analyticsLoading: boolean;
  onRetryAnalytics: () => void;
}

const RECORD_PREVIEW_LIMIT = 8;

const TAB_TRIGGER_CLASS =
  "h-11 flex-none rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 shadow-none data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none";

function getRecordHref(order: Order) {
  return order.type === "enquiry"
    ? `/enquiries/${order.refCode}`
    : `/orders/${order.refCode}`;
}

function getAdminDashboardTab(tab: string | null): AdminDashboardTab {
  return tab === "sales-analytics" ? tab : "orders-enquiries";
}

const activeOrdersCard = (
  analytics: OrdersEnquiriesAnalyticsResponse,
): MetricCardData => ({
  label: "Active orders",
  value: String(analytics.currentSnapshot.activeOrders),
  helper: `${analytics.currentSnapshot.overdueOrders} overdue · ${analytics.currentSnapshot.dueSoonOrders} due soon`,
  href: "/orders-workspace?type=order",
  icon: Package,
  tone: "blue",
});

const openEnquiriesCard = (
  analytics: OrdersEnquiriesAnalyticsResponse,
): MetricCardData => {
  const firstEstimate = formatDuration(
    analytics.periodActivity.timing.medianHoursToFirstEstimate,
    "h",
  );

  return {
    label: "Open enquiries",
    value: String(analytics.currentSnapshot.openEnquiries),
    helper: firstEstimate
      ? `Median ${firstEstimate} to first estimate`
      : `${analytics.periodActivity.enquiriesCreated} created this period`,
    href: "/orders-workspace?type=enquiry",
    icon: MessageSquare,
    tone: "amber",
  };
};

const conversionCard = (
  analytics: OrdersEnquiriesAnalyticsResponse,
): MetricCardData => {
  const { conversion, enquiriesCreated } = analytics.periodActivity;

  return {
    label: "Enquiry to order",
    value: `${conversion.enquiryToOrderRate}%`,
    helper: `${conversion.enquiriesWithOrders} of ${enquiriesCreated} enquiries`,
    icon: TrendingUp,
    tone: "violet",
  };
};

function getAdminCards(
  analytics: OrdersEnquiriesAnalyticsResponse,
): MetricCardData[] {
  const { conversion, ordersCreated } = analytics.periodActivity;

  return [
    activeOrdersCard(analytics),
    openEnquiriesCard(analytics),
    {
      label: "Orders created",
      value: String(ordersCreated),
      helper: `${conversion.enquiryOrders} from enquiries · ${conversion.directOrders} direct`,
      icon: ShoppingBag,
      tone: "emerald",
    },
    conversionCard(analytics),
  ];
}

function getOperationsCards(
  analytics: OrdersEnquiriesAnalyticsResponse,
): MetricCardData[] {
  const { currentSnapshot } = analytics;

  return [
    activeOrdersCard(analytics),
    openEnquiriesCard(analytics),
    {
      label: "Overdue",
      value: String(currentSnapshot.overdueOrders),
      helper: "Past delivery date",
      icon: AlertTriangle,
      tone: "red",
    },
    {
      label: "Due soon",
      value: String(currentSnapshot.dueSoonOrders),
      helper: `${currentSnapshot.noDeliveryDateOrders} without a delivery date`,
      icon: Clock,
      tone: "amber",
    },
  ];
}

function ActivityToggle() {
  const { isOpen, toggle } = useActivitySidebar();
  const Icon = isOpen ? PanelRightClose : PanelRightOpen;

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={toggle}
      aria-pressed={isOpen}
      className="print-hide hidden xl:inline-flex"
    >
      <Icon className="size-4" />
      {isOpen ? "Hide activity" : "Show activity"}
    </Button>
  );
}

function WithActivityColumn({ children }: { children: React.ReactNode }) {
  const isOpen = useActivitySidebar((state) => state.isOpen);

  return (
    <div
      className={cn(
        "grid gap-5",
        isOpen && "xl:grid-cols-[minmax(0,1fr)_22rem]",
      )}
    >
      <div className="min-w-0 space-y-5">{children}</div>
      {/* The toggle only exists where activity is a side column (xl); below that it always stacks underneath. */}
      <aside
        className={cn(
          "min-w-0 xl:sticky xl:top-6 xl:self-start",
          !isOpen && "xl:hidden",
        )}
      >
        <RecentActivities className="max-h-[32rem] xl:max-h-[calc(100svh-3rem)]" />
      </aside>
    </div>
  );
}

function OrdersOverview({
  analytics,
  analyticsError,
  analyticsLoading,
  onRetryAnalytics,
  getCards,
}: AnalyticsDashboardProps & {
  getCards: (analytics: OrdersEnquiriesAnalyticsResponse) => MetricCardData[];
}) {
  if (!analytics) {
    return (
      <AnalyticsState
        error={analyticsError}
        isLoading={analyticsLoading}
        onRetry={onRetryAnalytics}
      />
    );
  }

  return (
    <>
      <MetricsGrid>
        {getCards(analytics).map((card) => (
          <MetricCard key={card.label} card={card} />
        ))}
      </MetricsGrid>
      <OrdersAnalyticsCharts analytics={analytics} />
    </>
  );
}

function RecordRow({ order }: { order: Order }) {
  const urgency = getUrgencyLevel(order.deliveryDate);

  return (
    <Link
      href={getRecordHref(order)}
      className="group flex items-center gap-3 border-b border-border/60 px-4 py-3 transition-colors last:border-b-0 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
    >
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            {order.type === "order" ? (
              <OrderTypeBadge
                productType={order.productType}
                isRefill={order.isRefill}
              />
            ) : (
              <Badge variant="outline" className="text-[10px]">
                Enquiry
              </Badge>
            )}
            <span className="truncate text-xs font-medium text-muted-foreground">
              {order.currentStage}
            </span>
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">
            {formatRelativeTime(order.lastUpdatedAt)}
          </span>
        </div>
        <p className="truncate text-base font-semibold text-foreground">
          {order.customerName}
        </p>
        <div className="flex items-center justify-between gap-3">
          <p className="truncate text-sm text-muted-foreground">
            {order.orderNumber ?? "Enquiry"} · {order.category}
          </p>
          <p
            className={cn(
              "shrink-0 text-sm font-medium",
              urgency === "overdue" && "text-red-600 dark:text-red-400",
              urgency === "due-soon" && "text-amber-600 dark:text-amber-400",
              urgency === "on-track" &&
                "text-emerald-600 dark:text-emerald-400",
              urgency === "none" && "text-muted-foreground",
            )}
          >
            {formatDaysRemaining(order.deliveryDate)}
          </p>
        </div>
      </div>
      <ArrowRight className="size-4 shrink-0 text-muted-foreground/35 transition-colors group-hover:text-muted-foreground max-sm:hidden" />
    </Link>
  );
}

function EnquiryRow({ order }: { order: Order }) {
  const person = order.createdBy ?? { id: "", name: "Unknown", image: null };

  return (
    <Link
      href={getRecordHref(order)}
      className="group flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3 transition-colors last:border-b-0 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
    >
      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-sm text-muted-foreground">#{order.refCode}</span>
        <span className="truncate font-medium text-foreground">
          {order.customerName}
        </span>
        <Badge
          variant={isEnquiryClosed(order) ? "secondary" : "default"}
          className="text-[10px]"
        >
          {getOrderEnquiryUiStatus(order)}
        </Badge>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="whitespace-nowrap text-xs text-muted-foreground sm:text-sm">
          {formatRelativeTime(order.createdAt)}
        </span>
        <Avatar size="sm" title={person.name}>
          {person.image && <AvatarImage src={person.image} alt={person.name} />}
          <AvatarFallback className="text-[10px]">
            {getInitials(person)}
          </AvatarFallback>
        </Avatar>
        <span className="max-w-[10rem] truncate text-sm font-medium text-foreground max-md:hidden">
          {person.name}
        </span>
      </div>
    </Link>
  );
}

export function AdminDashboard(props: AnalyticsDashboardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = getAdminDashboardTab(searchParams.get("tab"));
  const periodLabel = props.analytics
    ? formatAnalyticsPeriod(props.analytics.period)
    : null;

  const handleTabChange = (tab: string) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("tab", getAdminDashboardTab(tab));
    router.replace(`${pathname}?${nextParams.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-5 pb-6">
      <DashboardHeader
        title="Admin Dashboard"
        description="Pipeline health, sales performance and team activity."
        actions={activeTab === "orders-enquiries" && <ActivityToggle />}
      />

      <Tabs value={activeTab} onValueChange={handleTabChange} className="gap-5">
        <div className="-mx-4 flex items-end justify-between gap-4 overflow-x-auto border-b border-border px-4 scrollbar-none sm:mx-0 sm:px-0">
          <TabsList className="h-auto shrink-0 justify-start gap-6 rounded-none border-0 bg-transparent p-0 text-muted-foreground">
            <TabsTrigger value="orders-enquiries" className={TAB_TRIGGER_CLASS}>
              <ChartNoAxesColumn className="size-4" />
              Orders & Enquiries
            </TabsTrigger>
            <TabsTrigger value="sales-analytics" className={TAB_TRIGGER_CLASS}>
              <Users className="size-4" />
              Sales Analytics
            </TabsTrigger>
          </TabsList>
          {activeTab === "orders-enquiries" && periodLabel && (
            <span className="pb-3 text-xs text-muted-foreground max-sm:hidden">
              {periodLabel}
            </span>
          )}
        </div>

        <TabsContent value="orders-enquiries">
          <WithActivityColumn>
            <OrdersOverview {...props} getCards={getAdminCards} />
          </WithActivityColumn>
        </TabsContent>

        <TabsContent value="sales-analytics">
          <SalesAnalyticsSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function OperationsDashboard(props: AnalyticsDashboardProps) {
  return (
    <div className="space-y-5 pb-6">
      <DashboardHeader
        title="Operations Dashboard"
        description="A bird's-eye view of orders in progress and what needs attention."
        actions={<ActivityToggle />}
      />
      <WithActivityColumn>
        <OrdersOverview {...props} getCards={getOperationsCards} />
      </WithActivityColumn>
    </div>
  );
}

export function SalesDashboard({
  activeTab,
  onActiveTabChange,
  orders,
  storeOrders,
  storeLocation,
  storeRecordsLoading,
  storeRecordsError,
  ...analyticsProps
}: AnalyticsDashboardProps & {
  activeTab: SalesTab;
  onActiveTabChange: (tab: SalesTab) => void;
  orders: Order[];
  storeOrders: Order[];
  storeLocation: { name: string; city: string } | null;
  storeRecordsLoading: boolean;
  storeRecordsError: Error | null;
}) {
  const { analytics } = analyticsProps;
  const [showAllRecords, setShowAllRecords] = useState(false);
  const data = useMemo(() => {
    const byLastUpdated = (a: Order, b: Order) =>
      new Date(b.lastUpdatedAt).getTime() - new Date(a.lastUpdatedAt).getTime();

    return {
      openOrders: orders
        .filter(
          (o) =>
            o.type === "order" &&
            o.currentStage !== "Delivered" &&
            o.currentStage !== "Closed" &&
            o.currentStage !== "Cancelled",
        )
        .sort(byLastUpdated),
      openEnquiries: orders
        .filter((o) => o.type === "enquiry" && !isEnquiryFinalized(o))
        .sort(byLastUpdated),
      openStoreOrders: storeOrders.filter((order) => order.type === "order"),
      openStoreEnquiries: storeOrders.filter(
        (order) => order.type === "enquiry",
      ),
    };
  }, [orders, storeOrders]);

  const salesTabs = [
    {
      key: "orders" as const,
      label: "Open Orders",
      count: data.openOrders.length,
      icon: Package,
    },
    {
      key: "enquiries" as const,
      label: "Open Enquiries",
      count: data.openEnquiries.length,
      icon: MessageSquare,
    },
    ...(storeLocation
      ? [
          {
            key: "store-orders" as const,
            label: "Store Orders",
            count: data.openStoreOrders.length,
            icon: Store,
          },
          {
            key: "store-enquiries" as const,
            label: "Store Enquiries",
            count: data.openStoreEnquiries.length,
            icon: MessageSquare,
          },
        ]
      : []),
  ];
  const isStoreTab =
    activeTab === "store-orders" || activeTab === "store-enquiries";
  const activeCount =
    salesTabs.find((tab) => tab.key === activeTab)?.count ?? 0;
  const hiddenRecordCount = showAllRecords
    ? 0
    : Math.max(activeCount - RECORD_PREVIEW_LIMIT, 0);
  const limitRecords = (records: Order[]) =>
    showAllRecords ? records : records.slice(0, RECORD_PREVIEW_LIMIT);
  const storeName = storeLocation?.name ?? "your store";

  return (
    <div className="space-y-5 pb-6">
      <DashboardHeader
        title="Sales Dashboard"
        description="Keep an eye on your customers and sales pipeline."
      />

      <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-[minmax(0,3fr)_minmax(20rem,2fr)] lg:items-start">
        <MySalesPerformanceCard className="md:col-span-2 lg:col-span-1 lg:col-start-1 lg:row-start-1" />

        <section
          aria-label="Your records"
          className="min-w-0 md:col-span-2 lg:col-span-1 lg:col-start-1 lg:row-start-2"
        >
          <div
            role="toolbar"
            aria-label="Record lists"
            className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-0.5 scrollbar-none sm:mx-0 sm:px-0"
          >
            {salesTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    onActiveTabChange(tab.key);
                    setShowAllRecords(false);
                  }}
                  aria-pressed={isActive}
                  className={cn(
                    "flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                    isActive
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-card text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="size-4" />
                  {tab.label}
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                      isActive
                        ? "bg-background/20 text-background"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-3 overflow-hidden rounded-lg border border-border/70 bg-card">
            {activeTab === "orders" &&
              (data.openOrders.length > 0 ? (
                limitRecords(data.openOrders).map((order) => (
                  <RecordRow key={order.id} order={order} />
                ))
              ) : (
                <EmptyRows
                  title="No open orders"
                  description="All orders are either complete or not yet created."
                />
              ))}
            {activeTab === "enquiries" &&
              (data.openEnquiries.length > 0 ? (
                limitRecords(data.openEnquiries).map((order) => (
                  <EnquiryRow key={order.id} order={order} />
                ))
              ) : (
                <EmptyRows
                  title="No open enquiries"
                  description="Create a new enquiry to get started."
                />
              ))}
            {isStoreTab && storeRecordsLoading && (
              <div className="space-y-3 p-4" aria-live="polite">
                <span className="sr-only">Loading store records</span>
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            )}
            {isStoreTab && storeRecordsError && (
              <div className="px-5 py-8 text-center">
                <p className="text-sm font-medium text-foreground">
                  Store records could not be loaded.
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {storeRecordsError.message}
                </p>
              </div>
            )}
            {activeTab === "store-orders" &&
              !storeRecordsLoading &&
              !storeRecordsError &&
              (data.openStoreOrders.length > 0 ? (
                limitRecords(data.openStoreOrders).map((order) => (
                  <RecordRow key={order.id} order={order} />
                ))
              ) : (
                <EmptyRows
                  title="No open store orders"
                  description={`There are no open orders for ${storeName}.`}
                />
              ))}
            {activeTab === "store-enquiries" &&
              !storeRecordsLoading &&
              !storeRecordsError &&
              (data.openStoreEnquiries.length > 0 ? (
                limitRecords(data.openStoreEnquiries).map((order) => (
                  <EnquiryRow key={order.id} order={order} />
                ))
              ) : (
                <EmptyRows
                  title="No open store enquiries"
                  description={`There are no open enquiries for ${storeName}.`}
                />
              ))}
          </div>
          {hiddenRecordCount > 0 && (
            <Button
              type="button"
              variant="ghost"
              className="mt-2 h-10 w-full text-muted-foreground"
              onClick={() => setShowAllRecords(true)}
            >
              Show {hiddenRecordCount} more
            </Button>
          )}
        </section>

        <div className="min-w-0 md:col-span-2 lg:col-span-1 lg:col-start-1 lg:row-start-3">
          {analytics ? (
            <MetricsGrid>
              <MetricCard card={activeOrdersCard(analytics)} />
              <MetricCard card={openEnquiriesCard(analytics)} />
              <MetricCard
                card={{
                  label: "Overdue",
                  value: String(analytics.currentSnapshot.overdueOrders),
                  helper: "Past delivery date",
                  icon: AlertTriangle,
                  tone: "red",
                }}
              />
              <MetricCard card={conversionCard(analytics)} />
            </MetricsGrid>
          ) : (
            <AnalyticsState
              error={analyticsProps.analyticsError}
              isLoading={analyticsProps.analyticsLoading}
              onRetry={analyticsProps.onRetryAnalytics}
            />
          )}
        </div>

        <SalesLeaderboardCard className="md:col-span-2 lg:col-span-1 lg:col-start-2 lg:row-start-1 lg:row-span-3" />

        {analytics && (
          <div className="min-w-0 md:col-span-2 lg:row-start-4">
            <OrdersAnalyticsCharts analytics={analytics} />
          </div>
        )}
      </div>
    </div>
  );
}
