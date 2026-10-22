"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import type { SoldProduct, SoldProductsSort } from "@/types/sold-products-api";
import {
  formatSoldDate,
  formatSoldLabel,
  formatSoldWeight,
  SOLD_COLUMNS,
} from "./SoldProductsTable";

const sortOptions = SOLD_COLUMNS.flatMap((column) =>
  column.sort ? [{ value: column.sort, label: column.label }] : [],
);

export function SoldProductsCards({
  rows,
  sortBy,
  sortOrder,
  onSort,
}: {
  rows: SoldProduct[];
  sortBy: SoldProductsSort;
  sortOrder: "asc" | "desc";
  onSort: (sort: SoldProductsSort) => void;
}) {
  return (
    <div className="space-y-2 md:hidden">
      <div className="flex items-center gap-2">
        <Select
          value={sortBy}
          onValueChange={(value) => {
            const sort = sortOptions.find((option) => option.value === value);
            if (sort) onSort(sort.value);
          }}
        >
          <SelectTrigger
            className="h-10 flex-1 justify-start gap-1.5 [&>svg:last-child]:ml-auto"
            aria-label="Sort by"
          >
            <span className="text-muted-foreground">Sort:</span>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label.replace(/[¹²]/g, "")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-10"
          aria-label={
            sortOrder === "asc" ? "Sorted ascending" : "Sorted descending"
          }
          onClick={() => onSort(sortBy)}
        >
          {sortOrder === "asc" ? (
            <ArrowUp className="size-4" />
          ) : (
            <ArrowDown className="size-4" />
          )}
        </Button>
      </div>

      <ul aria-label="Sold products report" className="space-y-2">
        {rows.map((row) => (
          <li key={row.id} className="rounded-lg border bg-card px-3 py-2.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="line-clamp-2 text-sm font-medium text-foreground">
                  {row.name ?? row.productCode}
                </p>
                <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                  {row.productCode}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold tabular-nums text-foreground">
                  {row.saleValue === null
                    ? "—"
                    : formatCurrency(Number(row.saleValue))}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatSoldDate(row.saleMonth, true)}
                </p>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              {row.isCustomerProduct !== null && (
                <Badge variant="secondary">
                  {row.isCustomerProduct ? "Customer" : "Stock"}
                </Badge>
              )}
              <span>{formatSoldLabel(row.category)}</span>
              <span aria-hidden="true">·</span>
              <span>{row.purity === null ? "—" : `${row.purity}K`}</span>
              <span aria-hidden="true">·</span>
              <span>{formatSoldLabel(row.color)}</span>
              <span aria-hidden="true">·</span>
              <span>{formatSoldWeight(row.netWeight)}</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <span className="truncate">{row.location ?? "—"}</span>
              <span className="shrink-0">
                Value¹{" "}
                {row.productValue === null
                  ? "—"
                  : formatCurrency(row.productValue)}
              </span>
            </div>
            {!row.productId && (
              <p className="mt-1 text-xs text-muted-foreground">
                Inventory details unavailable
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
