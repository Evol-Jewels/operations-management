"use client";

import {
  ArrowLeft,
  Boxes,
  CircleDot,
  MapPin,
  PackageCheck,
  Scale,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import {
  ResponsiveContainer,
  Sankey,
  type SankeyLinkProps,
  type SankeyNodeProps,
} from "recharts";
import {
  Bar,
  EvilBarChart,
  Tooltip as EvilBarTooltip,
  Grid,
  XAxis,
  YAxis,
} from "@/components/evilcharts/charts/bar-chart";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInventoryAnalytics } from "@/hooks/useInventoryProducts";
import { cn } from "@/lib/utils";
import type {
  InventoryAnalyticsBucket,
  InventoryAnalyticsMatrixCell,
  ProductColor,
} from "@/types/inventory-api";

type StatusFilter = "ALL" | "AVAILABLE" | "NOT_AVAILABLE";
type ColorFilter = "ALL" | ProductColor;
type PurityFilter = "ALL" | "14" | "18" | "24";
const DEFAULT_STATUS_FILTER: StatusFilter = "AVAILABLE";

const COLOR_LABELS: Record<ProductColor, string> = {
  YELLOW: "Yellow",
  ROSE: "Rose",
  WHITE: "White",
  OTHERS: "Others",
};

const PURITY_LABELS: Record<Exclude<PurityFilter, "ALL">, string> = {
  "14": "14K",
  "18": "18K",
  "24": "24K",
};

const inventoryAmber = "oklch(0.68 0.15 72 / 0.92)";
const inventoryBarAmber = "rgb(245 158 11 / 0.4)";
const inventoryBlue = "oklch(0.58 0.18 258 / 0.72)";
const inventoryRose = "oklch(0.66 0.14 18 / 0.72)";
const inventoryWhite = "oklch(0.94 0.01 95 / 0.72)";
const inventoryNeutral = "oklch(0.68 0 0 / 0.42)";

const sourceChartColors = [inventoryAmber, inventoryBlue];

const colorMixColors = {
  yellow: inventoryAmber,
  white: inventoryWhite,
  rose: inventoryRose,
  other: inventoryNeutral,
};

const countChartConfig = {
  count: {
    label: "Products",
    colors: {
      light: [inventoryBarAmber],
      dark: [inventoryBarAmber],
    },
  },
} satisfies ChartConfig;

type ChartBucket = InventoryAnalyticsBucket & Record<string, unknown>;

type ProductSankeyNode = {
  name: string;
  label: string;
  value: number;
  kind: "category" | "total" | "location";
  color: string;
};

type ProductSankeyData = {
  nodes: ProductSankeyNode[];
  links: {
    source: number;
    target: number;
    value: number;
  }[];
};

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

function formatNumber(value: number) {
  return value.toLocaleString("en-IN");
}

function formatWeight(value: number) {
  return `${value.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })} g`;
}

function topBuckets(items: InventoryAnalyticsBucket[], limit = 8) {
  return items.slice(0, limit);
}

function sumCounts(items: InventoryAnalyticsBucket[]) {
  return items.reduce((total, item) => total + item.count, 0);
}

function getTopBucketLabel(items: InventoryAnalyticsBucket[]) {
  const [top] = items;
  if (!top) return "No data";
  return `${top.label} leads with ${formatNumber(top.count)}`;
}

function getPercent(value: number, total: number) {
  if (!total) return "0%";
  return `${Math.round((value / total) * 100)}%`;
}

function getColorMixColor(item: InventoryAnalyticsBucket) {
  const colorKey = `${item.key} ${item.label}`.toLowerCase();
  if (colorKey.includes("white")) return colorMixColors.white;
  if (colorKey.includes("rose")) return colorMixColors.rose;
  if (colorKey.includes("yellow")) return colorMixColors.yellow;
  return colorMixColors.other;
}

function getTopBucketsWithOther(
  items: InventoryAnalyticsBucket[],
  total: number,
  limit = 7,
  otherLabel = "Other",
) {
  const visible = items.slice(0, limit);
  const visibleTotal = sumCounts(visible);
  const otherCount = Math.max(total - visibleTotal, 0);

  if (otherCount === 0) return visible;

  return [
    ...visible,
    {
      key: "__other",
      label: otherLabel,
      count: otherCount,
      netWeight: 0,
      grossWeight: 0,
    },
  ];
}

