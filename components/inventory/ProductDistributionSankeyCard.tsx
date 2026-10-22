"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  Sankey,
  type SankeyLinkProps,
  type SankeyNodeProps,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { InventoryAnalyticsBucket } from "@/types/inventory-api";
import {
  ANALYTICS_CARD_CLASS,
  formatNumber,
  inventoryAmber,
  inventoryBlue,
  inventoryRose,
  locationChartColors,
  sourceChartColors,
  sumCounts,
} from "./analytics-shared";

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

export function ProductDistributionSankeyCard({
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
    <Card className={ANALYTICS_CARD_CLASS}>
      <CardHeader className="gap-2 px-4 pt-4 pb-2 sm:px-5 sm:pt-5">
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
        <p className="text-[11px] text-muted-foreground md:hidden">
          Swipe the chart sideways to see locations.
        </p>
      </CardHeader>
      <CardContent className="px-3 pb-3 sm:px-4 sm:pb-4">
        {totalProducts > 0 && sankeyData.links.length > 0 ? (
          <div className="overflow-x-auto overscroll-x-contain">
            <div className="h-[340px] min-w-[640px] rounded-md border border-border/60 bg-muted/10 p-2 md:h-[360px] md:min-w-[820px]">
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
