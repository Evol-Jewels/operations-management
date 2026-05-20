"use client";

import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  IndianRupee,
  MessageSquare,
  Package,
  Store,
  TrendingUp,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  cn,
  computeRiskSignal,
  formatCurrency,
  getUrgencyLevel,
} from "@/lib/utils";
import { type Order, STAGES } from "@/types";

type ActiveTab = "overview" | "sales" | "stores";

interface MetricCard {
  label: string;
  value: string;
  change: number;
  helper: string;
  icon: React.ReactNode;
  accent: string;
}

interface ChartDatum {
  label: string;
  value: number;
  color: string;
}

const BAR_COLORS = [
  "bg-orange-600",
  "bg-teal-600",
  "bg-sky-900",
  "bg-amber-500",
  "bg-orange-400",
  "bg-cyan-600",
  "bg-slate-500",
  "bg-emerald-600",
];

const CHART_COLORS = [
  "oklch(0.62 0.22 35)",
  "oklch(0.55 0.13 178)",
  "oklch(0.38 0.09 225)",
  "oklch(0.76 0.17 72)",
  "oklch(0.68 0.19 46)",
  "oklch(0.56 0.13 255)",
  "oklch(0.59 0.14 145)",
  "oklch(0.64 0.11 62)",
];

const CITY_BASELINE: Record<string, number> = {
  Mumbai: 18,
  Hyderabad: 12,
  Bangalore: 10,
  Chennai: 7,
  Jaipur: 6,
  Kolkata: 5,
  Delhi: 4,
  Pune: 2,
};

const STORE_VISITS = [
  [3, 0, 4, 3, 2, 2, 4],
  [1, 2, 1, 1, 1, 4, 2],
  [2, 1, 2, 3, 1, 5, 4],
  [4, 3, 4, 4, 6, 10, 9],
  [3, 6, 5, 11, 9, 7, 9],
  [3, 3, 4, 6, 4, 12, 5],
  [4, 5, 6, 7, 4, 7, 7],
  [4, 3, 2, 2, 0, 5, 3],
  [1, 4, 4, 1, 4, 5, 2],
  [2, 2, 0, 4, 4, 3, 2],
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = [
  "10 AM",
  "11 AM",
  "12 PM",
  "1 PM",
  "2 PM",
  "3 PM",
  "4 PM",
  "5 PM",
  "6 PM",
  "7 PM",
];

function MetricCard({ card }: { card: MetricCard }) {
  const isPositive = card.change >= 0;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">
            {card.label}
          </p>
          <p className="mt-2 truncate text-2xl font-semibold tracking-tight text-foreground">
            {card.value}
          </p>
        </div>
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
            card.accent,
          )}
        >
          {card.icon}
        </div>
      </div>
      <div className="mt-4 flex items-center gap-1.5">
        <span
          className={cn(
            "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
            isPositive
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
              : "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400",
          )}
        >
          {isPositive ? (
            <ArrowUp className="h-2.5 w-2.5" />
          ) : (
            <ArrowDown className="h-2.5 w-2.5" />
          )}
          {Math.abs(card.change)}%
        </span>
        <span className="text-[11px] text-muted-foreground">{card.helper}</span>
      </div>
    </div>
  );
}

function Panel({
  eyebrow,
  title,
  children,
  className,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-border bg-card p-5 shadow-sm",
        className,
      )}
    >
      <div className="mb-5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/80">
          {eyebrow}
        </span>
        <h2 className="mt-1 text-base font-semibold tracking-tight text-foreground">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function HorizontalBar({
  item,
  max,
  index,
}: {
  item: ChartDatum;
  max: number;
  index: number;
}) {
  const pct = max > 0 ? (item.value / max) * 100 : 0;

  return (
    <div className="grid grid-cols-[150px_1fr_36px] items-center gap-3">
      <span className="truncate text-sm text-muted-foreground">
        {item.label}
      </span>
      <div className="h-9 overflow-hidden rounded-lg bg-muted/60">
        <div
          className={cn(
            "h-full rounded-lg transition-all duration-500",
            BAR_COLORS[index % BAR_COLORS.length],
          )}
          style={{ width: `${Math.max(pct, item.value > 0 ? 2 : 0)}%` }}
        />
      </div>
      <span className="text-right text-sm tabular-nums text-foreground">
        {item.value}
      </span>
    </div>
  );
}

