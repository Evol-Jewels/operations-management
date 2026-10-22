"use client";

import {
  ArrowLeft,
  Boxes,
  Download,
  IndianRupee,
  LoaderCircle,
  PackageCheck,
  Scale,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  EvilPieChart,
  Tooltip as EvilPieTooltip,
  Pie,
} from "@/components/evilcharts/charts/pie-chart";
import type { ChartConfig } from "@/components/evilcharts/ui/chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInventoryAnalytics } from "@/hooks/useInventoryProducts";
import { useLocations } from "@/hooks/useManageProducts";
import { useVendors } from "@/hooks/useVendors";
import { downloadInventoryAnalyticsCsv } from "@/lib/inventoryApi";
import { cn } from "@/lib/utils";
import type { InventoryAnalyticsBucket } from "@/types/inventory-api";
import {
  AnalyticsFilterControls,
  COLOR_LABELS,
  type ColorFilter,
  type LocationFilter,
  PURITY_LABELS,
  type PurityFilter,
} from "./AnalyticsFilterControls";
import { AnalyticsFilterPopover } from "./AnalyticsFilterPopover";
import {
  ANALYTICS_CARD_CLASS,
  formatCurrency,
  formatNumber,
  formatWeight,
  getPercent,
  sourceChartColors,
  topBuckets,
} from "./analytics-shared";
import { CategoryLocationExplorer } from "./CategoryLocationExplorer";
import { ProductDistributionSankeyCard } from "./ProductDistributionSankeyCard";
import { ProductMixCard } from "./ProductMixCard";
import { SoldProductsReport } from "./SoldProductsReport";

type StatusFilter = "ALL" | "AVAILABLE" | "NOT_AVAILABLE";
const DEFAULT_STATUS_FILTER: StatusFilter = "AVAILABLE";

const segmentTriggerClassName =
  "h-9 rounded-lg text-foreground hover:text-foreground data-[state=active]:bg-zinc-950 data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-zinc-950";

type ChartBucket = InventoryAnalyticsBucket & Record<string, unknown>;

function getBucketChartConfig(items: InventoryAnalyticsBucket[]) {
  return items.reduce<ChartConfig>((config, item, index) => {
    config[item.key] = {
      label: item.label,
      colors: {
        light: [sourceChartColors[index % sourceChartColors.length]],
        dark: [sourceChartColors[index % sourceChartColors.length]],
      },
    };
    return config;
  }, {});
}

function getStatusFilter(params: URLSearchParams): StatusFilter {
  const status = params.get("status");
  if (status === "ALL" || status === "NOT_AVAILABLE") return status;
  return DEFAULT_STATUS_FILTER;
}

function getColorFilter(params: URLSearchParams): ColorFilter {
  const color = params.get("color");
  return color && Object.keys(COLOR_LABELS).includes(color)
    ? (color as ColorFilter)
    : "ALL";
}

function getPurityFilter(params: URLSearchParams): PurityFilter {
  const purity = params.get("purity");
  return purity && Object.keys(PURITY_LABELS).includes(purity)
    ? (purity as PurityFilter)
    : "ALL";
}

