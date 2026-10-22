"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarDays, ChevronDown, Search, X } from "lucide-react";
import { useId, useState } from "react";
import { AnalyticsFilterPopover } from "@/components/inventory/AnalyticsFilterPopover";
import { MonthPicker } from "@/components/inventory/MonthPicker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VendorFilterSelect } from "@/components/vendors/VendorFilterSelect";
import { useLocations } from "@/hooks/useManageProducts";
import { useVendors } from "@/hooks/useVendors";
import { fetchInternalUsers } from "@/lib/internalUserManagementApi";
import {
  countMoreRecentSalesFilters,
  EMPTY_RECENT_SALES_FILTERS,
  type RecentSalesFilters as Filters,
  getRecentSalesRangeError,
  getSaleMonthRangeLabel,
  RECENT_SALES_CATEGORIES,
  RECENT_SALES_COLORS,
  RECENT_SALES_PURITIES,
  type RecentSalesInventory,
  shiftMonth,
} from "@/lib/recentSalesFilters";
import { cn, formatCurrency } from "@/lib/utils";
import { getVendorFilterLabel } from "@/lib/vendors";
import { FilterField, WorkspaceFiltersSheet } from "./WorkspaceFiltersSheet";

const INVENTORY_LABELS: Record<Exclude<RecentSalesInventory, "ALL">, string> = {
  FOUND: "In inventory",
  NOT_FOUND: "Not in inventory",
};

type FilterChip = { key: string; label: string; remove: Partial<Filters> };

