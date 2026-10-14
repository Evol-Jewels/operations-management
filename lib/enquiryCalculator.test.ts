import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT_CALCULATOR_SETTINGS as settings } from "./calculator/constants";
import {
  buildEnquiryCalculatorForm,
  enquiryCalculatorToEstimation,
} from "./enquiryCalculator";
import type { ProductEstimation } from "@/types";

const estimation: ProductEstimation = {
  id: "estimate-1",
  productId: "item-1",
  metalType: "Silver",
  purity: "925",
  metalWeight: 4.125,
  stoneDetails: [
    {
      id: "stone-1",
      type: "Custom rose cut",
      netWeight: 0.125,
      pieces: 2,
      pricePerCarat: 250,
    },
  ],
  makingCost: 0,
  finalAmount: 0,
  createdAt: "2026-10-01T00:00:00Z",
  notes: "Internal note",
};

function initialForm() {
  return buildEnquiryCalculatorForm({
    settings,
    productId: "item-1",
    productName: "Ring",
    metalType: "Gold",
    purity: "18K",
    estimation,
  });
}

test("calculator edit and save preserve enquiry identity, non-gold purity, custom stone rates, and zero making", () => {
  const form = initialForm();
  assert.equal(form.metals?.[0].metalTypeId, "silver");
  assert.equal(form.metals?.[0].purityId, "925");
  assert.equal(form.makingCharge, 0);
  assert.equal(form.stones[0].fixedRatePerCarat, 250);
  assert.equal(form.productNote, "");
  const saved = enquiryCalculatorToEstimation({
    form,
    settings,
    productId: "item-1",
    estimation,
    notes: estimation.notes,
  });
  assert.equal(saved.id, estimation.id);
  assert.equal(saved.createdAt, estimation.createdAt);
  assert.equal(saved.metalType, estimation.metalType);
  assert.equal(saved.purity, estimation.purity);
  assert.equal(saved.metalWeight, estimation.metalWeight);
  assert.equal(saved.makingCost, 0);
  assert.deepEqual(saved.stoneDetails, estimation.stoneDetails);
  assert.equal(saved.notes, estimation.notes);
  assert.equal(saved.gstRate, undefined);
});

test("slab-priced stones store their rate but stay auto, and GST overrides round-trip", () => {
  const form = buildEnquiryCalculatorForm({
    settings,
    productId: "item-1",
    productName: "Ring",
    metalType: "Gold",
    purity: "18K",
    estimation: {
      ...estimation,
      stoneDetails: [{ id: "round", type: "Round", netWeight: 0.6, pieces: 3 }],
      gstRate: 0.05,
    },
  });
  assert.equal(form.gstRate, 0.05);
  const saved = enquiryCalculatorToEstimation({
    form,
    settings,
    productId: "item-1",
  });
  const slabRate = saved.stoneDetails[0].pricePerCarat;
  assert.ok(slabRate !== undefined && slabRate > 0);
  assert.equal(saved.gstRate, 0.05);
  const rebuilt = buildEnquiryCalculatorForm({
    settings,
    productId: "item-1",
    productName: "Ring",
    metalType: "Gold",
    purity: "18K",
    estimation: saved,
  });
  assert.equal(rebuilt.stones[0].fixedRatePerCarat, undefined);
  assert.equal(rebuilt.gstRate, 0.05);
});

test("save rejects multiple metals and metal rate overrides", () => {
  const form = initialForm();
  for (const unsupported of [
    {
      ...form,
      metals: [
        ...(form.metals ?? []),
        { id: "extra", metalTypeId: "gold", purityId: "18K", weight: 1 },
      ],
    },
    {
      ...form,
      metals: form.metals?.map((metal) => ({ ...metal, rateOverride: 100 })),
    },
  ]) {
    assert.throws(
      () =>
        enquiryCalculatorToEstimation({
          form: unsupported,
          settings,
          productId: "item-1",
        }),
      /one metal at the configured rate/,
    );
  }
});
