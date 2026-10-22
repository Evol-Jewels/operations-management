"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
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
import { cn, formatCurrency } from "@/lib/utils";
import type { SoldProduct, SoldProductsSort } from "@/types/sold-products-api";

export const SOLD_COLUMNS: {
  label: string;
  sort?: SoldProductsSort;
  numeric?: boolean;
}[] = [
  { label: "Product", sort: "name" },
  { label: "SKU", sort: "productCode" },
  { label: "Sale month", sort: "saleMonth" },
  { label: "Category", sort: "category" },
  { label: "Product type" },
  { label: "Purity", sort: "purity", numeric: true },
  { label: "Net weight", sort: "netWeight", numeric: true },
  { label: "Color", sort: "color" },
  { label: "Sale location", sort: "location" },
  { label: "Product value¹", numeric: true },
  { label: "Sale value²", sort: "saleValue", numeric: true },
  { label: "Date added", sort: "dateAdded" },
];

export function formatSoldLabel(value: string | null) {
  return value ? value.charAt(0) + value.slice(1).toLowerCase() : "—";
}

export function formatSoldDate(value: string | null, monthOnly = false) {
  return value
    ? new Date(monthOnly ? `${value}-01T00:00:00Z` : value).toLocaleDateString(
        "en-IN",
        {
          month: "short",
          year: "numeric",
          ...(monthOnly ? {} : { day: "numeric" }),
          timeZone: "Asia/Kolkata",
        },
      )
    : "—";
}

export function formatSoldWeight(value: string | null) {
  return value === null
    ? "—"
    : `${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 3 })} g`;
}

export function SoldProductsTable({
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
    <div className="hidden min-w-0 overflow-hidden rounded-md border md:block">
      <Table aria-label="Sold products report">
        <TableHeader>
          <TableRow className="bg-muted/40">
            {SOLD_COLUMNS.map((column) => (
              <TableHead
                key={column.label}
                className={cn(
                  column.numeric && "text-right",
                  column.sort === "name" &&
                    "sticky left-0 z-10 bg-muted shadow-[1px_0_0_var(--border)]",
                )}
                aria-sort={
                  column.sort === sortBy
                    ? sortOrder === "asc"
                      ? "ascending"
                      : "descending"
                    : undefined
                }
              >
                {column.sort ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-11 gap-1 px-0 hover:bg-transparent"
                    onClick={() => column.sort && onSort(column.sort)}
                  >
                    {column.label}
                    {column.sort !== sortBy ? (
                      <ArrowUpDown className="size-3 text-muted-foreground" />
                    ) : sortOrder === "asc" ? (
                      <ArrowUp className="size-3" />
                    ) : (
                      <ArrowDown className="size-3" />
                    )}
                  </Button>
                ) : (
                  column.label
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="sticky left-0 z-10 min-w-44 max-w-64 whitespace-normal bg-background font-medium shadow-[1px_0_0_var(--border)]">
                {row.name ?? row.productCode}
                {!row.productId && (
                  <span className="mt-1 block text-xs font-normal text-muted-foreground">
                    Inventory details unavailable
                  </span>
                )}
              </TableCell>
              <TableCell className="font-mono text-xs">
                {row.productCode}
              </TableCell>
              <TableCell>{formatSoldDate(row.saleMonth, true)}</TableCell>
              <TableCell>{formatSoldLabel(row.category)}</TableCell>
              <TableCell>
                {row.isCustomerProduct === null ? (
                  "—"
                ) : (
                  <Badge variant="secondary">
                    {row.isCustomerProduct ? "Customer" : "Stock"}
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {row.purity === null ? "—" : `${row.purity}K`}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatSoldWeight(row.netWeight)}
              </TableCell>
              <TableCell>{formatSoldLabel(row.color)}</TableCell>
              <TableCell>{row.location ?? "—"}</TableCell>
              <TableCell className="text-right tabular-nums">
                {row.productValue === null
                  ? "—"
                  : formatCurrency(row.productValue)}
              </TableCell>
              <TableCell
                className="text-right tabular-nums"
                title={
                  row.saleValue === null
                    ? "Item-level price unavailable for a multi-product transaction"
                    : undefined
                }
              >
                {row.saleValue === null
                  ? "—"
                  : formatCurrency(Number(row.saleValue))}
              </TableCell>
              <TableCell>{formatSoldDate(row.dateAdded)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
