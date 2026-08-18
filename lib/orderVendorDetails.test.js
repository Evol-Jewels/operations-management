import { describe, expect, test } from "bun:test";
import { shouldPromptForVendorDetails } from "./orderVendorDetails";

describe("shouldPromptForVendorDetails", () => {
  test.each([
    "IN_PRODUCTION",
    "CAD_DESIGN",
    "IN_TRANSIT",
    "CERTIFICATION",
    "AT_STORE",
    "DELIVERED",
  ])("prompts when a new order moves to %s", (nextStatus) => {
    expect(shouldPromptForVendorDetails("NEW", nextStatus)).toBe(true);
  });

  test.each(["CLOSED", "CANCELLED"])(
    "does not prompt when a new order moves to %s",
    (nextStatus) => {
      expect(shouldPromptForVendorDetails("NEW", nextStatus)).toBe(false);
    },
  );

  test("does not prompt for changes from an order already in progress", () => {
    expect(
      shouldPromptForVendorDetails("IN_PRODUCTION", "CERTIFICATION"),
    ).toBe(false);
  });
});
