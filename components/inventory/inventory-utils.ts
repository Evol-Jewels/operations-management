import type { VendorFilter } from "@/lib/vendors";
import type { InventoryProduct, ProductColor } from "@/types/inventory-api";

export type InventoryCategory =
  | "RING"
  | "NECKLACE"
  | "EARRING"
  | "BRACELET"
  | "PENDANT"
  | "BANGLE"
  | "ANKLET"
  | "ACCESSORY"
  | "CHAIN"
  | "OTHER";
export type SourceFilter = "ALL" | "CUSTOMER" | "STOCK";
export type ColorFilter = "ALL" | ProductColor;
export type PurityFilter = "ALL" | "9" | "14" | "18" | "22" | "24";

export type InventoryFilters = {
  category: InventoryCategory | "ALL";
  color: ColorFilter;
  purity: PurityFilter;
  source: SourceFilter;
  location: string;
  vendor: VendorFilter;
  netWeightFrom: string;
  netWeightTo: string;
  priceFrom: string;
  priceTo: string;
  sourceCreatedFrom: string;
  sourceCreatedTo: string;
};
export type InventoryFilterKey = keyof InventoryFilters;

export const CATEGORY_VALUES: readonly InventoryCategory[] = [
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
] as const;

export const CATEGORY_LABELS: Record<InventoryCategory, string> = {
  RING: "Ring",
  NECKLACE: "Necklace",
  EARRING: "Earring",
  BRACELET: "Bracelet",
  PENDANT: "Pendant",
  BANGLE: "Bangle",
  ANKLET: "Anklet",
  ACCESSORY: "Accessory",
  CHAIN: "Chain",
  OTHER: "Other",
};

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

export const SEARCH_PARAM_KEY = "q";

export const FILTER_PARAM_KEYS: Record<InventoryFilterKey, string> = {
  category: "category",
  color: "color",
  purity: "purity",
  source: "source",
  location: "locationId",
  vendor: "vendorId",
  netWeightFrom: "netWeightFrom",
  netWeightTo: "netWeightTo",
  priceFrom: "priceFrom",
  priceTo: "priceTo",
  sourceCreatedFrom: "sourceCreatedFrom",
  sourceCreatedTo: "sourceCreatedTo",
};

export const FILTER_KEYS = Object.keys(
  FILTER_PARAM_KEYS,
) as InventoryFilterKey[];

export const EMPTY_FILTERS: InventoryFilters = {
  category: "ALL",
  color: "ALL",
  purity: "ALL",
  source: "ALL",
  location: "ALL",
  vendor: "ALL",
  netWeightFrom: "",
  netWeightTo: "",
  priceFrom: "",
  priceTo: "",
  sourceCreatedFrom: "",
  sourceCreatedTo: "",
};

export function isFilterActive(value: string) {
  return Boolean(value) && value !== "ALL";
}

function pickOption<T extends string>(
  value: string | null,
  options: readonly string[],
): T | "ALL" {
  return value && options.includes(value) ? (value as T) : "ALL";
}

export function readFiltersFromParams(
  params: URLSearchParams,
): InventoryFilters {
  const read = (key: InventoryFilterKey) =>
    params.get(FILTER_PARAM_KEYS[key]) ?? "";

  return {
    category: pickOption<InventoryCategory>(read("category"), CATEGORY_VALUES),
    color: pickOption<ProductColor>(read("color"), Object.keys(COLOR_LABELS)),
    purity: pickOption<Exclude<PurityFilter, "ALL">>(
      read("purity"),
      Object.keys(PURITY_LABELS),
    ),
    source: pickOption<"CUSTOMER" | "STOCK">(read("source"), [
      "CUSTOMER",
      "STOCK",
    ]),
    location: read("location") || "ALL",
    vendor: read("vendor") || "ALL",
    netWeightFrom: read("netWeightFrom"),
    netWeightTo: read("netWeightTo"),
    priceFrom: read("priceFrom"),
    priceTo: read("priceTo"),
    sourceCreatedFrom: read("sourceCreatedFrom"),
    sourceCreatedTo: read("sourceCreatedTo"),
  };
}

export function formatWeight(value: string | number, unit: string) {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return `- ${unit}`;
  return `${numeric.toFixed(2)} ${unit}`;
}

export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong";
}

export function getColorLabel(product: InventoryProduct) {
  return COLOR_LABELS[product.color as ProductColor] ?? product.color;
}

export function getMetalLabel(product: InventoryProduct) {
  const color = product.color.trim().toLowerCase();
  const metalColor = color.includes("rose")
    ? "Rose Gold"
    : color.includes("white")
      ? "White Gold"
      : color.includes("yellow") || color === "gold"
        ? "Yellow Gold"
        : product.color;

  return `${metalColor} ${product.purity}K`;
}

export function getTotalStonePieces(product: InventoryProduct) {
  return (product.stones ?? []).reduce((sum, stone) => sum + stone.pieces, 0);
}

export function getTotalStoneCarat(product: InventoryProduct) {
  const totalStoneWeight = Number(product.totalStoneWeight);
  if (Number.isFinite(totalStoneWeight) && totalStoneWeight > 0) {
    return totalStoneWeight;
  }

  return (product.stones ?? []).reduce(
    (sum, stone) => sum + (Number(stone.netWeight) || 0),
    0,
  );
}
