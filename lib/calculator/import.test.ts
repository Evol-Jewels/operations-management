import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT_CALCULATOR_SETTINGS as settings } from "./constants";
import { consumeCalculatorImport, queueCalculatorImport } from "./import";
import { buildEnquiryCalculatorForm } from "@/lib/enquiryCalculator";

test("calculator navigation hands off the saved form once and preserves zero making", () => {
  const values = new Map<string, string>();
  const storage = {
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    getItem: (key: string) => values.get(key) ?? null,
    removeItem: (key: string) => {
      values.delete(key);
    },
  };
  const form = buildEnquiryCalculatorForm({
    settings,
    productId: "item-18",
    productName: "Bracelet",
    metalType: "Gold",
    purity: "18K",
    imageUrls: ["/evol-logo.webp"],
    estimation: {
      id: "estimate",
      productId: "item-18",
      metalType: "Gold",
      purity: "9K",
      metalWeight: 3.2,
      stoneDetails: [{ id: "stone", type: "Round", netWeight: 0.6, pieces: 3 }],
      makingCost: 0,
      finalAmount: 0,
      createdAt: "2026-10-14",
      notes: "Private note",
      vendorName: "Private vendor",
    },
  });
  const url = new URL(
    queueCalculatorImport(form, false, storage),
    "http://localhost:4000",
  );
  assert.equal(url.pathname, "/calculator");
  assert.equal(url.searchParams.get("tab"), "calculate");
  const token = url.searchParams.get("import");
  assert.ok(token);
  const payload = consumeCalculatorImport(token, storage);
  assert.ok(payload);
  assert.deepEqual(JSON.parse(payload), {
    form: JSON.parse(JSON.stringify(form)),
    isGstEdited: false,
    isMakingChargeEdited: true,
  });
  assert.ok(!payload.includes("Private note"));
  assert.ok(!payload.includes("Private vendor"));
  assert.equal(consumeCalculatorImport(token, storage), null);
  assert.equal(values.size, 0);
});