function buildProductSankeyData({
  categories,
  locations,
  totalProducts,
}: {
  categories: InventoryAnalyticsBucket[];
  locations: InventoryAnalyticsBucket[];
  totalProducts: number;
}): ProductSankeyData {
  const categoryBuckets = getTopBucketsWithOther(
    categories,
    totalProducts,
    7,
    "Other categories",
  );
  const locationBuckets = getTopBucketsWithOther(
    locations,
    totalProducts,
    7,
    "Other locations",
  );
  const totalIndex = categoryBuckets.length;

  return {
    nodes: [
      ...categoryBuckets.map((item, index) => ({
        name: item.label,
        label: item.label,
        value: item.count,
        kind: "category" as const,
        color: sourceChartColors[index % sourceChartColors.length],
      })),
      {
        name: "Total Products",
        label: "Total Products",
        value: totalProducts,
        kind: "total",
        color: inventoryAmber,
      },
      ...locationBuckets.map((item, index) => ({
        name: item.label,
        label: item.label,
        value: item.count,
        kind: "location" as const,
        color:
          index % 3 === 0
            ? "oklch(0.64 0.16 190 / 0.76)"
            : index % 3 === 1
              ? inventoryRose
              : inventoryBlue,
      })),
    ],
    links: [
      ...categoryBuckets.map((item, index) => ({
        source: index,
        target: totalIndex,
        value: item.count,
      })),
      ...locationBuckets.map((item, index) => ({
        source: totalIndex,
        target: totalIndex + 1 + index,
        value: item.count,
      })),
    ],
  };
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
    <Card className="overflow-hidden rounded-md border-border/80 py-0 shadow-none">
      <CardContent className="flex min-h-28 items-start justify-between gap-4 p-4">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold leading-none tracking-tight text-foreground">
            {value}
          </p>
          <p className="mt-2 truncate text-xs text-muted-foreground">
            {detail}
          </p>
        </div>
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-md border",
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
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {["a", "b", "c", "d"].map((key) => (
          <Skeleton key={key} className="h-28 rounded-md" />
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
    <Card className="rounded-md border-border/80 py-0 shadow-none">
      <CardHeader className="gap-2 px-5 pt-5 pb-2">
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
      <CardContent className="px-5 pb-5">
        <div className="grid gap-4 lg:items-center">
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

function ProductSankeyNodeShape(props: SankeyNodeProps) {
  const node = props.payload as unknown as ProductSankeyNode;
  const isTotal = node.kind === "total";
  const isLeftSide = node.kind === "category";
  const labelX = isLeftSide ? props.x + props.width + 10 : props.x - 10;
  const labelAnchor = isLeftSide ? "start" : "end";
  const totalLabelX = props.x + props.width + 12;

  return (
    <g>
      <rect
        x={props.x}
        y={props.y}
        width={props.width}
        height={props.height}
        rx={isTotal ? 4 : 3}
        fill={node.color}
        stroke="var(--border)"
        strokeOpacity={0.35}
      />
      {isTotal ? (
        <text
          x={totalLabelX}
          y={props.y + props.height / 2 - 2}
          fill="var(--foreground)"
          fontSize={13}
          fontWeight={600}
          dominantBaseline="middle"
        >
          <tspan x={totalLabelX}>{node.label}</tspan>
          <tspan
            x={totalLabelX}
            dy={16}
            fill="var(--muted-foreground)"
            fontSize={12}
            fontWeight={400}
          >
            {formatNumber(node.value)}
          </tspan>
        </text>
      ) : (
        <text
          x={labelX}
          y={props.y + props.height / 2}
          textAnchor={labelAnchor}
          fill="var(--foreground)"
          fontSize={12}
          dominantBaseline="middle"
        >
          <tspan x={labelX} className="font-medium">
            {node.label.length > 18
              ? `${node.label.slice(0, 18)}...`
              : node.label}
          </tspan>
          <tspan
            x={labelX}
            dy={14}
            fill="var(--muted-foreground)"
            fontSize={11}
          >
            {formatNumber(node.value)}
          </tspan>
        </text>
      )}
    </g>
  );
}

function ProductSankeyLinkShape(props: SankeyLinkProps) {
  const sourceNode = props.payload.source as unknown as ProductSankeyNode;
  const targetNode = props.payload.target as unknown as ProductSankeyNode;
  const isIncomingTotal = targetNode.kind === "total";
  const strokeColor = isIncomingTotal ? sourceNode.color : targetNode.color;
  const path = `M${props.sourceX},${props.sourceY} C${props.sourceControlX},${props.sourceY} ${props.targetControlX},${props.targetY} ${props.targetX},${props.targetY}`;

  return (
    <path
      d={path}
      fill="none"
      stroke={strokeColor}
      strokeOpacity={0.24}
      strokeWidth={Math.max(props.linkWidth, 1)}
      className="transition-opacity duration-200 hover:opacity-90"
    />
  );
}

function ProductDistributionSankeyCard({
  categories,
  locations,
  totalProducts,
}: {
  categories: InventoryAnalyticsBucket[];
  locations: InventoryAnalyticsBucket[];
  totalProducts: number;
}) {
  const sankeyData = useMemo(
    () => buildProductSankeyData({ categories, locations, totalProducts }),
    [categories, locations, totalProducts],
  );
  const topCategory = categories[0];
  const topLocation = locations[0];

  return (
    <Card className="rounded-md border-border/80 py-0 shadow-none">
      <CardHeader className="gap-2 px-5 pt-5 pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <CardTitle className="text-base">Product Distribution</CardTitle>
            <CardDescription className="mt-1">
              Total products split by category and inventory location.
            </CardDescription>
          </div>
          <Badge variant="secondary" className="rounded-md">
            {formatNumber(totalProducts)}
          </Badge>
        </div>
        {topCategory || topLocation ? (
          <p className="text-xs text-muted-foreground">
            {topCategory ? `${topCategory.label} leads categories` : null}
            {topCategory && topLocation ? " - " : null}
            {topLocation ? `${topLocation.label} leads locations` : null}
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {totalProducts > 0 && sankeyData.links.length > 0 ? (
          <div className="overflow-x-auto">
            <div className="h-[360px] min-w-[820px] rounded-md border border-border/60 bg-muted/10 p-2">
              <ResponsiveContainer width="100%" height="100%">
                <Sankey
                  data={sankeyData}
                  node={ProductSankeyNodeShape}
                  link={ProductSankeyLinkShape}
                  nodePadding={18}
                  nodeWidth={14}
                  linkCurvature={0.48}
                  iterations={48}
                  margin={{ top: 20, right: 130, bottom: 20, left: 130 }}
                  sort={false}
                  verticalAlign="justify"
                />
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="flex h-64 items-center justify-center rounded-md border border-dashed border-border">
            <p className="text-sm text-muted-foreground">
              No product distribution data available
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CategoryLocationExplorer({
  buckets,
  cells,
  color,
  purity,
  onFilterChange,
}: {
  buckets: InventoryAnalyticsBucket[];
  cells: InventoryAnalyticsMatrixCell[];
  color: ColorFilter;
  purity: PurityFilter;
  onFilterChange: (
    key: "color" | "purity",
    value: ColorFilter | PurityFilter,
  ) => void;
}) {
  const chartData = topBuckets(buckets);
  const total = sumCounts(buckets);
  const { categories, locations, lookup } = useMemo(() => {
    const categoryList = Array.from(
      new Set(cells.map((cell) => cell.category)),
    );
    const locationList = Array.from(
      new Set(cells.map((cell) => cell.locationLabel)),
    ).slice(0, 8);
    const cellLookup = new Map<string, number>();

    for (const cell of cells) {
      cellLookup.set(`${cell.category}:${cell.locationLabel}`, cell.count);
    }

    return {
      categories: categoryList.slice(0, 8),
      locations: locationList,
      lookup: cellLookup,
    };
  }, [cells]);
  const hasData =
    chartData.length > 0 && categories.length > 0 && locations.length > 0;

  return (
    <Card className="rounded-md border-border/80 py-0 shadow-none">
      <CardHeader className="gap-3 px-5 pt-5 pb-2">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">
                Category by Location
              </CardTitle>
              <Badge variant="secondary" className="rounded-md">
                {formatNumber(total)}
              </Badge>
            </div>
            <CardDescription className="mt-1">
              Category counts and location spread for the selected purity and
              color.
            </CardDescription>
            {hasData ? (
              <p className="mt-2 text-xs text-muted-foreground">
                {getTopBucketLabel(chartData)}
              </p>
            ) : null}
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:min-w-[24rem]">
            <Select
              value={purity}
              onValueChange={(value) =>
                onFilterChange("purity", value as PurityFilter)
              }
            >
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Purity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All purities</SelectItem>
                {(
                  Object.keys(PURITY_LABELS) as Array<
                    Exclude<PurityFilter, "ALL">
                  >
                ).map((purityValue) => (
                  <SelectItem key={purityValue} value={purityValue}>
                    {PURITY_LABELS[purityValue]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={color}
              onValueChange={(value) =>
                onFilterChange("color", value as ColorFilter)
              }
            >
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Color" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All colors</SelectItem>
                {(Object.keys(COLOR_LABELS) as ProductColor[]).map(
                  (colorValue) => (
                    <SelectItem key={colorValue} value={colorValue}>
                      {COLOR_LABELS[colorValue]}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {hasData ? (
          <div className="grid gap-4 xl:grid-cols-[minmax(18rem,0.9fr)_minmax(0,1.35fr)]">
            <div className="min-h-72 rounded-md border border-border/60 bg-muted/10 p-2">
              <EvilBarChart
                data={chartData as ChartBucket[]}
                config={countChartConfig}
                className="h-72 w-full p-2"
                barRadius={5}
                chartProps={{
                  margin: { top: 12, left: -18, right: 8, bottom: 0 },
                }}
              >
                <Grid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  interval={0}
                  tickFormatter={(value) =>
                    String(value).length > 12
                      ? `${String(value).slice(0, 12)}...`
                      : String(value)
                  }
                />
                <YAxis width={42} />
                <EvilBarTooltip variant="frosted-glass" />
                <Bar
                  dataKey="count"
                  variant="default"
                  enableHoverHighlight
                  barProps={{
                    name: "Products",
                  }}
                />
              </EvilBarChart>
            </div>
            <div className="overflow-x-auto rounded-md border border-border/60">
              <table className="w-full min-w-[640px] border-separate border-spacing-0 text-sm">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-10 border-b border-border bg-card px-3 py-2 text-left font-medium text-muted-foreground">
                      Category
                    </th>
                    {locations.map((location) => (
                      <th
                        key={location}
                        className="border-b border-border px-3 py-2 text-right text-xs font-medium text-muted-foreground"
                      >
                        {location}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr key={category}>
                      <td className="sticky left-0 z-10 border-b border-border bg-card px-3 py-2.5 font-medium text-foreground">
                        {category}
                      </td>
                      {locations.map((location) => {
                        const count =
                          lookup.get(`${category}:${location}`) ?? 0;
                        return (
                          <td
                            key={location}
                            className="border-b border-border px-3 py-2.5 text-right"
                          >
                            <span
                              className={cn(
                                "inline-flex min-w-10 justify-center rounded-md px-2 py-1 font-mono text-xs",
                                count > 0
                                  ? "bg-primary/10 text-foreground dark:bg-primary/15"
                                  : "text-muted-foreground",
                              )}
                            >
                              {count > 0 ? formatNumber(count) : "-"}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="flex h-64 items-center justify-center rounded-md border border-dashed border-border">
            <p className="text-sm text-muted-foreground">
              No category/location data for this filter.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ProductAnalyticsPageClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const status = getStatusFilter(searchParams);
  const color = getColorFilter(searchParams);
  const purity = getPurityFilter(searchParams);
  const analyticsQuery = useInventoryAnalytics({
    ...(status === "ALL" ? {} : { status }),
    ...(color === "ALL" ? {} : { color }),
    ...(purity === "ALL" ? {} : { purity: Number(purity) }),
  });
  const analytics = analyticsQuery.data;
  const stockPercent = analytics
    ? getPercent(
        analytics.summary.stockProducts,
        analytics.summary.totalProducts,
      )
    : "0%";
  const availablePercent = analytics
    ? getPercent(
        analytics.summary.availableProducts,
        analytics.summary.totalProducts,
      )
    : "0%";

  function updateStatus(value: StatusFilter) {
    const params = new URLSearchParams(searchParams);
    if (value === DEFAULT_STATUS_FILTER) {
      params.delete("status");
    } else {
      params.set("status", value);
    }
    const queryString = params.toString();
    router.replace(`${pathname}${queryString ? `?${queryString}` : ""}`, {
      scroll: false,
    });
  }

  function updateAnalyticsFilter(
    key: "color" | "purity",
    value: ColorFilter | PurityFilter,
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

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 border-b border-border/70 pb-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <Button asChild variant="ghost" className="mb-2 h-9 gap-2 px-2">
            <Link href="/inventory">
              <ArrowLeft className="size-4" />
              Back to inventory
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Product Analytics
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>Inventory mix, weight, and location concentration</span>
            {analytics ? (
              <>
                <span className="hidden h-1 w-1 rounded-full bg-muted-foreground/60 sm:block" />
                <span>{availablePercent} available</span>
                <span className="hidden h-1 w-1 rounded-full bg-muted-foreground/60 sm:block" />
                <span>{stockPercent} stock-owned</span>
              </>
            ) : null}
          </div>
        </div>
        <Tabs
          value={status}
          onValueChange={(value) => updateStatus(value as StatusFilter)}
          className="w-full md:w-auto"
        >
          <TabsList className="grid h-11 w-full grid-cols-3 rounded-lg border-border/80 bg-zinc-950/95 p-1 text-zinc-300 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.05)] md:w-auto dark:border-zinc-800 dark:bg-zinc-950">
            <TabsTrigger
              value="ALL"
              className="h-9 rounded-md border-transparent px-4 text-zinc-300 hover:text-white data-[state=active]:border-zinc-200/10 data-[state=active]:bg-white data-[state=active]:text-zinc-950 dark:data-[state=active]:bg-white dark:data-[state=active]:text-zinc-950"
            >
              All
            </TabsTrigger>
            <TabsTrigger
              value="AVAILABLE"
              className="h-9 rounded-md border-transparent px-4 text-zinc-300 hover:text-white data-[state=active]:border-zinc-200/10 data-[state=active]:bg-white data-[state=active]:text-zinc-950 dark:data-[state=active]:bg-white dark:data-[state=active]:text-zinc-950"
            >
              Available
            </TabsTrigger>
            <TabsTrigger
              value="NOT_AVAILABLE"
              className="h-9 rounded-md border-transparent px-4 text-zinc-300 hover:text-white data-[state=active]:border-zinc-200/10 data-[state=active]:bg-white data-[state=active]:text-zinc-950 dark:data-[state=active]:bg-white dark:data-[state=active]:text-zinc-950"
            >
              Unavailable
            </TabsTrigger>
          </TabsList>
        </Tabs>
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
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
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
              label="Locations"
              value={formatNumber(analytics.breakdowns.byLocation.length)}
              detail="Assigned and unassigned sectors"
              icon={MapPin}
              toneClassName="border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-300"
            />
          </div>

          <CategoryLocationExplorer
            buckets={analytics.breakdowns.byCategory}
            cells={analytics.breakdowns.byCategoryLocation}
            color={color}
            purity={purity}
            onFilterChange={updateAnalyticsFilter}
          />

          <div className="grid gap-4 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
            <PieBreakdownCard
              title="Source Split"
              description="Stock products compared with customer products."
              data={analytics.breakdowns.bySource}
              total={analytics.summary.totalProducts}
            />
            <Card className="rounded-md border-border/80 py-0 shadow-none">
              <CardHeader className="gap-1 px-5 pt-5 pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-base">Color Mix</CardTitle>
                    <CardDescription className="mt-1">
                      Color distribution and net weight contribution.
                    </CardDescription>
                  </div>
                  <TrendingUp className="size-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2 px-5 pb-5">
                {analytics.breakdowns.byColor.map((item) => (
                  <div
                    key={item.key}
                    className="rounded-md border border-border/80 bg-muted/20 px-3 py-2.5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <CircleDot
                          className="size-4 shrink-0"
                          style={{
                            color: getColorMixColor(item),
                          }}
                        />
                        <span className="truncate text-sm font-medium text-foreground">
                          {item.label}
                        </span>
                      </div>
                      <Badge variant="secondary" className="rounded-md">
                        {formatNumber(item.count)}
                      </Badge>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: getPercent(
                            item.count,
                            analytics.summary.totalProducts,
                          ),
                          backgroundColor: getColorMixColor(item),
                        }}
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {getPercent(item.count, analytics.summary.totalProducts)}{" "}
                      of products - {formatWeight(item.netWeight)}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4">
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
