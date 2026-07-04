"use client";

import { ArrowLeft, Boxes, MapPin, PackageCheck, Scale } from "lucide-react";
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
import { useLocations } from "@/hooks/useManageProducts";
import { cn } from "@/lib/utils";
import type {
  InventoryAnalyticsBucket,
  InventoryAnalyticsColorPurityCell,
  InventoryAnalyticsMatrixCell,
  ProductColor,
} from "@/types/inventory-api";

type StatusFilter = "ALL" | "AVAILABLE" | "NOT_AVAILABLE";
type ColorFilter = "ALL" | ProductColor;
type PurityFilter = "ALL" | "14" | "18" | "24";
type LocationFilter = "ALL" | string;
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

const inventoryAmber = "oklch(0.78 0.14 75 / 0.58)";
const inventoryBlue = "oklch(0.7 0.14 258 / 0.56)";
const inventoryRose = "oklch(0.74 0.12 18 / 0.54)";
const inventoryWhite = "oklch(0.94 0.01 95 / 0.48)";
const inventoryNeutral = "oklch(0.72 0 0 / 0.34)";

const sourceChartColors = [inventoryAmber, inventoryBlue];

const colorMixColors = {
  yellow: inventoryAmber,
  white: inventoryWhite,
  rose: inventoryRose,
  other: inventoryNeutral,
};

const locationChartColors = [
  inventoryAmber,
  inventoryBlue,
  inventoryRose,
  "oklch(0.74 0.13 190 / 0.52)",
  "oklch(0.76 0.1 145 / 0.5)",
  "oklch(0.78 0.09 310 / 0.48)",
  "oklch(0.8 0.08 55 / 0.5)",
  inventoryNeutral,
];

const purityChartColors = {
  "14": inventoryBlue,
  "18": inventoryAmber,
  "24": "oklch(0.76 0.1 145 / 0.52)",
  unknown: inventoryNeutral,
};

const CATEGORY_ABBREVIATIONS: Record<string, string> = {
  accessory: "ACC",
  bangle: "BNG",
  bracelet: "BRC",
  chain: "CHN",
  earring: "ERN",
  necklace: "NCK",
  pendant: "PND",
  ring: "RNG",
};
const segmentTriggerClassName =
  "h-9 rounded-lg text-foreground hover:text-foreground data-[state=active]:bg-zinc-950 data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-zinc-950";

const PRODUCT_COLOR_ORDER: ProductColor[] = [
  "YELLOW",
  "ROSE",
  "WHITE",
  "OTHERS",
];

const PURITY_ORDER = ["14", "18", "24"] as const;

type ChartBucket = InventoryAnalyticsBucket & Record<string, unknown>;
type StackedChartRow = {
  key: string;
  label: string;
  total: number;
} & Record<string, string | number>;

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

function getCategoryAbbreviation(value: unknown) {
  const label = String(value).trim();
  const knownAbbreviation = CATEGORY_ABBREVIATIONS[label.toLowerCase()];

  if (knownAbbreviation) return knownAbbreviation;

  const initials = label
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const compactLabel = label.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

  return (initials || compactLabel).slice(0, 3);
}

function slugChartKey(value: string) {
  return value.replace(/[^a-zA-Z0-9]/g, "_");
}

function getLocationStackKey(location: string) {
  return `location_${slugChartKey(location)}`;
}

function getPurityStackKey(purity: string | number | null) {
  return `purity_${purity ?? "unknown"}`;
}

function getLocationChartConfig(locations: string[]) {
  return locations.reduce<ChartConfig>((config, location, index) => {
    config[getLocationStackKey(location)] = {
      label: location,
      colors: {
        light: [locationChartColors[index % locationChartColors.length]],
        dark: [locationChartColors[index % locationChartColors.length]],
      },
    };
    return config;
  }, {});
}

function getProductMixChartConfig(purityKeys: string[]) {
  return purityKeys.reduce<ChartConfig>((config, purityKey) => {
    const key = getPurityStackKey(purityKey === "unknown" ? null : purityKey);
    const label = purityKey === "unknown" ? "Unknown" : `${purityKey}K`;
    config[key] = {
      label,
      colors: {
        light: [
          purityChartColors[purityKey as keyof typeof purityChartColors] ??
            purityChartColors.unknown,
        ],
        dark: [
          purityChartColors[purityKey as keyof typeof purityChartColors] ??
            purityChartColors.unknown,
        ],
      },
    };
    return config;
  }, {});
}

