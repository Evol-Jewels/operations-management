import { describe, expect, test } from "bun:test";
import {
  EMPTY_RECENT_SALES_FILTERS,
  getRecentSalesFilters,
  getRecentSalesRangeError,
  getRecentSalesUrlChanges,
  getSaleMonthRangeLabel,
  hasRecentSalesFilters,
  shiftMonth,
  toRecentProductSalesQuery,
} from "./recentSalesFilters";

describe("recent sales filters", () => {
  test("reads valid filters from the URL and drops invalid ones", () => {
    const filters = getRecentSalesFilters(
      new URLSearchParams(
        "saleVendor=unlinked&saleFrom=2026-07&saleTo=2026-13&salePurity=18&saleColor=BLUE&saleInventory=FOUND&salePriceMin=-5&salePriceMax=50000",
      ),
    );
    expect(filters).toEqual({
      ...EMPTY_RECENT_SALES_FILTERS,
      vendorId: "unlinked",
      monthFrom: "2026-07",
      purity: "18",
      inventory: "FOUND",
      priceTo: "50000",
    });
    expect(hasRecentSalesFilters(filters)).toBe(true);
    expect(hasRecentSalesFilters(EMPTY_RECENT_SALES_FILTERS)).toBe(false);
  });

  test("clears URL params for default values", () => {
    expect(
      getRecentSalesUrlChanges({ vendorId: "ALL", monthFrom: "2026-01" }),
    ).toEqual({ saleVendor: null, saleFrom: "2026-01" });
  });

  test("builds the API query with only selected filters", () => {
    expect(
      toRecentProductSalesQuery(
        { ...EMPTY_RECENT_SALES_FILTERS, vendorId: "v-1", purity: "14" },
        "ring",
      ),
    ).toEqual({
      search: "ring",
      vendorId: "v-1",
      monthFrom: undefined,
      monthTo: undefined,
      locationId: undefined,
      salesPersonId: undefined,
      category: undefined,
      purity: 14,
      color: undefined,
      inventory: undefined,
      priceFrom: undefined,
      priceTo: undefined,
    });
  });

  test("flags reversed month and price ranges", () => {
    expect(
      getRecentSalesRangeError({
        ...EMPTY_RECENT_SALES_FILTERS,
        monthFrom: "2026-09",
        monthTo: "2026-08",
      }),
    ).not.toBeNull();
    expect(
      getRecentSalesRangeError({
        ...EMPTY_RECENT_SALES_FILTERS,
        priceFrom: "900",
        priceTo: "100",
      }),
    ).not.toBeNull();
    expect(getRecentSalesRangeError(EMPTY_RECENT_SALES_FILTERS)).toBeNull();
  });

  test("labels month ranges and shifts across years", () => {
    expect(getSaleMonthRangeLabel("2026-08", "2026-10")).toBe(
      "Aug 2026 – Oct 2026",
    );
    expect(getSaleMonthRangeLabel("2026-08", "2026-08")).toBe("Aug 2026");
    expect(getSaleMonthRangeLabel("", "")).toBe("All months");
    expect(shiftMonth(new Date(2026, 1, 15), 2)).toBe("2025-12");
  });
});
