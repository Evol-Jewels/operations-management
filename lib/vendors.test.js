import { describe, expect, test } from "bun:test";
import { findOrderVendor } from "./vendors";

const vendors = [
  {
    vendorId: "one",
    name: "Renamed Jewels",
    email: "one@example.com, two@example.com",
  },
  { vendorId: "two", name: "Original Jewels", email: null },
];

describe("order vendor lookup", () => {
  test("uses identity after a rename, even when another vendor has the old name", () => {
    expect(findOrderVendor(vendors, "one", "Original Jewels")?.email).toBe(
      "one@example.com, two@example.com",
    );
  });
  test("matches legacy free text without case or surrounding whitespace", () => {
    expect(
      findOrderVendor(vendors, null, "  ORIGINAL JEWELS  ")?.vendorId,
    ).toBe("two");
  });
  test("does not substitute a different vendor for an unavailable ID", () => {
    expect(
      findOrderVendor(vendors, "missing", "Original Jewels"),
    ).toBeUndefined();
  });
  test("custom or blank names have no saved email", () => {
    expect(findOrderVendor(vendors, null, "Custom workshop")).toBeUndefined();
    expect(findOrderVendor(vendors, null, "")).toBeUndefined();
    expect(findOrderVendor(vendors, "two")?.email).toBeNull();
  });
});