function ChartColorLegend({
  items,
  className,
}: {
  items: { label: string; color: string }[];
  className?: string;
}) {
  return (
    <div className={cn("mt-3 flex flex-wrap gap-x-4 gap-y-2 px-1", className)}>
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <span
            className="size-2.5 shrink-0 rounded-sm"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-xs text-muted-foreground">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function buildCategoryLocationChartData(
  categories: string[],
  locations: string[],
  lookup: Map<string, number>,
) {
  return categories.map((category) => {
    const row: StackedChartRow = {
      key: category,
      label: category,
      total: 0,
    };

    for (const location of locations) {
      const count = lookup.get(`${category}:${location}`) ?? 0;
      row[getLocationStackKey(location)] = count;
      row.total += count;
    }

    return row;
  });
}

function buildProductMixChartData(cells: InventoryAnalyticsColorPurityCell[]) {
  const purityKeys = Array.from(
    new Set(
      cells.map((cell) =>
        cell.purity === null ? "unknown" : String(cell.purity),
      ),
    ),
  ).sort((a, b) => {
    const aIndex = PURITY_ORDER.indexOf(a as (typeof PURITY_ORDER)[number]);
    const bIndex = PURITY_ORDER.indexOf(b as (typeof PURITY_ORDER)[number]);

    if (aIndex !== -1 || bIndex !== -1) {
      return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex);
    }

    return a.localeCompare(b);
  });
  const availableColors = new Set(cells.map((cell) => cell.color));
  const colorOrder = PRODUCT_COLOR_ORDER.filter((colorValue) =>
    availableColors.has(colorValue),
  );
  const rows = colorOrder.map((colorValue) => {
    const row: StackedChartRow = {
      key: colorValue,
      label: COLOR_LABELS[colorValue],
      total: 0,
    };

    for (const purityKey of purityKeys) {
      row[getPurityStackKey(purityKey === "unknown" ? null : purityKey)] = 0;
    }

    for (const cell of cells) {
      if (cell.color !== colorValue) continue;
      const purityKey = cell.purity === null ? "unknown" : String(cell.purity);
      row[getPurityStackKey(cell.purity)] =
        Number(row[getPurityStackKey(cell.purity)] ?? 0) + cell.count;
      row.total += cell.count;
      row[`${getPurityStackKey(cell.purity)}NetWeight`] =
        Number(row[`${getPurityStackKey(cell.purity)}NetWeight`] ?? 0) +
        cell.netWeight;
      row[`${getPurityStackKey(cell.purity)}GrossWeight`] =
        Number(row[`${getPurityStackKey(cell.purity)}GrossWeight`] ?? 0) +
        cell.grossWeight;
      row[`${getPurityStackKey(cell.purity)}Label`] =
        purityKey === "unknown" ? "Unknown" : `${purityKey}K`;
    }

    return row;
  });

  return { rows, purityKeys };
}

type ProductMixSummaryCard = {
  key: string;
  label: string;
  count: number;
  color: string;
};

function findBucketCount(
  items: InventoryAnalyticsBucket[],
  matcher: (item: InventoryAnalyticsBucket) => boolean,
) {
  return items.find(matcher)?.count ?? 0;
}

