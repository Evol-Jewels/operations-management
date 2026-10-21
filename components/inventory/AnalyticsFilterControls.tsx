"use client";
import { useId } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VendorFilterSelect } from "@/components/vendors/VendorFilterSelect";
import type { Vendor, VendorFilter } from "@/lib/vendors";
import type { ProductColor } from "@/types/inventory-api";
export type ColorFilter = "ALL" | ProductColor;
export type PurityFilter = "ALL" | "9" | "14" | "18" | "22" | "24";
export type LocationFilter = "ALL" | string;

export const COLOR_LABELS: Record<ProductColor, string> = {
  YELLOW: "Yellow",
  ROSE: "Rose",
  WHITE: "White",
  OTHERS: "Others",
};

export const PURITY_LABELS: Record<Exclude<PurityFilter, "ALL">, string> = {
  "9": "9K",
  "14": "14K",
  "18": "18K",
  "22": "22K",
  "24": "24K",
};

export function AnalyticsFilterControls({
  color,
  location,
  locations,
  locationsLoading,
  locationLabel = "Location",
  purity,
  vendor,
  vendors = [],
  vendorsLoading,
  onFilterChange,
}: {
  color: ColorFilter;
  location: LocationFilter;
  locations: { id: string; name: string; city?: string }[];
  locationLabel?: string;
  locationsLoading: boolean;
  purity: PurityFilter;
  /** Shows the vendor filter when set. */
  vendor?: VendorFilter;
  vendors?: Vendor[];
  vendorsLoading?: boolean;
  onFilterChange: (
    key: "color" | "locationId" | "purity" | "vendorId",
    value: string,
  ) => void;
}) {
  const id = useId();
  return (
    <div className="grid w-full grid-cols-2 gap-3">
      <div className="min-w-0 space-y-1.5">
        <Label htmlFor={`${id}-purity`}>Purity</Label>
        <Select
          value={purity}
          onValueChange={(value) =>
            onFilterChange("purity", value as PurityFilter)
          }
        >
          <SelectTrigger className="w-full" id={`${id}-purity`}>
            <SelectValue placeholder="Purity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All purities</SelectItem>
            {(
              Object.keys(PURITY_LABELS) as Array<Exclude<PurityFilter, "ALL">>
            ).map((purityValue) => (
              <SelectItem key={purityValue} value={purityValue}>
                {PURITY_LABELS[purityValue]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="min-w-0 space-y-1.5">
        <Label htmlFor={`${id}-color`}>Color</Label>
        <Select
          value={color}
          onValueChange={(value) =>
            onFilterChange("color", value as ColorFilter)
          }
        >
          <SelectTrigger className="w-full" id={`${id}-color`}>
            <SelectValue placeholder="Color" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All colors</SelectItem>
            {(Object.keys(COLOR_LABELS) as ProductColor[]).map((colorValue) => (
              <SelectItem key={colorValue} value={colorValue}>
                {COLOR_LABELS[colorValue]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="col-span-2 min-w-0 space-y-1.5">
        <Label htmlFor={`${id}-location`}>{locationLabel}</Label>
        <Select
          value={location}
          onValueChange={(value) =>
            onFilterChange("locationId", value as LocationFilter)
          }
          disabled={locationsLoading}
        >
          <SelectTrigger className="w-full" id={`${id}-location`}>
            <SelectValue placeholder="Location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All locations</SelectItem>
            {locations.map((locationValue) => (
              <SelectItem key={locationValue.id} value={locationValue.id}>
                {locationValue.name}
                {locationValue.city ? `, ${locationValue.city}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {vendor !== undefined && (
        <div className="col-span-2 min-w-0 space-y-1.5">
          <Label htmlFor={`${id}-vendor`}>Vendor</Label>
          <VendorFilterSelect
            id={`${id}-vendor`}
            value={vendor}
            vendors={vendors}
            isLoading={vendorsLoading}
            onChange={(value) => onFilterChange("vendorId", value)}
            className="h-9"
          />
        </div>
      )}
    </div>
  );
}
