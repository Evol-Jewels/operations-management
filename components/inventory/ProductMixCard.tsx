"use client";

import { useMemo } from "react";
import {
  Bar,
  EvilBarChart,
  Tooltip as EvilBarTooltip,
  Grid,
  XAxis,
  YAxis,
} from "@/components/evilcharts/charts/bar-chart";
import type { ChartConfig } from "@/components/evilcharts/ui/chart";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  InventoryAnalyticsBucket,
  InventoryAnalyticsColorPurityCell,
  ProductColor,
} from "@/types/inventory-api";
import { COLOR_LABELS } from "./AnalyticsFilterControls";
import {
  ANALYTICS_CARD_CLASS,
  ChartColorLegend,
  colorMixColors,
  formatNumber,
  getPercent,
  locationChartColors,
  purityChartColors,
  type StackedChartRow,
} from "./analytics-shared";

const PRODUCT_COLOR_ORDER: ProductColor[] = [
  "YELLOW",
  "ROSE",
  "WHITE",
  "OTHERS",
];

const PURITY_ORDER = ["9", "14", "18", "22", "24"] as const;

function getPurityStackKey(purity: string | number | null) {
  return `purity_${purity ?? "unknown"}`;
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

export function ProductMixCard({
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
    <Card className={ANALYTICS_CARD_CLASS}>
      <CardHeader className="gap-2 px-4 pt-4 pb-2 sm:px-5 sm:pt-5">
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
      <CardContent className="space-y-4 px-3 pb-4 sm:px-5 sm:pb-5">
        {hasData ? (
          <>
            <div className="min-w-0 rounded-md border border-border/60 bg-muted/10 p-1 sm:min-h-72 sm:p-2">
              <div className="mx-auto max-w-[44rem]">
                <EvilBarChart
                  data={rows}
                  config={chartConfig}
                  className="h-60 w-full p-1 sm:h-72 sm:p-2"
                  barRadius={5}
                  stackType="stacked"
                  chartProps={{
                    margin: { top: 12, left: 0, right: 8, bottom: 16 },
                  }}
                >
                  <Grid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="label" interval={0} tickMargin={10} />
                  <YAxis width={40} />
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
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
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
