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
import { JewelryVisual } from "@/components/jewelry/JewelryVisual";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type {
  InventoryAnalyticsBucket,
  InventoryAnalyticsMatrixCell,
} from "@/types/inventory-api";
import {
  ANALYTICS_CARD_CLASS,
  ChartColorLegend,
  formatNumber,
  getTopBucketLabel,
  locationChartColors,
  type StackedChartRow,
  sumCounts,
  topBuckets,
} from "./analytics-shared";

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

export function CategoryLocationExplorer({
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
    <Card className={ANALYTICS_CARD_CLASS}>
      <CardHeader className="gap-3 px-4 pt-4 pb-2 sm:px-5 sm:pt-5">
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
      <CardContent className="px-3 pb-3 sm:px-4 sm:pb-4">
        {hasData ? (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(18rem,0.9fr)_minmax(0,1.35fr)]">
            <div className="min-w-0 rounded-md border border-border/60 bg-muted/10 p-1 sm:min-h-72 sm:p-2">
              <div className="mx-auto max-w-[42rem]">
                <EvilBarChart
                  data={chartData}
                  config={chartConfig}
                  className="h-60 w-full p-1 sm:h-72 sm:p-2"
                  barRadius={5}
                  stackType="stacked"
                  chartProps={{
                    margin: { top: 12, left: 0, right: 8, bottom: 16 },
                  }}
                >
                  <Grid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="label"
                    interval={0}
                    tickMargin={10}
                    tickFormatter={getCategoryAbbreviation}
                  />
                  <YAxis width={40} />
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
            <ul className="divide-y divide-border/60 rounded-md border border-border/60 md:hidden">
              {chartData.map((row) => (
                <li key={row.key} className="px-3 py-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="inline-flex min-w-0 items-center gap-2 text-sm font-medium text-foreground">
                      <JewelryVisual
                        kind="category"
                        value={row.label}
                        className="size-5 shrink-0"
                      />
                      <span className="truncate">{row.label}</span>
                    </span>
                    <Badge variant="secondary" className="rounded-md font-mono">
                      {formatNumber(row.total)}
                    </Badge>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 pl-7">
                    {locations.map((location, index) => {
                      const count = lookup.get(`${row.key}:${location}`) ?? 0;
                      if (!count) return null;
                      return (
                        <span
                          key={location}
                          title={location}
                          className="inline-flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground"
                        >
                          <span
                            className="size-2 shrink-0 rounded-sm"
                            style={{
                              backgroundColor:
                                locationChartColors[
                                  index % locationChartColors.length
                                ],
                            }}
                          />
                          <span className="truncate">{location}</span>
                          <span className="font-mono text-foreground">
                            {formatNumber(count)}
                          </span>
                        </span>
                      );
                    })}
                  </div>
                </li>
              ))}
            </ul>
            <div className="hidden min-w-0 overflow-x-auto rounded-md border border-border/60 md:block">
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
                        <span className="inline-flex items-center gap-2.5">
                          <JewelryVisual
                            kind="category"
                            value={category}
                            className="size-5"
                          />
                          {category}
                        </span>
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