function DonutChart({
  data,
  size = 150,
}: {
  data: ChartDatum[];
  size?: number;
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let offset = 25;
  const segments =
    total > 0
      ? data
          .filter((item) => item.value > 0)
          .map((item) => {
            const length = (item.value / total) * 100;
            const segment = (
              <circle
                key={item.label}
                cx="21"
                cy="21"
                r="15.915"
                fill="transparent"
                stroke={item.color}
                strokeDasharray={`${length} ${100 - length}`}
                strokeDashoffset={offset}
                strokeWidth="8"
              />
            );
            offset -= length;
            return segment;
          })
      : [];

  return (
    <div className="flex flex-wrap items-center justify-center gap-8">
      <svg
        viewBox="0 0 42 42"
        width={size}
        height={size}
        className="-rotate-90"
        aria-label="Donut chart"
        role="img"
      >
        <circle
          cx="21"
          cy="21"
          r="15.915"
          fill="transparent"
          stroke="currentColor"
          className="text-muted"
          strokeWidth="8"
        />
        {segments}
      </svg>
      <div className="grid min-w-36 gap-2">
        {data.map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-sm">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="flex-1 text-muted-foreground">{item.label}</span>
            <span className="font-medium tabular-nums text-foreground">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Heatmap() {
  const max = Math.max(...STORE_VISITS.flat());

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        <div className="mb-2 grid grid-cols-[70px_repeat(7,1fr)] gap-1.5">
          <div />
          {DAYS.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>
        {HOURS.map((hour, hourIndex) => (
          <div
            key={hour}
            className="mb-1.5 grid grid-cols-[70px_repeat(7,1fr)] gap-1.5"
          >
            <div className="flex items-center text-xs text-muted-foreground">
              {hour}
            </div>
            {STORE_VISITS[hourIndex].map((value, dayIndex) => {
              const intensity = value / max;
              return (
                <div
                  key={`${hour}-${DAYS[dayIndex]}`}
                  className="flex h-10 items-center justify-center rounded-lg text-xs tabular-nums"
                  style={{
                    backgroundColor:
                      value === 0
                        ? "oklch(0.97 0 0)"
                        : `oklch(0.92 ${0.05 + intensity * 0.13} 45)`,
                    color: intensity > 0.65 ? "white" : "oklch(0.57 0.2 38)",
                  }}
                >
                  {value}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function getCity(order: Order) {
  const location = order.customerLocation ?? order.customerAddress ?? "";
  const city = Object.keys(CITY_BASELINE).find((name) =>
    location.toLowerCase().includes(name.toLowerCase()),
  );
  return (
    city ?? (order.salespersonName.includes("Ananya") ? "Mumbai" : "Delhi")
  );
}

function getAnalytics(orders: Order[]) {
  const allOrders = orders.filter((order) => order.type === "order");
  const allEnquiries = orders.filter((order) => order.type === "enquiry");
  const activeOrders = allOrders.filter(
    (order) => order.currentStage !== "Customer Pickup",
  );
  const openEnquiries = allEnquiries.filter(
    (order) => order.status !== "closed",
  );
  const closedEnquiries = allEnquiries.filter(
    (order) => order.status === "closed",
  );
  const revenue = allOrders.reduce(
    (sum, order) => sum + (order.totalEstimate ?? 0),
    0,
  );
  const averageOrderValue =
    allOrders.length > 0 ? Math.round(revenue / allOrders.length) : 0;

  const stageCounts = STAGES.map((stage) => ({
    label: stage,
    value: allOrders.filter((order) => order.currentStage === stage).length,
    color: "",
  }));

  const categoryCounts = Object.entries(
    orders.reduce<Record<string, number>>((acc, order) => {
      acc[order.category] = (acc[order.category] ?? 0) + 1;
      return acc;
    }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .map(([label, value], index) => ({
      label,
      value,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }));

  const urgency = {
    overdue: 0,
    "due-soon": 0,
    "on-track": 0,
    none: 0,
  };
  for (const order of activeOrders) {
    urgency[getUrgencyLevel(order.deliveryDate)] += 1;
  }

  const cityCounts = Object.entries(
    allOrders.reduce<Record<string, number>>(
      (acc, order) => {
        const city = getCity(order);
        acc[city] = (acc[city] ?? CITY_BASELINE[city] ?? 0) + 1;
        return acc;
      },
      { ...CITY_BASELINE },
    ),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([label, value]) => ({ label, value, color: "" }));

  const salesStats = Object.values(
    orders.reduce<
      Record<
        string,
        {
          name: string;
          orders: number;
          enquiries: number;
          revenue: number;
          closed: number;
        }
      >
    >((acc, order) => {
      const person = order.salespersonName;
      acc[person] ??= {
        name: person,
        orders: 0,
        enquiries: 0,
        revenue: 0,
        closed: 0,
      };
      if (order.type === "order") {
        acc[person].orders += 1;
        acc[person].revenue += order.totalEstimate ?? 0;
      } else {
        acc[person].enquiries += 1;
        if (order.status === "closed") acc[person].closed += 1;
      }
      return acc;
    }, {}),
  ).sort((a, b) => b.revenue - a.revenue);

  const storeStats = cityCounts.slice(0, 5).map((city) => ({
    name: city.label,
    orders: city.value,
    revenue: city.value * 82000,
    visits: city.value * 4 + 12,
  }));

  const riskItems = orders
    .filter((order) => order.currentStage !== "Customer Pickup")
    .map((order) => ({ order, signal: computeRiskSignal(order) }))
    .filter(
      (item): item is { order: Order; signal: "stale" | "stuck" } =>
        !!item.signal,
    );

  return {
    allOrders,
    allEnquiries,
    activeOrders,
    openEnquiries,
    closedEnquiries,
    revenue,
    averageOrderValue,
    stageCounts,
    categoryCounts,
    urgency,
    cityCounts,
    salesStats,
    storeStats,
    riskItems,
  };
}

export function AdminAnalyticsDashboard({ orders }: { orders: Order[] }) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const analytics = useMemo(() => getAnalytics(orders), [orders]);

  const cards: MetricCard[] = [
    {
      label: "Total Orders",
      value: String(analytics.allOrders.length),
      change: 12,
      helper: "vs last period",
      icon: <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />,
      accent: "bg-blue-50 dark:bg-blue-950/50",
    },
    {
      label: "Active Enquiries",
      value: String(analytics.openEnquiries.length),
      change: 8,
      helper: "vs last period",
      icon: (
        <MessageSquare className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      ),
      accent: "bg-amber-50 dark:bg-amber-950/50",
    },
    {
      label: "Revenue Pipeline",
      value: formatCurrency(analytics.revenue),
      change: 18,
      helper: "estimated value",
      icon: (
        <IndianRupee className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
      ),
      accent: "bg-emerald-50 dark:bg-emerald-950/50",
    },
    {
      label: "Average Order Value",
      value: formatCurrency(analytics.averageOrderValue),
      change: -3,
      helper: "needs lift",
      icon: (
        <TrendingUp className="h-4 w-4 text-violet-600 dark:text-violet-400" />
      ),
      accent: "bg-violet-50 dark:bg-violet-950/50",
    },
  ];

  const tabs: { key: ActiveTab; label: string; icon: React.ReactNode }[] = [
    {
      key: "overview",
      label: "Overview",
      icon: <BarChart3 className="h-4 w-4" />,
    },
    { key: "sales", label: "Sales Team", icon: <Users className="h-4 w-4" /> },
    { key: "stores", label: "Stores", icon: <Store className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Admin Dashboard
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            Business analytics and operational health
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Performance, pipeline risk, enquiries, and store activity at a
            glance.
          </p>
        </div>
        <Button asChild variant="outline" className="self-start sm:self-auto">
          <a href="/orders-and-enquiries">Open orders workspace</a>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <MetricCard key={card.label} card={card} />
        ))}
      </div>

      <div className="flex items-center gap-1 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex min-h-11 cursor-pointer items-center gap-1.5 border-b-2 px-4 py-2 text-sm font-medium transition-colors",
              activeTab === tab.key
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <Panel eyebrow="Pipeline" title="Orders by Stage">
              <div className="space-y-3">
                {analytics.stageCounts.map((item, index) => (
                  <HorizontalBar
                    key={item.label}
                    item={item}
                    max={Math.max(
                      ...analytics.stageCounts.map((stage) => stage.value),
                      1,
                    )}
                    index={index}
                  />
                ))}
              </div>
            </Panel>

            <Panel eyebrow="Products" title="By Category">
              <DonutChart data={analytics.categoryCounts} />
            </Panel>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Panel
              eyebrow="Needs Attention"
              title="Falling Orders and Enquiries"
            >
              <div className="space-y-3">
                {analytics.riskItems.slice(0, 5).map(({ order, signal }) => (
                  <a
                    key={order.id}
                    href={`/orders/${order.shareableToken}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/70 px-4 py-3 transition-colors hover:bg-muted/40"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            "capitalize",
                            signal === "stale"
                              ? "border-orange-200 text-orange-700"
                              : "border-amber-200 text-amber-700",
                          )}
                        >
                          {signal}
                        </Badge>
                        <span className="truncate text-xs text-muted-foreground">
                          {order.type === "order" ? "Order" : "Enquiry"}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-sm font-medium text-foreground">
                        {order.customerName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {order.currentStage} · {order.salespersonName}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {order.deliveryDate ?? "No date"}
                    </span>
                  </a>
                ))}
                {analytics.riskItems.length === 0 && (
                  <div className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
                    No falling orders or enquiries right now.
                  </div>
                )}
              </div>
            </Panel>

            <Panel eyebrow="Enquiries" title="Status Breakdown">
              <DonutChart
                data={[
                  {
                    label: "Open",
                    value: analytics.openEnquiries.length,
                    color: "oklch(0.55 0.13 178)",
                  },
                  {
                    label: "Converted",
                    value: analytics.allOrders.filter((o) => o.sourceEnquiryId)
                      .length,
                    color: "oklch(0.68 0.19 46)",
                  },
                  {
                    label: "Closed",
                    value: analytics.closedEnquiries.length,
                    color: "oklch(0.38 0.09 225)",
                  },
                ]}
                size={132}
              />
              <div className="mt-5 grid grid-cols-3 gap-3">
                {[
                  { label: "Conversion", value: "42%" },
                  { label: "Avg Response", value: "2.4h" },
                  { label: "Close Time", value: "6d" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-lg bg-muted/50 px-3 py-2.5 text-center"
                  >
                    <p className="text-lg font-semibold tracking-tight text-foreground">
                      {stat.value}
                    </p>
                    <p className="mt-0.5 text-[10px] font-medium text-muted-foreground">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Panel eyebrow="Geography" title="Orders by City">
              <div className="space-y-3">
                {analytics.cityCounts.map((item, index) => (
                  <HorizontalBar
                    key={item.label}
                    item={item}
                    max={Math.max(
                      ...analytics.cityCounts.map((city) => city.value),
                      1,
                    )}
                    index={index}
                  />
                ))}
              </div>
            </Panel>
            <Panel eyebrow="Footfall" title="Store Visits by Time">
              <Heatmap />
            </Panel>
          </div>
        </div>
      )}

      {activeTab === "sales" && (
        <Panel eyebrow="Performance" title="Salesperson Leaderboard">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Enquiries</TableHead>
                <TableHead className="text-right">Conversion</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analytics.salesStats.map((person) => {
                const total = person.orders + person.enquiries;
                const conversion =
                  total > 0 ? Math.round((person.orders / total) * 100) : 0;

                return (
                  <TableRow key={person.name}>
                    <TableCell className="font-medium">{person.name}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {person.orders}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {person.enquiries}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">{conversion}%</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatCurrency(person.revenue)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Panel>
      )}

      {activeTab === "stores" && (
        <Panel eyebrow="Stores" title="Store Performance">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Store</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Visits</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analytics.storeStats.map((store) => (
                <TableRow key={store.name}>
                  <TableCell className="font-medium">{store.name}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {store.orders}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {store.visits}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatCurrency(store.revenue)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Panel>
      )}
    </div>
  );
}
