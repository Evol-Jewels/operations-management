"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VendorFilterSelect } from "@/components/vendors/VendorFilterSelect";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Vendor } from "@/lib/vendors";
import type { ProductColor } from "@/types/inventory-api";
import { FilterSheet } from "./FilterSheet";
import {
  CATEGORY_LABELS,
  CATEGORY_VALUES,
  COLOR_LABELS,
  type InventoryFilterKey,
  type InventoryFilters,
  PURITY_LABELS,
  type PurityFilter,
} from "./inventory-utils";

export type ActiveFilterChip = {
  key: InventoryFilterKey;
  label: string;
};

type InventoryFiltersPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: InventoryFilters;
  activeCount: number;
  onFilterChange: (key: InventoryFilterKey, value: string) => void;
  onReset: () => void;
  locations: { id: string; name: string; city: string }[];
  canViewVendor: boolean;
  vendors: Vendor[];
  vendorsLoading: boolean;
};

function RangeInputs({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="grid grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

function FilterFields({
  filters,
  onFilterChange,
  locations,
  canViewVendor,
  vendors,
  vendorsLoading,
}: Omit<InventoryFiltersPanelProps, "open" | "onOpenChange" | "onReset">) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Product attributes</Label>
        <div className="grid grid-cols-2 gap-3">
          <Select
            value={filters.category}
            onValueChange={(value) => onFilterChange("category", value)}
          >
            <SelectTrigger className="h-10 w-full" aria-label="Category">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All categories</SelectItem>
              {CATEGORY_VALUES.map((category) => (
                <SelectItem key={category} value={category}>
                  {CATEGORY_LABELS[category]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.color}
            onValueChange={(value) => onFilterChange("color", value)}
          >
            <SelectTrigger className="h-10 w-full" aria-label="Color">
              <SelectValue placeholder="Color" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All colors</SelectItem>
              {(Object.keys(COLOR_LABELS) as ProductColor[]).map((color) => (
                <SelectItem key={color} value={color}>
                  {COLOR_LABELS[color]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.purity}
            onValueChange={(value) => onFilterChange("purity", value)}
          >
            <SelectTrigger className="h-10 w-full" aria-label="Purity">
              <SelectValue placeholder="Purity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All purities</SelectItem>
              {(
                Object.keys(PURITY_LABELS) as Array<
                  Exclude<PurityFilter, "ALL">
                >
              ).map((purity) => (
                <SelectItem key={purity} value={purity}>
                  {PURITY_LABELS[purity]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.source}
            onValueChange={(value) => onFilterChange("source", value)}
          >
            <SelectTrigger className="h-10 w-full" aria-label="Source">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All sources</SelectItem>
              <SelectItem value="CUSTOMER">Customer product</SelectItem>
              <SelectItem value="STOCK">Stock product</SelectItem>
            </SelectContent>
          </Select>

          <div className="col-span-2 sm:col-span-1">
            <Select
              value={filters.location}
              onValueChange={(value) => onFilterChange("location", value)}
            >
              <SelectTrigger className="h-10 w-full" aria-label="Location">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All locations</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name} · {location.city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {canViewVendor ? (
            <div className="col-span-2 sm:col-span-1">
              <VendorFilterSelect
                value={filters.vendor}
                vendors={vendors}
                isLoading={vendorsLoading}
                onChange={(value) => onFilterChange("vendor", value)}
              />
            </div>
          ) : null}
        </div>
      </div>

      <RangeInputs label="Estimated price (₹)">
        <Input
          type="number"
          inputMode="decimal"
          min={0}
          step="1"
          value={filters.priceFrom}
          onChange={(event) => onFilterChange("priceFrom", event.target.value)}
          placeholder="Min"
          aria-label="Minimum estimated price"
        />
        <Input
          type="number"
          inputMode="decimal"
          min={0}
          step="1"
          value={filters.priceTo}
          onChange={(event) => onFilterChange("priceTo", event.target.value)}
          placeholder="Max"
          aria-label="Maximum estimated price"
        />
      </RangeInputs>

      <RangeInputs label="Net weight (g)">
        <Input
          type="number"
          inputMode="decimal"
          min={0}
          step="0.01"
          value={filters.netWeightFrom}
          onChange={(event) =>
            onFilterChange("netWeightFrom", event.target.value)
          }
          placeholder="From"
          aria-label="Minimum net weight"
        />
        <Input
          type="number"
          inputMode="decimal"
          min={0}
          step="0.01"
          value={filters.netWeightTo}
          onChange={(event) =>
            onFilterChange("netWeightTo", event.target.value)
          }
          placeholder="To"
          aria-label="Maximum net weight"
        />
      </RangeInputs>

      <RangeInputs label="Source created at">
        <DatePicker
          value={filters.sourceCreatedFrom}
          placeholder="From date"
          onChange={(value) => onFilterChange("sourceCreatedFrom", value)}
        />
        <DatePicker
          value={filters.sourceCreatedTo}
          placeholder="To date"
          onChange={(value) => onFilterChange("sourceCreatedTo", value)}
        />
      </RangeInputs>
    </div>
  );
}

export function InventoryFiltersPanel(props: InventoryFiltersPanelProps) {
  const { open, onOpenChange, onReset, activeCount } = props;
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <FilterSheet
        open={open}
        onOpenChange={onOpenChange}
        resetLabel="Clear all"
        resetDisabled={activeCount === 0}
        onReset={onReset}
      >
        <FilterFields {...props} />
      </FilterSheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto p-0 sm:max-w-2xl">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Filters</DialogTitle>
          <DialogDescription>
            Refine inventory results by product attributes, location, price,
            weight, and source date.
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 pb-5">
          <FilterFields {...props} />
        </div>
        <DialogFooter className="border-t border-border px-6 py-4">
          <Button type="button" variant="outline" onClick={onReset}>
            Clear all filters
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ActiveFilterChips({
  chips,
  onRemove,
  className,
}: {
  chips: ActiveFilterChip[];
  onRemove: (key: InventoryFilterKey) => void;
  className?: string;
}) {
  if (!chips.length) return null;

  return (
    <ul className={className} aria-label="Selected inventory filters">
      {chips.map((chip) => (
        <li key={chip.key} className="shrink-0">
          <Badge
            variant="secondary"
            className="h-8 gap-1.5 rounded-md border border-border bg-muted/60 pr-1 pl-2.5 text-xs font-medium text-foreground"
          >
            <span>{chip.label}</span>
            <button
              type="button"
              onClick={() => onRemove(chip.key)}
              className="inline-flex size-6 cursor-pointer items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`Remove ${chip.label} filter`}
            >
              <X className="size-3.5" />
            </button>
          </Badge>
        </li>
      ))}
    </ul>
  );
}
