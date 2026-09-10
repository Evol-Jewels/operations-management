"use client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  purity,
  onFilterChange,
}: {
  color: ColorFilter;
  location: LocationFilter;
  locations: { id: string; name: string; city: string }[];
  locationsLoading: boolean;
  purity: PurityFilter;
  onFilterChange: (
    key: "color" | "locationId" | "purity",
    value: ColorFilter | LocationFilter | PurityFilter,
  ) => void;
}) {
  return (
    <div className="grid w-full gap-2 sm:grid-cols-2 lg:grid-cols-3">
      <Select
        value={purity}
        onValueChange={(value) =>
          onFilterChange("purity", value as PurityFilter)
        }
      >
        <SelectTrigger className="h-10 w-full" aria-label="Purity">
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
      <Select
        value={location}
        onValueChange={(value) =>
          onFilterChange("locationId", value as LocationFilter)
        }
        disabled={locationsLoading}
      >
        <SelectTrigger className="h-10 w-full" aria-label="Location">
          <SelectValue placeholder="Location" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All locations</SelectItem>
          {locations.map((locationValue) => (
            <SelectItem key={locationValue.id} value={locationValue.id}>
              {locationValue.name}, {locationValue.city}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={color}
        onValueChange={(value) => onFilterChange("color", value as ColorFilter)}
      >
        <SelectTrigger className="h-10 w-full" aria-label="Color">
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
  );
}
