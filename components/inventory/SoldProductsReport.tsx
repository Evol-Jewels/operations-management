"use client";

import { useQuery } from "@tanstack/react-query";
import { Download, LoaderCircle, Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocations } from "@/hooks/useManageProducts";
import { downloadSoldProducts, fetchSoldProducts } from "@/lib/soldProductsApi";
import type {
  SoldProductsQuery,
  SoldProductsSort,
} from "@/types/sold-products-api";
import {
  AnalyticsFilterControls,
  COLOR_LABELS,
  type ColorFilter,
  PURITY_LABELS,
  type PurityFilter,
} from "./AnalyticsFilterControls";
import { SoldProductsTable } from "./SoldProductsTable";

const categories = [
  "RING",
  "NECKLACE",
  "EARRING",
  "BRACELET",
  "PENDANT",
  "BANGLE",
  "ANKLET",
  "ACCESSORY",
  "CHAIN",
  "OTHER",
];
const sorts: SoldProductsSort[] = [
  "saleMonth",
  "productCode",
  "name",
  "category",
  "purity",
  "netWeight",
  "color",
  "location",
  "dateAdded",
  "saleValue",
];
const reportKeys = [
  "soldSearch",
  "soldCategory",
  "soldOwnership",
  "monthFrom",
  "monthTo",
  "soldSort",
  "soldOrder",
  "soldPage",
  "purity",
  "color",
  "locationId",
];
const pageSize = 25;