function buildProductMixSummaryCards({
  colorBuckets,
  purityBuckets,
  categoryBuckets,
}: {
  colorBuckets: InventoryAnalyticsBucket[];
  purityBuckets: InventoryAnalyticsBucket[];
  categoryBuckets: InventoryAnalyticsBucket[];
}): ProductMixSummaryCard[] {
  return [
    {
      key: "YELLOW",
      label: "Yellow",
      count: findBucketCount(colorBuckets, (item) => item.key === "YELLOW"),
      color: colorMixColors.yellow,
    },
    {
      key: "ROSE",
      label: "Rose",
      count: findBucketCount(colorBuckets, (item) => item.key === "ROSE"),
      color: colorMixColors.rose,
    },
    {
      key: "WHITE",
      label: "White",
      count: findBucketCount(colorBuckets, (item) => item.key === "WHITE"),
      color: colorMixColors.white,
    },
    {
      key: "14K",
      label: "14K",
      count: findBucketCount(purityBuckets, (item) => item.key === "14"),
      color: purityChartColors["14"],
    },
    {
      key: "18K",
      label: "18K",
      count: findBucketCount(purityBuckets, (item) => item.key === "18"),
      color: purityChartColors["18"],
    },
    {
      key: "ACCESSORIES",
      label: "Accessories",
      count: findBucketCount(
        categoryBuckets,
        (item) =>
          item.key.toLowerCase() === "accessory" ||
          item.label.toLowerCase() === "accessory" ||
          item.label.toLowerCase() === "accessories",
      ),
      color: locationChartColors[3],
    },
  ];
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
            ? locationChartColors[3]
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

function AnalyticsFilterControls({
  color,
  location,
  locations,
  locationsLoading,
  purity,
  onFilterChange,
}: {
  color: ColorFilter;
  location: LocationFilter;
  locations: { id: string; name: string; city: string }[];
  locationsLoading: boolean;
  purity: PurityFilter;
  onFilterChange: (
    key: "color" | "locationId" | "purity",
    value: ColorFilter | LocationFilter | PurityFilter,
  ) => void;
}) {
  return (
    <div className="grid w-full gap-2 sm:grid-cols-2 md:w-auto md:min-w-[36rem] lg:grid-cols-3">
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
            Object.keys(PURITY_LABELS) as Array<Exclude<PurityFilter, "ALL">>
          ).map((purityValue) => (
            <SelectItem key={purityValue} value={purityValue}>
              {PURITY_LABELS[purityValue]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={location}
        onValueChange={(value) =>
          onFilterChange("locationId", value as LocationFilter)
        }
        disabled={locationsLoading}
      >
        <SelectTrigger className="h-10 w-full">
          <SelectValue placeholder="Location" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All locations</SelectItem>
          {locations.map((locationValue) => (
            <SelectItem key={locationValue.id} value={locationValue.id}>
              {locationValue.name}, {locationValue.city}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={color}
        onValueChange={(value) => onFilterChange("color", value as ColorFilter)}
      >
        <SelectTrigger className="h-10 w-full">
          <SelectValue placeholder="Color" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All colors</SelectItem>
          {(Object.keys(COLOR_LABELS) as ProductColor[]).map((colorValue) => (
            <SelectItem key={colorValue} value={colorValue}>
              {COLOR_LABELS[colorValue]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function CategoryLocationExplorer({
  buckets,
  cells,
}: {
  buckets: InventoryAnalyticsBucket[];
  cells: InventoryAnalyticsMatrixCell[];
}) {
  const total = sumCounts(buckets);
  const { categories, locations, lookup, chartData, chartConfig } =
    useMemo(() => {
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
        chartData: buildCategoryLocationChartData(
          categoryList.slice(0, 8),
          locationList,
          cellLookup,
        ),
        chartConfig: getLocationChartConfig(locationList),
      };
    }, [cells]);
  const legendItems = locations.map((location, index) => ({
    label: location,
    color: locationChartColors[index % locationChartColors.length],
  }));
  const hasData =
    chartData.length > 0 && categories.length > 0 && locations.length > 0;

  return (
    <Card className="rounded-md border-border/80 py-0 shadow-none">
      <CardHeader className="gap-3 px-5 pt-5 pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Category by Location</CardTitle>
              <Badge variant="secondary" className="rounded-md">
                {formatNumber(total)}
              </Badge>
            </div>
            <CardDescription className="mt-1">
              Category counts stacked by store location for the active filters.
            </CardDescription>
            {hasData ? (
              <p className="mt-2 text-xs text-muted-foreground">
                {getTopBucketLabel(topBuckets(buckets))}
              </p>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {hasData ? (
          <div className="grid gap-4 xl:grid-cols-[minmax(18rem,0.9fr)_minmax(0,1.35fr)]">
            <div className="min-h-72 rounded-md border border-border/60 bg-muted/10 p-2">
              <div className="mx-auto max-w-[42rem]">
                <EvilBarChart
                  data={chartData}
                  config={chartConfig}
                  className="h-72 w-full p-2"
                  barRadius={5}
                  stackType="stacked"
                  chartProps={{
                    margin: { top: 12, left: 12, right: 12, bottom: 22 },
                  }}
                >
                  <Grid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="label"
                    interval={0}
                    tickMargin={10}
                    tickFormatter={getCategoryAbbreviation}
                  />
                  <YAxis width={58} />
                  <EvilBarTooltip variant="frosted-glass" />
                  {locations.map((location) => (
                    <Bar
                      key={location}
                      dataKey={getLocationStackKey(location)}
                      variant="default"
                      enableHoverHighlight
                      barProps={{
                        name: location,
                      }}
                    />
                  ))}
                </EvilBarChart>
              </div>
              <ChartColorLegend
                items={legendItems}
                className="justify-center"
              />
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

function ProductMixCard({
  cells,
  colorBuckets,
  purityBuckets,
  categoryBuckets,
  totalProducts,
}: {
  cells: InventoryAnalyticsColorPurityCell[];
  colorBuckets: InventoryAnalyticsBucket[];
  purityBuckets: InventoryAnalyticsBucket[];
  categoryBuckets: InventoryAnalyticsBucket[];
  totalProducts: number;
}) {
  const { rows, purityKeys } = useMemo(
    () => buildProductMixChartData(cells),
    [cells],
  );
  const chartConfig = useMemo(
    () => getProductMixChartConfig(purityKeys),
    [purityKeys],
  );
  const legendItems = purityKeys.map((purityKey) => ({
    label: purityKey === "unknown" ? "Unknown" : `${purityKey}K`,
    color:
      purityChartColors[purityKey as keyof typeof purityChartColors] ??
      purityChartColors.unknown,
  }));
  const summaryCards = useMemo(
    () =>
      buildProductMixSummaryCards({
        colorBuckets,
        purityBuckets,
        categoryBuckets,
      }),
    [colorBuckets, purityBuckets, categoryBuckets],
  );
  const hasData = rows.length > 0 && purityKeys.length > 0;

  return (
    <Card className="rounded-md border-border/80 py-0 shadow-none">
      <CardHeader className="gap-2 px-5 pt-5 pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <CardTitle className="text-base">Product Mix</CardTitle>
            <CardDescription className="mt-1">
              Colors stacked by purity for the active filters.
            </CardDescription>
          </div>
          <Badge variant="secondary" className="rounded-md">
            {formatNumber(totalProducts)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 px-5 pb-5">
        {hasData ? (
          <>
            <div className="min-h-72 rounded-md border border-border/60 bg-muted/10 p-2">
              <div className="mx-auto max-w-[44rem]">
                <EvilBarChart
                  data={rows}
                  config={chartConfig}
                  className="h-72 w-full p-2"
                  barRadius={5}
                  stackType="stacked"
                  chartProps={{
                    margin: { top: 12, left: 12, right: 12, bottom: 22 },
                  }}
                >
                  <Grid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="label" interval={0} tickMargin={10} />
                  <YAxis width={58} />
                  <EvilBarTooltip variant="frosted-glass" />
                  {purityKeys.map((purityKey) => {
                    const dataKey = getPurityStackKey(
                      purityKey === "unknown" ? null : purityKey,
                    );
                    return (
                      <Bar
                        key={dataKey}
                        dataKey={dataKey}
                        variant="default"
                        enableHoverHighlight
                        barProps={{
                          name:
                            purityKey === "unknown"
                              ? "Unknown"
                              : `${purityKey}K`,
                        }}
                      />
                    );
                  })}
                </EvilBarChart>
              </div>
              <ChartColorLegend
                items={legendItems}
                className="justify-center"
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {summaryCards.map((card) => (
                <div
                  key={card.key}
                  className="rounded-md border border-border/80 bg-muted/20 px-3 py-2.5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="size-2.5 shrink-0 rounded-sm"
                        style={{ backgroundColor: card.color }}
                      />
                      <span className="truncate text-sm font-medium text-foreground">
                        {card.label}
                      </span>
                    </div>
                    <Badge variant="secondary" className="rounded-md">
                      {formatNumber(card.count)}
                    </Badge>
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {getPercent(card.count, totalProducts)} of products
                  </p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex h-64 items-center justify-center rounded-md border border-dashed border-border">
            <p className="text-sm text-muted-foreground">
              No color/purity product mix data for this filter.
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
  const location = getLocationFilter(searchParams);
  const locationsQuery = useLocations({ limit: 100 });
  const analyticsQuery = useInventoryAnalytics({
    ...(status === "ALL" ? {} : { status }),
    ...(color === "ALL" ? {} : { color }),
    ...(purity === "ALL" ? {} : { purity: Number(purity) }),
    ...(location === "ALL" ? {} : { locationId: location }),
  });
  const analytics = analyticsQuery.data;
  const locations = locationsQuery.data?.data ?? [];
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
    key: "color" | "locationId" | "purity",
    value: ColorFilter | LocationFilter | PurityFilter,
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
        <div className="flex w-full flex-col items-stretch gap-2 md:w-auto md:items-end">
          <Tabs
            value={status}
            onValueChange={(value) => updateStatus(value as StatusFilter)}
            className="w-full md:w-auto"
          >
            <TabsList className="grid h-11 w-full grid-cols-3 rounded-xl p-1 md:w-auto">
              <TabsTrigger
                value="ALL"
                className={cn(segmentTriggerClassName, "px-4")}
              >
                All
              </TabsTrigger>
              <TabsTrigger
                value="AVAILABLE"
                className={cn(segmentTriggerClassName, "px-4")}
              >
                Available
              </TabsTrigger>
              <TabsTrigger
                value="NOT_AVAILABLE"
                className={cn(segmentTriggerClassName, "px-4")}
              >
                Unavailable
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <AnalyticsFilterControls
            color={color}
            location={location}
            locations={locations}
            locationsLoading={locationsQuery.isLoading}
            purity={purity}
            onFilterChange={updateAnalyticsFilter}
          />
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
          />

          <div className="grid gap-4 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
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
