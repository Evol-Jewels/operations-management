import { format, subMonths } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import type {
  StockSalesAnalyticsQuery,
  StockSalesAnalyticsRange,
  StockSalesMoneyValue,
} from "@/types/stock-sales-api";

export type SalesAnalyticsView =
  | StockSalesAnalyticsRange
  | "month"
  | "year"
  | "allTime";

const SALES_ANALYTICS_VIEWS = new Set<SalesAnalyticsView>([
  "month",
  "year",
  "30",
  "90",
  "360",
  "thisYear",
  "allTime",
]);

const RANGE_LABELS: Record<StockSalesAnalyticsRange, string> = {
  "30": "Last month",
  "90": "Last 3 months",
  "360": "Last 360 days",
  thisYear: "This year",
};

export function getCurrentSaleMonth() {
  return format(new Date(), "yyyy-MM");
}

function getCurrentSaleMonthParts() {
  const [year, month] = getCurrentSaleMonth().split("-");
  return { month, year };
}

export function getSaleYearOptions(selectedYear: string) {
  const currentYear = new Date().getFullYear();
  const years = new Set<string>([String(currentYear + 1), selectedYear]);

  for (let year = currentYear; year >= currentYear - 4; year -= 1) {
    years.add(String(year));
  }

  return Array.from(years).sort((a, b) => Number(b) - Number(a));
}

export function getSaleMonthFromSearchParams(searchParams: URLSearchParams) {
  const current = getCurrentSaleMonthParts();
  const queryMonth = searchParams.get("month")?.trim() || current.month;
  const queryYear = searchParams.get("year")?.trim() || current.year;
  const month = /^(0[1-9]|1[0-2])$/.test(queryMonth)
    ? queryMonth
    : current.month;
  const year = /^\d{4}$/.test(queryYear) ? queryYear : current.year;

  return { month, year, saleMonth: `${year}-${month}` };
}

export function getSalesAnalyticsView(
  searchParams: URLSearchParams,
): SalesAnalyticsView {
  const view = searchParams.get("salesRange");
  if (view === "thisYear") return "year";

  return SALES_ANALYTICS_VIEWS.has(view as SalesAnalyticsView)
    ? (view as SalesAnalyticsView)
    : "month";
}

export function getSalesAnalyticsQuery(
  view: SalesAnalyticsView,
  { saleMonth, year }: { saleMonth: string; year: string },
): StockSalesAnalyticsQuery {
  if (view === "month") return { period: "month", saleMonth };
  if (view === "year") {
    return year === getCurrentSaleMonthParts().year
      ? { range: "thisYear" }
      : { period: "year", saleYear: year };
  }
  if (view === "allTime") return { period: "allTime" };
  if (view === "30") {
    return {
      period: "month",
      saleMonth: format(subMonths(new Date(), 1), "yyyy-MM"),
    };
  }

  return { range: view };
}

export function formatSaleMonthLabel(saleMonth: string) {
  const [year, month] = saleMonth.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);

  if (Number.isNaN(date.getTime())) return saleMonth;

  return format(date, "MMMM yyyy");
}

export function getSalesAnalyticsViewLabel(
  view: SalesAnalyticsView,
  saleMonth: string,
) {
  if (view === "month") return formatSaleMonthLabel(saleMonth);
  if (view === "year") return saleMonth.slice(0, 4);
  if (view === "allTime") return "All time";

  return RANGE_LABELS[view];
}

export function formatSalesPeriodLabel(period: string) {
  if (/^last 90 days$/i.test(period)) return "Last 3 months";
  return /^\d{4}-\d{2}$/.test(period) ? formatSaleMonthLabel(period) : period;
}

export function formatSalesCurrency(value: StockSalesMoneyValue) {
  return formatCurrency(Number(value) || 0);
}

export function getTargetProgress(
  revenue: StockSalesMoneyValue,
  target: StockSalesMoneyValue | null | undefined,
) {
  const targetValue = Number(target) || 0;
  if (target == null || targetValue <= 0) return null;

  const revenueValue = Number(revenue) || 0;
  const percent = Math.max(0, Math.round((revenueValue / targetValue) * 100));

  return {
    percent,
    fill: Math.min(percent, 100),
    remaining: Math.max(0, targetValue - revenueValue),
    exceededBy: Math.max(0, revenueValue - targetValue),
  };
}

export type TargetProgress = NonNullable<ReturnType<typeof getTargetProgress>>;