function titleCase(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

function SaleMonthOptions({
  from,
  to,
  onChange,
  onPresetSelect,
}: {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
  onPresetSelect?: () => void;
}) {
  const today = new Date();
  const current = shiftMonth(today, 0);
  const presets = [
    { label: "This month", from: current, to: current },
    { label: "Last 3 months", from: shiftMonth(today, 2), to: current },
    { label: "Last 6 months", from: shiftMonth(today, 5), to: current },
    { label: "Last 12 months", from: shiftMonth(today, 11), to: current },
    { label: "This year", from: `${today.getFullYear()}-01`, to: current },
    { label: "All months", from: "", to: "" },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-1">
        {presets.map((preset) => {
          const active = from === preset.from && to === preset.to;
          return (
            <Button
              key={preset.label}
              type="button"
              size="sm"
              variant={active ? "secondary" : "ghost"}
              aria-pressed={active}
              className="h-10 justify-start font-normal sm:h-8"
              onClick={() => {
                onChange(preset.from, preset.to);
                onPresetSelect?.();
              }}
            >
              {preset.label}
            </Button>
          );
        })}
      </div>
      <div className="grid grid-cols-2 gap-3 border-t pt-3">
        <MonthPicker
          label="From"
          value={from}
          max={to || undefined}
          onChange={(value) => onChange(value, to)}
        />
        <MonthPicker
          label="To"
          value={to}
          min={from || undefined}
          onChange={(value) => onChange(from, value)}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Sales are recorded by month. Months are inclusive.
      </p>
    </div>
  );
}

function SaleMonthFilter({
  from,
  to,
  onChange,
}: {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const label = getSaleMonthRangeLabel(from, to);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          aria-label={`Sale month: ${label}`}
          className="h-9 justify-between gap-2 px-3 font-normal"
        >
          <span className="flex min-w-0 items-center gap-2">
            <CalendarDays
              aria-hidden="true"
              className="size-4 text-muted-foreground"
            />
            <span className="truncate">{label}</span>
          </span>
          <ChevronDown
            aria-hidden="true"
            className={cn(
              "size-4 text-muted-foreground opacity-50 transition-transform duration-200 motion-reduce:transition-none",
              open && "rotate-180",
            )}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        collisionPadding={16}
        aria-label="Sale month range"
        className="w-[min(20rem,calc(100vw-2rem))] p-3"
      >
        <SaleMonthOptions
          from={from}
          to={to}
          onChange={onChange}
          onPresetSelect={() => setOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );
}

function PriceInput({
  id,
  label,
  value,
  onCommit,
}: {
  id: string;
  label: string;
  value: string;
  onCommit: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  const [synced, setSynced] = useState(value);
  if (value !== synced) {
    setSynced(value);
    setDraft(value);
  }
  const commit = () => {
    const next = draft.trim();
    if (next !== value) onCommit(next);
  };

  return (
    <div className="min-w-0 space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        min={0}
        step={1000}
        placeholder="Any"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") commit();
        }}
        className="h-9"
      />
    </div>
  );
}

export function RecentSalesFilters({
  search,
  onSearchChange,
  filters,
  onChange,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  filters: Filters;
  onChange: (changes: Partial<Filters>) => void;
}) {
  const id = useId();
  const vendorsQuery = useVendors();
  const locationsQuery = useLocations({ limit: 100 });
  const salesPeopleQuery = useQuery({
    queryKey: ["internal-users", { role: "SALES" }],
    queryFn: () => fetchInternalUsers({ role: "SALES" }),
    staleTime: 5 * 60_000,
  });
  const vendors = vendorsQuery.data ?? [];
  const locations = locationsQuery.data?.data ?? [];
  const salesPeople = (salesPeopleQuery.data ?? [])
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name));
  const rangeError = getRecentSalesRangeError(filters);
  const moreCount = countMoreRecentSalesFilters(filters);

  const location = locations.find((item) => item.id === filters.locationId);
  const seller = salesPeople.find((item) => item.id === filters.salesPersonId);
  const price =
    filters.priceFrom && filters.priceTo
      ? `${formatCurrency(Number(filters.priceFrom))} – ${formatCurrency(Number(filters.priceTo))}`
      : filters.priceFrom
        ? `From ${formatCurrency(Number(filters.priceFrom))}`
        : filters.priceTo
          ? `Up to ${formatCurrency(Number(filters.priceTo))}`
          : null;
  const chips: FilterChip[] = [];
  if (filters.vendorId !== "ALL")
    chips.push({
      key: "vendor",
      label: `Vendor: ${getVendorFilterLabel(filters.vendorId, vendors)}`,
      remove: { vendorId: "ALL" },
    });
  if (filters.monthFrom || filters.monthTo)
    chips.push({
      key: "months",
      label: getSaleMonthRangeLabel(filters.monthFrom, filters.monthTo),
      remove: { monthFrom: "", monthTo: "" },
    });
  if (filters.locationId !== "ALL")
    chips.push({
      key: "location",
      label: `Location: ${location?.name ?? "Selected location"}`,
      remove: { locationId: "ALL" },
    });
  if (filters.salesPersonId !== "ALL")
    chips.push({
      key: "seller",
      label: `Sold by: ${seller?.name ?? "Selected salesperson"}`,
      remove: { salesPersonId: "ALL" },
    });
  if (filters.category !== "ALL")
    chips.push({
      key: "category",
      label: titleCase(filters.category),
      remove: { category: "ALL" },
    });
  if (filters.purity !== "ALL")
    chips.push({
      key: "purity",
      label: `${filters.purity}K`,
      remove: { purity: "ALL" },
    });
  if (filters.color !== "ALL")
    chips.push({
      key: "color",
      label: titleCase(filters.color),
      remove: { color: "ALL" },
    });
  if (filters.inventory !== "ALL")
    chips.push({
      key: "inventory",
      label: INVENTORY_LABELS[filters.inventory],
      remove: { inventory: "ALL" },
    });
  if (price)
    chips.push({
      key: "price",
      label: `Price: ${price}`,
      remove: { priceFrom: "", priceTo: "" },
    });

  const moreFields = (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div className="min-w-0 space-y-1.5">
          <Label htmlFor={`${id}-category`}>Category</Label>
          <Select
            value={filters.category}
            onValueChange={(category) => onChange({ category })}
          >
            <SelectTrigger id={`${id}-category`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All categories</SelectItem>
              {RECENT_SALES_CATEGORIES.map((value) => (
                <SelectItem key={value} value={value}>
                  {titleCase(value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-0 space-y-1.5">
          <Label htmlFor={`${id}-inventory`}>Inventory match</Label>
          <Select
            value={filters.inventory}
            onValueChange={(inventory) =>
              onChange({ inventory: inventory as RecentSalesInventory })
            }
          >
            <SelectTrigger id={`${id}-inventory`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All sales</SelectItem>
              <SelectItem value="FOUND">{INVENTORY_LABELS.FOUND}</SelectItem>
              <SelectItem value="NOT_FOUND">
                {INVENTORY_LABELS.NOT_FOUND}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-0 space-y-1.5">
          <Label htmlFor={`${id}-purity`}>Purity</Label>
          <Select
            value={filters.purity}
            onValueChange={(purity) => onChange({ purity })}
          >
            <SelectTrigger id={`${id}-purity`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All purities</SelectItem>
              {RECENT_SALES_PURITIES.map((value) => (
                <SelectItem key={value} value={value}>
                  {value}K
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-0 space-y-1.5">
          <Label htmlFor={`${id}-color`}>Color</Label>
          <Select
            value={filters.color}
            onValueChange={(color) => onChange({ color })}
          >
            <SelectTrigger id={`${id}-color`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All colors</SelectItem>
              {RECENT_SALES_COLORS.map((value) => (
                <SelectItem key={value} value={value}>
                  {titleCase(value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2 min-w-0 space-y-1.5">
          <Label htmlFor={`${id}-location`}>Sale location</Label>
          <Select
            value={filters.locationId}
            onValueChange={(locationId) => onChange({ locationId })}
            disabled={locationsQuery.isLoading}
          >
            <SelectTrigger id={`${id}-location`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All locations</SelectItem>
              {locations.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name} · {item.city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2 min-w-0 space-y-1.5">
          <Label htmlFor={`${id}-seller`}>Salesperson</Label>
          <Select
            value={filters.salesPersonId}
            onValueChange={(salesPersonId) => onChange({ salesPersonId })}
            disabled={salesPeopleQuery.isLoading}
          >
            <SelectTrigger id={`${id}-seller`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All salespeople</SelectItem>
              {salesPeople.map((person) => (
                <SelectItem key={person.id} value={person.id}>
                  {person.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <PriceInput
          id={`${id}-price-from`}
          label="Min price (₹)"
          value={filters.priceFrom}
          onCommit={(priceFrom) => onChange({ priceFrom })}
        />
        <PriceInput
          id={`${id}-price-to`}
          label="Max price (₹)"
          value={filters.priceTo}
          onCommit={(priceTo) => onChange({ priceTo })}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Category, purity, color and vendor match the product in inventory. Price
        is the sale amount.
      </p>
    </>
  );
  const resetMoreFilters = () =>
    onChange({
      locationId: "ALL",
      salesPersonId: "ALL",
      category: "ALL",
      purity: "ALL",
      color: "ALL",
      inventory: "ALL",
      priceFrom: "",
      priceTo: "",
    });
  const activeCount =
    moreCount +
    (filters.vendorId !== "ALL" ? 1 : 0) +
    (filters.monthFrom || filters.monthTo ? 1 : 0);

  return (
    <div className="min-w-0 flex-1 space-y-2.5">
      <div className="flex flex-wrap items-center gap-2 lg:justify-end">
        <div className="relative min-w-0 flex-1 sm:w-64 sm:flex-none sm:shrink-0">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search product code or name…"
            aria-label="Search recent sales"
            maxLength={255}
            className="h-10 pl-9 sm:h-9"
          />
        </div>
        <WorkspaceFiltersSheet
          activeCount={activeCount}
          onReset={() => onChange(EMPTY_RECENT_SALES_FILTERS)}
          description="Narrow down recent product sales"
          className="sm:hidden"
        >
          <FilterField label="Vendor">
            <VendorFilterSelect
              value={filters.vendorId}
              vendors={vendors}
              isLoading={vendorsQuery.isLoading}
              onChange={(vendorId) => onChange({ vendorId })}
              className="h-10 w-full"
            />
          </FilterField>
          <FilterField label="Sale months">
            <SaleMonthOptions
              from={filters.monthFrom}
              to={filters.monthTo}
              onChange={(monthFrom, monthTo) =>
                onChange({ monthFrom, monthTo })
              }
            />
          </FilterField>
          {moreFields}
        </WorkspaceFiltersSheet>
        <div className="hidden sm:contents">
          <VendorFilterSelect
            value={filters.vendorId}
            vendors={vendors}
            isLoading={vendorsQuery.isLoading}
            onChange={(vendorId) => onChange({ vendorId })}
            className="h-9 w-52"
          />
          <SaleMonthFilter
            from={filters.monthFrom}
            to={filters.monthTo}
            onChange={(monthFrom, monthTo) => onChange({ monthFrom, monthTo })}
          />
          <AnalyticsFilterPopover count={moreCount} onReset={resetMoreFilters}>
            {moreFields}
          </AnalyticsFilterPopover>
        </div>
      </div>
      {rangeError ? (
        <p role="alert" className="text-sm text-destructive lg:text-right">
          {rangeError}
        </p>
      ) : null}
      {chips.length > 0 && (
        <ul
          className="flex flex-wrap items-center gap-2 lg:justify-end"
          aria-label="Selected recent sales filters"
        >
          {chips.map((chip) => (
            <li key={chip.key}>
              <Badge
                variant="secondary"
                className="h-8 gap-1.5 rounded-md border border-border bg-muted/60 px-2.5 text-xs font-medium text-foreground"
              >
                <span>{chip.label}</span>
                <button
                  type="button"
                  onClick={() => onChange(chip.remove)}
                  aria-label={`Remove ${chip.label} filter`}
                  className="-mr-1 inline-flex size-5 cursor-pointer items-center justify-center rounded-sm text-muted-foreground hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X className="size-3.5" />
                </button>
              </Badge>
            </li>
          ))}
          <li>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange(EMPTY_RECENT_SALES_FILTERS)}
              className="h-8 px-2 text-xs text-muted-foreground"
            >
              Clear filters
            </Button>
          </li>
        </ul>
      )}
    </div>
  );
}
