import assert from "node:assert/strict";
import { test } from "node:test";
import type { AssistantEstimateCard } from "@/types/assistant";
import {
  assistantEstimateImageUrls,
  assistantEstimateToEstimation,
} from "./assistantEstimate";
import { DEFAULT_CALCULATOR_SETTINGS as settings } from "./calculator/constants";
import { buildEnquiryCalculatorForm } from "./enquiryCalculator";
import { createEnquiryEstimateSummary } from "./enquiryEstimateSummary";

const card: AssistantEstimateCard = {
  type: "estimate",
  title: "Solitaire ring",
  estimatedAt: "2026-10-21T10:00:00.000Z",
  imageUrls: ["https://example.com/ring.jpg"],
  metal: { type: "Gold", purity: "18K", netWeight: 4 },
  stones: [{ stoneType: "Round", weight: 0.2, pieces: 2 }],
  total: 0,
};

test("assistant estimates are priced with the calculator's rates", () => {
  const estimation = assistantEstimateToEstimation(card);
  const { summary, unpricedItems } = createEnquiryEstimateSummary({
    estimation,
    settings,
    productName: card.title,
    imageUrls: card.imageUrls,
    reference: "Assistant estimate",
    itemLabel: card.title,
  });
  assert.deepEqual(unpricedItems, []);
  assert.equal(summary.name, "Solitaire ring");
  assert.equal(summary.imageUrl, "https://example.com/ring.jpg");
  assert.ok(summary.goldCost > 0);
  assert.ok(summary.totalStoneCost > 0);
  assert.equal(summary.gstRate, settings.gstRate);
});

test("overrides carry into the calculator form", () => {
  const estimation = assistantEstimateToEstimation({
    ...card,
    makingCost: 2500,
    gstPercent: 5,
  });
  assert.equal(estimation.gstRate, 0.05);
  const form = buildEnquiryCalculatorForm({
    settings,
    productId: estimation.id,
    productName: card.title,
    metalType: card.metal.type,
    purity: card.metal.purity,
    imageUrls: card.imageUrls,
    estimation,
  });
  assert.equal(form.netGoldWeight, 4);
  assert.equal(form.metals?.[0]?.metalTypeId, "gold");
  assert.equal(form.metals?.[0]?.purityId, "18K");
  assert.equal(form.makingCharge, 2500);
  assert.equal(form.gstRate, 0.05);
  assert.equal(form.stones[0]?.quantity, 2);
  assert.ok(form.stones[0]?.stoneTypeId);
  assert.equal(form.productImageUrl, "https://example.com/ring.jpg");
});

test("stock product photos follow attached ones without duplicates", () => {
  assert.deepEqual(
    assistantEstimateImageUrls({
      ...card,
      productCode: "SR-1",
      productImages: [
        { id: "m-1", storageKey: "https://cdn.example.com/front.jpg" },
        { id: "m-2", storageKey: "https://example.com/ring.jpg" },
      ],
    }),
    ["https://example.com/ring.jpg", "https://cdn.example.com/front.jpg"],
  );
});