function getLocationFilter(params: URLSearchParams): LocationFilter {
  return params.get("locationId") ?? "ALL";
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  toneClassName,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof Boxes;
  toneClassName: string;
}) {
  return (
    <Card className={cn(ANALYTICS_CARD_CLASS, "overflow-hidden")}>
      <CardContent className="flex items-start justify-between gap-4 p-3 sm:min-h-28 sm:p-4">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-medium uppercase tracking-normal text-muted-foreground sm:text-xs">
            {label}
          </p>
          <p className="mt-2 truncate text-lg font-semibold leading-none tracking-tight text-foreground sm:text-2xl">
            {value}
          </p>
          <p className="mt-2 truncate text-xs text-muted-foreground">
            {detail}
          </p>
        </div>
        <div
          className={cn(
            "hidden size-9 shrink-0 items-center justify-center rounded-md border sm:flex",
            toneClassName,
          )}
        >
          <Icon className="size-4" />
        </div>
      </CardContent>
    </Card>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {["a", "b", "c", "d"].map((key) => (
          <Skeleton key={key} className="h-20 rounded-md sm:h-28" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
        <Skeleton className="h-80 rounded-md" />
        <Skeleton className="h-80 rounded-md" />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Skeleton className="h-80 rounded-md" />
        <Skeleton className="h-80 rounded-md" />
      </div>
    </div>
  );
}

function ErrorPanel({ message }: { message: string }) {
  return (
    <Card className="rounded-md border-destructive/40">
      <CardContent className="px-5 py-8">
        <p className="text-sm font-medium text-foreground">
          Unable to load product analytics
        </p>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );
}

function PieBreakdownCard({
  title,
  description,
  data,
  total,
}: {
  title: string;
  description: string;
  data: InventoryAnalyticsBucket[];
  total: number;
}) {
  const chartData = topBuckets(data);
  const chartConfig = getBucketChartConfig(chartData);

  return (
    <Card className={ANALYTICS_CARD_CLASS}>
      <CardHeader className="gap-2 px-4 pt-4 pb-2 sm:px-5 sm:pt-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
          <Badge variant="secondary" className="rounded-md">
            {formatNumber(total)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 sm:px-5 sm:pb-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-center xl:grid-cols-1">
          <EvilPieChart
            data={chartData as ChartBucket[]}
            config={chartConfig}
            dataKey="count"
            nameKey="key"
            className="h-56 w-full p-2"
          >
            <EvilPieTooltip variant="frosted-glass" />
            <Pie
              innerRadius={52}
              outerRadius={84}
              cornerRadius={3}
              paddingAngle={2}
              isClickable
            />
          </EvilPieChart>
          <div className="space-y-2">
            {chartData.map((item, index) => (
              <div
                key={item.key}
                className="flex items-center justify-between gap-3 rounded-md border border-border/80 bg-muted/20 px-3 py-2"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="size-2.5 shrink-0 rounded-sm"
                    style={{
                      backgroundColor:
                        sourceChartColors[index % sourceChartColors.length],
                    }}
                  />
                  <span className="truncate text-sm text-foreground">
                    {item.label}
                  </span>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-medium tabular-nums text-foreground">
                    {getPercent(item.count, total)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatNumber(item.count)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function InventoryAnalyticsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const status = getStatusFilter(searchParams);
  const color = getColorFilter(searchParams);
  const purity = getPurityFilter(searchParams);
  const location = getLocationFilter(searchParams);
  const vendor = searchParams.get("vendorId") ?? "ALL";
  const [isDownloading, setIsDownloading] = useState(false);
  const locationsQuery = useLocations({ limit: 100 });
  const vendorsQuery = useVendors();
  const analyticsFilters = {
    ...(status === "ALL" ? {} : { status }),
    ...(color === "ALL" ? {} : { color }),
    ...(purity === "ALL" ? {} : { purity: Number(purity) }),
    ...(location === "ALL" ? {} : { locationId: location }),
    ...(vendor === "ALL" ? {} : { vendorId: vendor }),
  };
  const analyticsQuery = useInventoryAnalytics(analyticsFilters);
  const analytics = analyticsQuery.data;
  const locations = locationsQuery.data?.data ?? [];
  function updateAnalyticsFilter(
    key: "color" | "locationId" | "purity" | "vendorId",
    value: string,
  ) {
    const params = new URLSearchParams(searchParams);
    if (value === "ALL") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    const queryString = params.toString();
    router.replace(`${pathname}${queryString ? `?${queryString}` : ""}`, {
      scroll: false,
    });
  }

  async function downloadFilteredProducts() {
    setIsDownloading(true);
    try {
      const { blob, fileName } =
        await downloadInventoryAnalyticsCsv(analyticsFilters);
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
      toast.success("Filtered products downloaded");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to download filtered products",
      );
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 border-b border-border/70 pb-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1 text-xs text-muted-foreground">
          {analytics && (
            <p>
              {getPercent(
                analytics.summary.availableProducts,
                analytics.summary.totalProducts,
              )}{" "}
              available ·{" "}
              {getPercent(
                analytics.summary.stockProducts,
                analytics.summary.totalProducts,
              )}{" "}
              stock-owned
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 md:flex md:items-center">
          <AnalyticsFilterPopover
            count={
              [color, purity, location, vendor].filter(
                (value) => value !== "ALL",
              ).length
            }
            onReset={() => {
              const next = new URLSearchParams(searchParams);
              for (const key of ["color", "purity", "locationId", "vendorId"])
                next.delete(key);
              router.replace(`${pathname}?${next}`, { scroll: false });
            }}
          >
            <AnalyticsFilterControls
              color={color}
              location={location}
              locations={locations}
              locationsLoading={locationsQuery.isLoading}
              purity={purity}
              vendor={vendor}
              vendors={vendorsQuery.data}
              vendorsLoading={vendorsQuery.isLoading}
              onFilterChange={updateAnalyticsFilter}
            />
          </AnalyticsFilterPopover>
          <Button
            type="button"
            variant="outline"
            className="h-10 gap-2 md:h-9 md:shrink-0"
            disabled={
              isDownloading ||
              analyticsQuery.isLoading ||
              analyticsQuery.isError ||
              !analytics?.summary.totalProducts
            }
            onClick={() => void downloadFilteredProducts()}
          >
            {isDownloading ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            {isDownloading ? "Preparing CSV…" : "Download CSV"}
          </Button>
        </div>
      </div>

      {analyticsQuery.isLoading ? <AnalyticsSkeleton /> : null}

      {analyticsQuery.isError ? (
        <ErrorPanel
          message={
            analyticsQuery.error instanceof Error
              ? analyticsQuery.error.message
              : "Something went wrong"
          }
        />
      ) : null}

      {analytics ? (
        <>
          <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
            <MetricCard
              label="Total products"
              value={formatNumber(analytics.summary.totalProducts)}
              detail={`${formatNumber(
                analytics.summary.availableProducts,
              )} available`}
              icon={Boxes}
              toneClassName="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300"
            />
            <MetricCard
              label="Stock products"
              value={formatNumber(analytics.summary.stockProducts)}
              detail={`${formatNumber(
                analytics.summary.customerProducts,
              )} customer products`}
              icon={PackageCheck}
              toneClassName="border-amber-500/35 bg-amber-500/15 text-amber-600 dark:text-amber-300"
            />
            <MetricCard
              label="Total net weight"
              value={formatWeight(analytics.summary.totalNetWeight)}
              detail={`Average ${formatWeight(
                analytics.summary.averageNetWeight,
              )}`}
              icon={Scale}
              toneClassName="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
            />
            <MetricCard
              label="Total product value"
              value={formatCurrency(analytics.summary.totalEstimatedPrice)}
              detail={`Average ${formatCurrency(
                analytics.summary.averageEstimatedPrice,
              )} per product`}
              icon={IndianRupee}
              toneClassName="border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-300"
            />
          </div>

          <CategoryLocationExplorer
            buckets={analytics.breakdowns.byCategory}
            cells={analytics.breakdowns.byCategoryLocation}
          />

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
            <PieBreakdownCard
              title="Source Split"
              description="Stock products compared with customer products."
              data={analytics.breakdowns.bySource}
              total={analytics.summary.totalProducts}
            />
            <ProductMixCard
              cells={analytics.breakdowns.byColorPurity}
              colorBuckets={analytics.breakdowns.byColor}
              purityBuckets={analytics.breakdowns.byPurity}
              categoryBuckets={analytics.breakdowns.byCategory}
              totalProducts={analytics.summary.totalProducts}
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <ProductDistributionSankeyCard
              categories={analytics.breakdowns.byCategory}
              locations={analytics.breakdowns.byLocation}
              totalProducts={analytics.summary.totalProducts}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}

export function ProductAnalyticsPageClient() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tab = params.get("tab") === "sold" ? "sold" : getStatusFilter(params);
  return (
    <div className="min-w-0 space-y-3">
      <div>
        <Button asChild variant="ghost" className="-ml-2 h-10 gap-2 px-2">
          <Link href="/inventory">
            <ArrowLeft className="size-4" />
            Back to inventory
          </Link>
        </Button>
      </div>
      <Tabs
        value={tab}
        onValueChange={(value) => {
          const next = new URLSearchParams(params);
          if (value === "sold") next.set("tab", "sold");
          else {
            next.delete("tab");
            if (value === DEFAULT_STATUS_FILTER) next.delete("status");
            else next.set("status", value);
          }
          router.replace(`${pathname}?${next}`, { scroll: false });
        }}
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Product Analytics
            </h1>
            {tab !== "sold" && (
              <p className="hidden text-xs text-muted-foreground sm:block">
                Inventory mix, weight, and location concentration
              </p>
            )}
          </div>
          <TabsList
            aria-label="Product analytics views"
            className="flex h-auto w-full justify-start gap-0.5 rounded-lg p-1 sm:w-fit"
          >
            {[
              ["ALL", "All"],
              ["AVAILABLE", "Available"],
              ["NOT_AVAILABLE", "Unavailable"],
              ["sold", "Sold Products"],
            ].map(([value, label]) => (
              <TabsTrigger
                key={value}
                value={value}
                className={cn(
                  segmentTriggerClassName,
                  "h-10 min-w-0 flex-1 px-2 sm:h-8 sm:flex-none sm:px-3",
                )}
              >
                {value === "sold" ? (
                  <>
                    <span className="sm:hidden">Sold</span>
                    <span className="hidden sm:inline">{label}</span>
                  </>
                ) : (
                  label
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <TabsContent value="sold" className="min-w-0 pt-1">
          <SoldProductsReport />
        </TabsContent>
        {tab !== "sold" && (
          <TabsContent value={tab} className="min-w-0 pt-1">
            <InventoryAnalyticsContent />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
