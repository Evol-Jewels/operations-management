"use client";

import { useQuery } from "@tanstack/react-query";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchSoldProducts,
  fetchSoldProductLocations,
} from "@/lib/soldProductsApi";
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
import { AnalyticsFilterPopover } from "./AnalyticsFilterPopover";
import { SoldProductsSearch } from "./SoldProductsSearch";
import { MonthPicker, isValidMonth } from "./MonthPicker";
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
  "soldLocation",
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
  const locations = useQuery({
    queryKey: ["stock-sales", "sold-product-locations"],
    queryFn: ({ signal }) => fetchSoldProductLocations(signal),
    staleTime: 60_000,
  });
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
  const invalidRange =
    Boolean(monthFrom && !isValidMonth(monthFrom)) ||
    Boolean(monthTo && !isValidMonth(monthTo)) ||
    Boolean(monthFrom && monthTo && monthFrom > monthTo);
  const query: SoldProductsQuery = {
    search: search || undefined,
    purity: purity in PURITY_LABELS ? Number(purity) : undefined,
    color: color in COLOR_LABELS ? color : undefined,
    category: categories.includes(category) ? category : undefined,
    ownership:
      ownership === "STOCK" || ownership === "CUSTOMER" ? ownership : undefined,
    location: params.get("soldLocation") || undefined,
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
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <SoldProductsSearch
            value={search}
            onSearch={(value) => update({ soldSearch: value })}
          />
          <AnalyticsFilterPopover
            count={
              [
                query.purity,
                query.color,
                query.category,
                query.ownership,
                query.location,
                query.monthFrom,
                query.monthTo,
              ].filter(Boolean).length
            }
            onReset={() =>
              update({
                purity: "",
                color: "",
                soldLocation: "",
                soldCategory: "",
                soldOwnership: "",
                monthFrom: "",
                monthTo: "",
              })
            }
          >
            <AnalyticsFilterControls
              color={(color in COLOR_LABELS ? color : "ALL") as ColorFilter}
              purity={
                (purity in PURITY_LABELS ? purity : "ALL") as PurityFilter
              }
              location={params.get("soldLocation") ?? "ALL"}
              locationLabel="Sale location"
              locations={(locations.data ?? []).map((name) => ({
                id: name,
                name,
              }))}
              locationsLoading={locations.isLoading || locations.isError}
              onFilterChange={(key, value) =>
                update({ [key === "locationId" ? "soldLocation" : key]: value })
              }
            />
            {locations.isError && (
              <div
                role="alert"
                className="flex items-center justify-between gap-2 text-sm text-destructive"
              >
                <span>Unable to load sale locations.</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void locations.refetch()}
                >
                  Retry
                </Button>
              </div>
            )}
            <div className="grid grid-cols-2 items-end gap-3">
              <div className="min-w-0 space-y-1.5">
                <Label htmlFor="sold-category">Category</Label>
                <Select
                  value={categories.includes(category) ? category : "ALL"}
                  onValueChange={(value) => update({ soldCategory: value })}
                >
                  <SelectTrigger id="sold-category" className="w-full">
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
              <div className="min-w-0 space-y-1.5">
                <Label htmlFor="sold-ownership">Product type</Label>
                <Select
                  value={
                    ownership === "STOCK" || ownership === "CUSTOMER"
                      ? ownership
                      : "ALL"
                  }
                  onValueChange={(value) => update({ soldOwnership: value })}
                >
                  <SelectTrigger id="sold-ownership" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All product types</SelectItem>
                    <SelectItem value="STOCK">Stock</SelectItem>
                    <SelectItem value="CUSTOMER">Customer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-3 border-t pt-3">
              <p className="text-sm font-medium">Sale period</p>
              <div className="grid grid-cols-2 gap-3">
                <MonthPicker
                  label="From"
                  value={monthFrom}
                  max={isValidMonth(monthTo) ? monthTo : undefined}
                  onChange={(value) => update({ monthFrom: value })}
                />
                <MonthPicker
                  label="To"
                  value={monthTo}
                  min={isValidMonth(monthFrom) ? monthFrom : undefined}
                  onChange={(value) => update({ monthTo: value })}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Location filters the sale location. Months are inclusive; leave
              both empty for all history.
            </p>
          </AnalyticsFilterPopover>
        </div>
      </div>
      {invalidRange && (
        <p
          id="sold-range-error"
          role="alert"
          className="text-sm text-destructive"
        >
          Choose a valid month range with From month on or before To month.
        </p>
      )}
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
                    ? `${report.data.data.length ? (page - 1) * pageSize + 1 : 0}–${report.data.data.length ? (page - 1) * pageSize + report.data.data.length : 0} of ${report.data.total.toLocaleString("en-IN")} products · Page ${page} of ${Math.ceil(report.data.total / pageSize)}`
                    : "0 results"}
                  {report.isFetching ? " · Updating…" : ""}
                </p>
                <nav
                  aria-label="Sold products pagination"
                  className="flex flex-wrap gap-2"
                >
                  <Button
                    variant="outline"
                    disabled={page === 1 || report.isFetching}
                    onClick={() => update({ soldPage: String(page - 1) })}
                  >
                    Previous
                  </Button>
                  {Array.from(
                    new Set([
                      1,
                      page - 1,
                      page,
                      page + 1,
                      Math.ceil(report.data.total / pageSize),
                    ]),
                  )
                    .filter(
                      (number) =>
                        number >= 1 &&
                        number <= Math.ceil(report.data.total / pageSize),
                    )
                    .sort((a, b) => a - b)
                    .map((number, index, pages) => (
                      <span
                        key={number}
                        className="hidden items-center gap-2 sm:flex"
                      >
                        {index > 0 && number - pages[index - 1] > 1 && (
                          <span className="px-1 text-muted-foreground">…</span>
                        )}
                        <Button
                          variant={number === page ? "secondary" : "outline"}
                          size="icon"
                          aria-label={`Page ${number}`}
                          aria-current={number === page ? "page" : undefined}
                          disabled={report.isFetching}
                          onClick={() => update({ soldPage: String(number) })}
                        >
                          {number}
                        </Button>
                      </span>
                    ))}
                  <Button
                    variant="outline"
                    disabled={
                      page * pageSize >= report.data.total || report.isFetching
                    }
                    onClick={() => update({ soldPage: String(page + 1) })}
                  >
                    Next
                  </Button>
                </nav>
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
