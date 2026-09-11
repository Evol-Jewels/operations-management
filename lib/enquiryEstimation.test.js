import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { DEFAULT_CALCULATOR_SETTINGS as settings } from "./calculator/constants";
import { computeEstimateFromInputs } from "./calculator/pricing";
import {
  estimationStoneToCalculator,
  estimationToApiInput,
  isEstimationStoneComplete,
} from "./enquiryEstimation";
import { mapBackendEstimationToProductEstimation } from "./enquiryMappers";

const custom = {
  id: "stone-1",
  type: "Custom rose cut",
  netWeight: 1.25,
  pieces: 2,
  ratePerCarat: 1250.5,
};
function estimate(stone) {
  return {
    id: "estimate-1",
    productId: "item-1",
    metalWeight: 0,
    purity: "18K",
    stoneDetails: [stone],
    makingCost: 0,
    finalAmount: 0,
    createdAt: "2026-09-11T00:00:00Z",
  };
}
function pricing(stone) {
  return computeEstimateFromInputs(settings, 0, "18K", [stone], {
    makingCostOverride: 0,
  });
}

describe("manual enquiry estimation stones", () => {
  test("preserves custom name, ct, count and pricing through API save/reload", () => {
    const input = estimationToApiInput(estimate(custom));
    assert.deepEqual(input.stones[0], {
      stoneType: custom.type,
      weight: "1.250",
      pieces: 2,
      ratePerCarat: "1250.50",
    });
    const restored = mapBackendEstimationToProductEstimation({
      ...input,
      id: "estimate-1",
      enquiryItemId: "item-1",
      createdAt: "2026-09-11T00:00:00Z",
    });
    const stone = estimationStoneToCalculator(
      restored.stoneDetails[0],
      settings,
    );
    assert.equal(stone.sourceStoneName, custom.type);
    assert.equal(stone.stoneTypeId, "");
    assert.equal(stone.quantity, 2);
    assert.equal(isEstimationStoneComplete(stone), true);
    assert.equal(pricing(stone).totalStoneCost, 1563.125);
    assert.deepEqual(estimationToApiInput(restored).stones, input.stones);
  });
  test("keeps explicit zero rates through serialization and pricing", () => {
    const free = { ...custom, ratePerCarat: 0 };
    assert.equal(
      estimationToApiInput(estimate(free)).stones[0].ratePerCarat,
      "0.00",
    );
    const stone = estimationStoneToCalculator(free, settings);
    assert.equal(isEstimationStoneComplete(stone), true);
    assert.equal(pricing(stone).totalStoneCost, 0);
  });
  test("does not overwrite a manual rate when its name later exists in the master list", () => {
    const stone = estimationStoneToCalculator(
      { ...custom, type: "Round" },
      settings,
    );
    assert.equal(stone.stoneTypeId, "");
    assert.equal(pricing(stone).totalStoneCost, 1563.125);
  });
  test("retains automatic slab pricing for existing dropdown stones", () => {
    const stone = estimationStoneToCalculator(
      { ...custom, type: " round ", ratePerCarat: undefined },
      settings,
    );
    assert.equal(stone.stoneTypeId, settings.stoneTypes[0].stoneId);
    assert.equal(stone.fixedRatePerCarat, undefined);
    assert.ok(pricing(stone).stoneDetails[0].slabInfo);
    assert.ok(pricing(stone).totalStoneCost > 0);
  });
  test("never substitutes the first master stone for an unknown saved name", () => {
    const stone = estimationStoneToCalculator(
      { ...custom, ratePerCarat: undefined },
      settings,
    );
    assert.equal(stone.stoneTypeId, "");
    assert.equal(stone.sourceStoneName, custom.type);
    assert.equal(isEstimationStoneComplete(stone), false);
  });
  test("requires a name, positive weight, whole count and explicit nonnegative finite rate", () => {
    const stone = estimationStoneToCalculator(custom, settings);
    for (const patch of [
      { sourceStoneName: " " },
      { weight: 0 },
      { weight: -1 },
      { weight: Infinity },
      { quantity: 0 },
      { quantity: 1.5 },
      { fixedRatePerCarat: undefined },
      { fixedRatePerCarat: -1 },
      { fixedRatePerCarat: NaN },
      { fixedRatePerCarat: Infinity },
    ]) {
      assert.equal(isEstimationStoneComplete({ ...stone, ...patch }), false);
    }
  });
});
