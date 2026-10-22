"use client";

import type { RefObject } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatCurrency } from "@/lib/utils";
import type { BackendStockSaleRow } from "@/types/stock-sales-api";

function formatStockSaleAmount(amount: string) {
  const parsed = Number(amount);
  return Number.isFinite(parsed) ? formatCurrency(parsed) : amount;
}

function formatStockSaleMonth(saleMonth: string | null) {
  if (!saleMonth) return "-";
  return new Date(saleMonth).toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  });
}

function getStockSaleProductCodes(sale: BackendStockSaleRow) {
  return sale.items.map((item) => item.productCode).filter(Boolean);
}

function StockSaleProductCodes({ sale }: { sale: BackendStockSaleRow }) {
  const codes = getStockSaleProductCodes(sale);
  const visibleCodes = codes.slice(0, 2);
  const hiddenCount = codes.length - visibleCodes.length;

  if (codes.length === 0) {
    return <span className="text-muted-foreground">-</span>;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex max-w-72 flex-wrap gap-1">
            {visibleCodes.map((code) => (
              <Badge
                className="font-mono text-[11px] font-medium"
                key={code}
                variant="secondary"
              >
                {code}
              </Badge>
            ))}
            {hiddenCount > 0 && (
              <Badge
                className="border-border bg-transparent text-muted-foreground"
                variant="outline"
              >
                +{hiddenCount} more
              </Badge>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-80" side="top" sideOffset={6}>
          <div className="flex flex-wrap gap-1.5">
            {codes.map((code) => (
              <span
                className="rounded border border-background/20 px-1.5 py-0.5 font-mono text-[11px]"
                key={code}
              >
                {code}
              </span>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function StockPurchaseRow({ sale }: { sale: BackendStockSaleRow }) {
  const codes = getStockSaleProductCodes(sale);
  const details = [
    sale.salesPerson?.name,
    sale.location?.name ?? sale.storeName,
    sale.source,
  ].filter((value): value is string => Boolean(value));

  return (
    <li className="space-y-1.5 px-3 py-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            {sale.customerName}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {sale.stockType ?? "Stock sale"} ·{" "}
            {formatStockSaleMonth(sale.saleMonth)}
          </p>
        </div>
        <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
          {formatStockSaleAmount(sale.totalAmount)}
        </span>
      </div>
      {codes.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {codes.map((code) => (
            <Badge
              key={code}
              variant="secondary"
              className="font-mono text-[11px] font-medium"
            >
              {code}
            </Badge>
          ))}
        </div>
      )}
      {details.length > 0 && (
        <p className="truncate text-xs text-muted-foreground">
          {details.join(" · ")}
        </p>
      )}
    </li>
  );
}

export function StockPurchasesTable({
  sales,
  isLoading,
  isError,
  isFetchingNextPage,
  hasNextPage,
  loadMoreRef,
}: {
  sales: BackendStockSaleRow[];
  isLoading: boolean;
  isError: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  loadMoreRef: RefObject<HTMLDivElement | null>;
}) {
  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground">Loading purchases...</p>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-dashed border-border py-16 text-center">
        <p className="text-sm font-medium text-muted-foreground">
          Could not load purchases
        </p>
      </div>
    );
  }

  if (sales.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border py-16 text-center">
        <p className="text-sm font-medium text-muted-foreground">
          No stock purchases found
        </p>
      </div>
    );
  }

  return (
    <div className="my-1 overflow-hidden rounded-xl border border-border bg-card md:my-4">
      <ul className="divide-y divide-border md:hidden">
        {sales.map((sale) => (
          <StockPurchaseRow key={sale.id} sale={sale} />
        ))}
      </ul>
      <div className="hidden overflow-x-auto md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="min-w-52">Customer</TableHead>
              <TableHead className="w-72 min-w-72">Product codes</TableHead>
              <TableHead className="min-w-32">Amount</TableHead>
              <TableHead className="min-w-40">Sales person</TableHead>
              <TableHead className="min-w-36">Store</TableHead>
              <TableHead className="min-w-40">Source</TableHead>
              <TableHead className="min-w-28">Month</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.map((sale) => (
              <TableRow key={sale.id}>
                <TableCell>
                  <p className="font-medium text-foreground">
                    {sale.customerName}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {sale.stockType ?? "Stock sale"}
                  </p>
                </TableCell>
                <TableCell className="w-72 min-w-72">
                  <StockSaleProductCodes sale={sale} />
                </TableCell>
                <TableCell className="font-medium text-foreground">
                  {formatStockSaleAmount(sale.totalAmount)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {sale.salesPerson?.name ?? "-"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {sale.location?.name ?? sale.storeName ?? "-"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {sale.source ?? "-"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatStockSaleMonth(sale.saleMonth)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div ref={loadMoreRef} className="h-4" />
      {isFetchingNextPage ? (
        <p className="py-3 text-center text-xs text-muted-foreground">
          Fetching more purchases...
        </p>
      ) : !hasNextPage ? (
        <p className="py-3 text-center text-xs text-muted-foreground">
          -- End of List --
        </p>
      ) : null}
    </div>
  );
}
