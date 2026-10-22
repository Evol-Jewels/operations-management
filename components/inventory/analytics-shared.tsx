"use client";

import { cn } from "@/lib/utils";
import type { InventoryAnalyticsBucket } from "@/types/inventory-api";

export const ANALYTICS_CARD_CLASS =
  "min-w-0 rounded-md border-border/80 py-0 shadow-none";

export const inventoryAmber = "oklch(0.78 0.14 75 / 0.58)";
export const inventoryBlue = "oklch(0.7 0.14 258 / 0.56)";
export const inventoryRose = "oklch(0.74 0.12 18 / 0.54)";
const inventoryWhite = "oklch(0.94 0.01 95 / 0.48)";
const inventoryNeutral = "oklch(0.72 0 0 / 0.34)";

export const sourceChartColors = [inventoryAmber, inventoryBlue];

export const colorMixColors = {
  yellow: inventoryAmber,
  white: inventoryWhite,
  rose: inventoryRose,
  other: inventoryNeutral,
};

export const locationChartColors = [
  inventoryAmber,
  inventoryBlue,
  inventoryRose,
  "oklch(0.74 0.13 190 / 0.52)",
  "oklch(0.76 0.1 145 / 0.5)",
  "oklch(0.78 0.09 310 / 0.48)",
  "oklch(0.8 0.08 55 / 0.5)",
  inventoryNeutral,
];

export const purityChartColors = {
  "9": inventoryRose,
  "14": inventoryBlue,
  "18": inventoryAmber,
  "22": "oklch(0.78 0.09 310 / 0.48)",
  "24": "oklch(0.76 0.1 145 / 0.52)",
  unknown: inventoryNeutral,
};

export type StackedChartRow = {
  key: string;
  label: string;
  total: number;
} & Record<string, string | number>;

export function formatNumber(value: number) {
  return value.toLocaleString("en-IN");
}

export function formatWeight(value: number) {
  return `${value.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })} g`;
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function topBuckets(items: InventoryAnalyticsBucket[], limit = 8) {
  return items.slice(0, limit);
}

export function sumCounts(items: InventoryAnalyticsBucket[]) {
  return items.reduce((total, item) => total + item.count, 0);
}

export function getTopBucketLabel(items: InventoryAnalyticsBucket[]) {
  const [top] = items;
  if (!top) return "No data";
  return `${top.label} leads with ${formatNumber(top.count)}`;
}

export function getPercent(value: number, total: number) {
  if (!total) return "0%";
  return `${Math.round((value / total) * 100)}%`;
}

export function ChartColorLegend({
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
