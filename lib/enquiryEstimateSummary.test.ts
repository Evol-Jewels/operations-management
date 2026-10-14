import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { EstimationSummaryCard } from "@/components/calculator/EstimationSummaryCard";
import { DEFAULT_CALCULATOR_SETTINGS as settings } from "./calculator/constants";
import { computeEstimateFromInputs } from "./calculator/pricing";
import { computeEnquiryEstimate } from "./enquiryEstimation";
import { createEnquiryEstimateSummary } from "./enquiryEstimateSummary";
import type { ProductEstimation } from "@/types";

const estimation: ProductEstimation = {
  id: "estimate-1",
  productId: "product-1",
  metalType: "Gold",
  purity: "18K",
  metalWeight: 3.125,
  stoneDetails: [{ id: "stone-1", type: "Round", netWeight: 0.2, pieces: 2 }],
  makingCost: 1500,
  finalAmount: 0,
  createdAt: "2026-10-01T00:00:00Z",
  vendorName: "Private vendor",
  notes: "Internal negotiation notes",
};

function summaryFor(value = estimation) {
  return createEnquiryEstimateSummary({
    estimation: value,
    settings,
    productName: "Custom ring",
    imageUrls: [],
    reference: "Enquiry #123",
    itemLabel: "Item 2",
    recalculatedAt: "2026-10-14T00:00:00Z",
  });
}

test("enquiry summary uses the same rates and GST as calculator inputs", () => {
  const calculator = computeEstimateFromInputs(
    settings,
    3.125,
    "Other",
    [
      {
        id: "stone-1",
        stoneTypeId: settings.stoneTypes[0].stoneId,
        weight: 0.2,
        quantity: 2,
      },
    ],
    {
      makingCostOverride: 1500,
      metals: [
        {
          id: estimation.id,
          metalTypeId: "gold",
          purityId: "18K",
          weight: 3.125,
        },
      ],
    },
  );
  const { summary, unpricedItems } = summaryFor();
  assert.deepEqual(unpricedItems, []);
  assert.equal(summary.goldCost, calculator.goldCost);
  assert.equal(summary.totalStoneCost, calculator.totalStoneCost);
  assert.equal(summary.gst, calculator.gst);
  assert.equal(summary.total, calculator.total);
});

test("customer breakup omits repeated metadata and private fields", () => {
  const { summary } = summaryFor();
  const html = renderToStaticMarkup(
    createElement(EstimationSummaryCard, {
      data: { kind: "summary", summary },
    }),
  );
  assert.equal(summary.documentDetails?.reference, "Enquiry #123");
  assert.equal(summary.documentDetails?.estimatedOn, "1 Oct 2026");
  assert.equal(summary.documentDetails?.recalculatedOn, "14 Oct 2026");
  for (const content of ["GST", "Terms &amp; Conditions"]) {
    assert.ok(html.includes(content), content);
  }
  assert.ok(!html.includes(estimation.vendorName ?? "Private vendor"));
  assert.ok(!html.includes(estimation.notes ?? "Internal negotiation notes"));
  assert.ok(!html.includes("Enquiry #123"));
  assert.ok(!html.includes("Estimated on"));
  assert.ok(!html.includes("Recalculated on"));
  assert.equal(summary.note, "");
});

test("stone-only estimates retain their priced stone lines and total", () => {
  const { summary, unpricedItems } = summaryFor({
    ...estimation,
    metalWeight: 0,
    makingCost: 0,
  });
  assert.deepEqual(unpricedItems, []);
  assert.equal(summary.goldCost, 0);
  assert.ok(summary.totalStoneCost > 0);
  assert.equal(summary.total, summary.totalStoneCost * (1 + settings.gstRate));
});

test("unknown stones and uncovered slabs are flagged before customer sharing", () => {
  for (const stone of [
    { id: "unknown", type: "Custom rose cut", netWeight: 1, pieces: 1 },
    { id: "uncovered", type: "Round", netWeight: 100, pieces: 1 },
    { id: "invalid", type: "Round", netWeight: 0.2, pieces: 0 },
  ]) {
    const result = summaryFor({ ...estimation, stoneDetails: [stone] });
    assert.deepEqual(result.unpricedItems, [stone.type]);
    assert.equal(result.summary.stoneDetails[0].sourceStoneName, stone.type);
  }
});

test("a configured zero-price slab is priced, unlike a missing slab", () => {
  const zeroPriceSettings = {
    ...settings,
    stoneTypes: settings.stoneTypes.map((stone) => ({
      ...stone,
      slabs: stone.slabs.map((slab) => ({ ...slab, pricePerCarat: 0 })),
    })),
  };
  const result = computeEnquiryEstimate(estimation, zeroPriceSettings);
  assert.deepEqual(result.unpricedItems, []);
  assert.equal(result.pricing.totalStoneCost, 0);
});

test("non-gold metals resolve by name or ID, and missing rates are flagged", () => {
  const silver = {
    ...estimation,
    metalType: "silver",
    purity: "925",
    stoneDetails: [],
  };
  const silverSettings = {
    ...settings,
    metalTypes: settings.metalTypes.map((metal) =>
      metal.id === "silver"
        ? {
            ...metal,
            purities: metal.purities.map((purity) => ({
              ...purity,
              ratePerGram: 150,
            })),
          }
        : metal,
    ),
  };
  const result = computeEnquiryEstimate(silver, silverSettings);
  assert.deepEqual(result.unpricedItems, []);
  assert.equal(result.pricing.metalDetails?.[0].metalName, "Silver");
  assert.deepEqual(
    computeEnquiryEstimate({ ...silver, metalType: "Unknown" }, settings)
      .unpricedItems,
    ["Unknown 925"],
  );
});