export function SoldProductsReport() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [downloading, setDownloading] = useState(false);
  const locations = useLocations({ limit: 100 });
  const color = params.get("color") ?? "ALL";
  const purity = params.get("purity") ?? "ALL";
  const category = params.get("soldCategory") ?? "ALL";
  const ownership = params.get("soldOwnership") ?? "ALL";
  const monthFrom = params.get("monthFrom") ?? "";
  const monthTo = params.get("monthTo") ?? "";
  const search = params.get("soldSearch") ?? "";
  const requestedPage = Number(params.get("soldPage") ?? "1");
  const page =
    Number.isSafeInteger(requestedPage) &&
    requestedPage > 0 &&
    requestedPage <= 85899345
      ? requestedPage
      : 1;
  const sortBy =
    sorts.find((sort) => sort === params.get("soldSort")) ?? "saleMonth";
  const sortOrder = params.get("soldOrder") === "asc" ? "asc" : "desc";
  const validMonth = (value: string) =>
    !value || /^[1-9]\d{3}-(0[1-9]|1[0-2])$/.test(value);
  const invalidRange =
    !validMonth(monthFrom) ||
    !validMonth(monthTo) ||
    Boolean(monthFrom && monthTo && monthFrom > monthTo);
  const query: SoldProductsQuery = {
    search: search || undefined,
    purity: purity in PURITY_LABELS ? Number(purity) : undefined,
    color: color in COLOR_LABELS ? color : undefined,
    category: categories.includes(category) ? category : undefined,
    ownership:
      ownership === "STOCK" || ownership === "CUSTOMER" ? ownership : undefined,
    locationId: params.get("locationId") || undefined,
    monthFrom: monthFrom || undefined,
    monthTo: monthTo || undefined,
    sortBy,
    sortOrder,
    limit: pageSize,
    offset: (page - 1) * pageSize,
  };
  const report = useQuery({
    queryKey: ["stock-sales", "sold-products", query],
    queryFn: ({ signal }) => fetchSoldProducts(query, signal),
    enabled: !invalidRange,
  });

  function update(values: Record<string, string>) {
    const next = new URLSearchParams(params);
    next.delete("soldPage");
    for (const [key, value] of Object.entries(values)) {
      if (!value || value === "ALL") next.delete(key);
      else next.set(key, value);
    }
    router.replace(`${pathname}?${next}`, { scroll: false });
  }

  function reset() {
    const next = new URLSearchParams(params);
    for (const key of reportKeys) next.delete(key);
    router.replace(`${pathname}?${next}`, { scroll: false });
  }

  async function download() {
    setDownloading(true);
    try {
      const blob = await downloadSoldProducts(query);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "sold-products.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success("Sold products downloaded");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to download sold products",
      );
    } finally {
      setDownloading(false);
    }
  }

  return (
    <section aria-label="Sold products" className="min-w-0 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">Sales history</p>
          {report.data && !invalidRange && (
            <Badge variant="secondary">
              {report.data.total.toLocaleString("en-IN")} sold items
            </Badge>
          )}
        </div>
        <Button
          variant="outline"
          className="h-11 gap-2"
          disabled={
            downloading ||
            invalidRange ||
            report.isFetching ||
            report.isError ||
            !report.data?.total
          }
          onClick={() => void download()}
        >
          {downloading ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <Download className="size-4" />
          )}
          {downloading ? "Preparing CSV…" : "Download CSV"}
        </Button>
      </div>
      <div className="space-y-3 rounded-md border bg-card p-4">
        <div className="grid gap-3 xl:grid-cols-2">
          <form
            key={search}
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              update({
                soldSearch: String(
                  new FormData(event.currentTarget).get("search") ?? "",
                ).trim(),
              });
            }}
          >
            <Input
              name="search"
              aria-label="Search product name or SKU"
              placeholder="Search product name or SKU"
              defaultValue={search}
              maxLength={255}
              className="h-10"
            />
            <Button type="submit" variant="outline" className="h-10 gap-2">
              <Search className="size-4" />
              <span className="sr-only sm:not-sr-only">Search</span>
            </Button>
          </form>
          <AnalyticsFilterControls
            color={(color in COLOR_LABELS ? color : "ALL") as ColorFilter}
            purity={(purity in PURITY_LABELS ? purity : "ALL") as PurityFilter}
            location={params.get("locationId") ?? "ALL"}
            locations={locations.data?.data ?? []}
            locationsLoading={locations.isLoading}
            onFilterChange={(key, value) => update({ [key]: value })}
          />
        </div>
        <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_auto]">
          <div className="space-y-2">
            <Label htmlFor="sold-category">Category</Label>
            <Select
              value={categories.includes(category) ? category : "ALL"}
              onValueChange={(value) => update({ soldCategory: value })}
            >
              <SelectTrigger id="sold-category" className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All categories</SelectItem>
                {categories.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value.charAt(0) + value.slice(1).toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sold-ownership">Ownership</Label>
            <Select
              value={
                ownership === "STOCK" || ownership === "CUSTOMER"
                  ? ownership
                  : "ALL"
              }
              onValueChange={(value) => update({ soldOwnership: value })}
            >
              <SelectTrigger id="sold-ownership" className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All ownership</SelectItem>
                <SelectItem value="STOCK">Stock</SelectItem>
                <SelectItem value="CUSTOMER">Customer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sold-from">From month</Label>
            <Input
              id="sold-from"
              type="month"
              value={monthFrom}
              max={monthTo || "9999-12"}
              min="1000-01"
              className="h-10"
              aria-invalid={invalidRange}
              aria-describedby={invalidRange ? "sold-range-error" : undefined}
              onChange={(event) => update({ monthFrom: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sold-to">To month</Label>
            <Input
              id="sold-to"
              type="month"
              value={monthTo}
              min={monthFrom || "1000-01"}
              max="9999-12"
              className="h-10"
              aria-invalid={invalidRange}
              aria-describedby={invalidRange ? "sold-range-error" : undefined}
              onChange={(event) => update({ monthTo: event.target.value })}
            />
          </div>
          <Button variant="ghost" className="h-10" onClick={reset}>
            Reset filters
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Location filters the sale location. Months are inclusive; leave both
          empty for all history.
        </p>
        {invalidRange && (
          <p
            id="sold-range-error"
            role="alert"
            className="text-sm text-destructive"
          >
            Choose a valid month range with From month on or before To month.
          </p>
        )}
      </div>
      {!invalidRange && (
        <>
          {report.isLoading && (
            <output
              aria-label="Loading sold products"
              className="block space-y-2"
            >
              {[1, 2, 3, 4, 5].map((key) => (
                <Skeleton key={key} className="h-12 w-full" />
              ))}
            </output>
          )}
          {report.isError && (
            <div role="alert" className="rounded-md border p-6 text-center">
              <p>{report.error.message}</p>
              <Button
                variant="outline"
                className="mt-3"
                onClick={() => void report.refetch()}
              >
                Retry
              </Button>
            </div>
          )}
          {report.data && !report.isError && (
            <>
              {report.data.data.length ? (
                <SoldProductsTable
                  rows={report.data.data}
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={(sort) =>
                    update({
                      soldSort: sort,
                      soldOrder:
                        sort === sortBy && sortOrder === "asc" ? "desc" : "asc",
                    })
                  }
                />
              ) : (
                <div className="rounded-md border border-dashed p-10 text-center">
                  <p className="text-sm text-muted-foreground">
                    No sold products found for this selection.
                  </p>
                  <Button variant="ghost" className="mt-2" onClick={reset}>
                    Reset filters
                  </Button>
                </div>
              )}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground" aria-live="polite">
                  {report.data.total
                    ? `Page ${page} of ${Math.ceil(report.data.total / pageSize)}`
                    : "0 results"}
                  {report.isFetching ? " · Updating…" : ""}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled={page === 1 || report.isFetching}
                    onClick={() => update({ soldPage: String(page - 1) })}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    disabled={
                      page * pageSize >= report.data.total || report.isFetching
                    }
                    onClick={() => update({ soldPage: String(page + 1) })}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </>
      )}
      <div className="space-y-1 text-xs text-muted-foreground">
        <p>
          ¹ Product value is a current estimate, not the value at the time of
          sale.
        </p>
        <p>
          ² Sale value is available for single-product transactions.
          Multi-product transactions have no item-level price.
        </p>
      </div>
    </section>
  );
}
