import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT_CALCULATOR_SETTINGS as settings } from "./calculator/constants";
import {
  computeEstimateFromInputs,
  resolveMetalRate,
} from "./calculator/pricing";
import { mapBackendEstimationToProductEstimation } from "./enquiryMappers";

test("saved silver purity and metal type survive mapping and config rate drives the total", () => {
  const estimation = mapBackendEstimationToProductEstimation({
    id: "estimate",
    enquiryItemId: "item",
    metalType: "Silver",
    metalPurity: "925",
    netWeight: "10",
    stones: [],
    makingCost: "100",
    vendorName: null,
    media: [],
    notes: null,
    createdBy: null,
    updatedBy: null,
    updatedAt: "2026-09-11",
    createdAt: "2026-09-11",
  });
  assert.equal(estimation.purity, "925");
  assert.equal(estimation.metalType, "Silver");
  const rate = resolveMetalRate(settings, {
    metalTypeId: "silver",
    purityId: estimation.purity,
  });
  const result = computeEstimateFromInputs(settings, 10, "Other", [], {
    makingCostOverride: 100,
    metals: [
      {
        id: "metal",
        metalTypeId: "silver",
        purityId: estimation.purity,
        weight: 10,
      },
    ],
  });
  assert.equal(result.goldCost, rate * 10);
  assert.equal(
    result.total,
    (rate * 10 + 100) * (1 + settings.gstRate),
  );
});

test("configured purity rates default correctly and zero overrides are respected", () => {
  for (const metal of settings.metalTypes) {
    for (const purity of metal.purities) {
      assert.equal(
        resolveMetalRate(settings, {
          metalTypeId: metal.id,
          purityId: purity.id,
        }),
        purity.ratePerGram,
      );
      const result = computeEstimateFromInputs(settings, 2, "Other", [], {
        metals: [
          {
            id: "metal",
            metalTypeId: metal.id,
            purityId: purity.id,
            weight: 2,
            rateOverride: 0,
          },
        ],
      });
      assert.equal(result.goldCost, 0);
    }
  }
});
