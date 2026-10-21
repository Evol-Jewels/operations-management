import type { RecentProductSalesQuery } from "@/types/stock-sales-api";

export type RecentSalesInventory = "ALL" | "FOUND" | "NOT_FOUND";

export interface RecentSalesFilters {
  vendorId: string;
  monthFrom: string;
  monthTo: string;
  locationId: string;
  salesPersonId: string;
  category: string;
  purity: string;
  color: string;
  inventory: RecentSalesInventory;
  priceFrom: string;
  priceTo: string;
}

export const RECENT_SALES_CATEGORIES = [
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
export const RECENT_SALES_PURITIES = ["9", "14", "18", "22", "24"] as const;
export const RECENT_SALES_COLORS = [
  "YELLOW",
  "ROSE",
  "WHITE",
  "OTHERS",
] as const;

/** URL search param for each filter, prefixed so other workspace tabs keep theirs. */
export const RECENT_SALES_PARAMS: Record<keyof RecentSalesFilters, string> = {
  vendorId: "saleVendor",
  monthFrom: "saleFrom",
  monthTo: "saleTo",
  locationId: "saleLocation",
  salesPersonId: "saleSeller",
  category: "saleCategory",
  purity: "salePurity",
  color: "saleColor",
  inventory: "saleInventory",
  priceFrom: "salePriceMin",
  priceTo: "salePriceMax",
};

export const EMPTY_RECENT_SALES_FILTERS: RecentSalesFilters = {
  vendorId: "ALL",
  monthFrom: "",
  monthTo: "",
  locationId: "ALL",
  salesPersonId: "ALL",
  category: "ALL",
  purity: "ALL",
  color: "ALL",
  inventory: "ALL",
  priceFrom: "",
  priceTo: "",
};

const MONTH_PATTERN = /^[1-9]\d{3}-(0[1-9]|1[0-2])$/;

function oneOf(value: string | null, options: readonly string[]) {
  return value && options.includes(value) ? value : "ALL";
}

function amount(value: string | null) {
  return value && Number.isFinite(Number(value)) && Number(value) >= 0
    ? value
    : "";
}

export function getRecentSalesFilters(
  params: URLSearchParams,
): RecentSalesFilters {
  const get = (key: keyof RecentSalesFilters) =>
    params.get(RECENT_SALES_PARAMS[key]);
  const month = (key: "monthFrom" | "monthTo") => {
    const value = get(key);
    return value && MONTH_PATTERN.test(value) ? value : "";
  };
  const inventory = get("inventory");

  return {
    vendorId: get("vendorId") || "ALL",
    monthFrom: month("monthFrom"),
    monthTo: month("monthTo"),
    locationId: get("locationId") || "ALL",
    salesPersonId: get("salesPersonId") || "ALL",
    category: oneOf(get("category"), RECENT_SALES_CATEGORIES),
    purity: oneOf(get("purity"), RECENT_SALES_PURITIES),
    color: oneOf(get("color"), RECENT_SALES_COLORS),
    inventory:
      inventory === "FOUND" || inventory === "NOT_FOUND" ? inventory : "ALL",
    priceFrom: amount(get("priceFrom")),
    priceTo: amount(get("priceTo")),
  };
}

/** URL changes for `replaceWorkspaceUrl`; defaults remove the param. */
export function getRecentSalesUrlChanges(
  changes: Partial<RecentSalesFilters>,
): Record<string, string | null> {
  return Object.fromEntries(
    Object.entries(changes).map(([key, value]) => [
      RECENT_SALES_PARAMS[key as keyof RecentSalesFilters],
      value && value !== "ALL" ? value : null,
    ]),
  );
}

export function getRecentSalesRangeError(filters: RecentSalesFilters) {
  if (
    filters.monthFrom &&
    filters.monthTo &&
    filters.monthFrom > filters.monthTo
  )
    return "Start month must be on or before the end month.";
  if (
    filters.priceFrom &&
    filters.priceTo &&
    Number(filters.priceFrom) > Number(filters.priceTo)
  )
    return "Minimum price cannot be more than the maximum price.";
  return null;
}

export function toRecentProductSalesQuery(
  filters: RecentSalesFilters,
  search: string,
): RecentProductSalesQuery {
  const selected = (value: string) => (value === "ALL" ? undefined : value);
  return {
    search: search || undefined,
    vendorId: selected(filters.vendorId),
    monthFrom: filters.monthFrom || undefined,
    monthTo: filters.monthTo || undefined,
    locationId: selected(filters.locationId),
    salesPersonId: selected(filters.salesPersonId),
    category: selected(filters.category),
    purity: filters.purity === "ALL" ? undefined : Number(filters.purity),
    color: selected(filters.color),
    inventory: filters.inventory === "ALL" ? undefined : filters.inventory,
    priceFrom: filters.priceFrom ? Number(filters.priceFrom) : undefined,
    priceTo: filters.priceTo ? Number(filters.priceTo) : undefined,
  };
}

/** Filters inside the "More filters" popover (vendor and months have their own controls). */
export function countMoreRecentSalesFilters(filters: RecentSalesFilters) {
  return [
    filters.locationId !== "ALL",
    filters.salesPersonId !== "ALL",
    filters.category !== "ALL",
    filters.purity !== "ALL",
    filters.color !== "ALL",
    filters.inventory !== "ALL",
    Boolean(filters.priceFrom || filters.priceTo),
  ].filter(Boolean).length;
}

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function formatSaleMonth(value: string) {
  return `${MONTH_LABELS[Number(value.slice(5, 7)) - 1]} ${value.slice(0, 4)}`;
}

export function getSaleMonthRangeLabel(from: string, to: string) {
  if (from && to)
    return from === to
      ? formatSaleMonth(from)
      : `${formatSaleMonth(from)} – ${formatSaleMonth(to)}`;
  if (from) return `From ${formatSaleMonth(from)}`;
  if (to) return `Until ${formatSaleMonth(to)}`;
  return "All months";
}

/** "YYYY-MM" for the month `monthsAgo` months before `today`. */
export function shiftMonth(today: Date, monthsAgo: number) {
  const date = new Date(today.getFullYear(), today.getMonth() - monthsAgo, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function hasRecentSalesFilters(filters: RecentSalesFilters) {
  return (Object.keys(filters) as Array<keyof RecentSalesFilters>).some(
    (key) => filters[key] !== EMPTY_RECENT_SALES_FILTERS[key],
  );
}
