import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { StoneTypeCombobox } from "../components/stone-type-combobox";
import { DEFAULT_CALCULATOR_SETTINGS as settings } from "./calculator/constants";
import { computeEstimateFromInputs } from "./calculator/pricing";
import { estimationStoneToCalculator } from "./enquiryEstimation";
import { mapBackendEstimationToProductEstimation } from "./enquiryMappers";

const custom = {
  id: "stone-1",
  type: "Custom rose cut",
  netWeight: 1.25,
  pieces: 2,
};

describe("free-text stones", () => {
  test("preserves an arbitrary saved name, weight and count without a master entry or rate", () => {
    const restored = mapBackendEstimationToProductEstimation({
      id: "estimate-1",
      enquiryItemId: "item-1",
      metalPurity: "18K",
      netWeight: "0",
      stones: [{ stoneType: custom.type, weight: "1.250", pieces: 2 }],
      makingCost: "0",
      createdAt: "2026-09-11T00:00:00Z",
    });
    const stone = estimationStoneToCalculator(
      restored.stoneDetails[0],
      settings,
    );
    assert.equal(stone.sourceStoneName, custom.type);
    assert.equal(stone.stoneTypeId, "");
    assert.equal(stone.quantity, 2);
    assert.equal(stone.weight, 1.25);
    assert.equal(stone.fixedRatePerCarat, undefined);
    const pricing = computeEstimateFromInputs(settings, 0, "18K", [stone]);
    assert.equal(pricing.stoneDetails[0].sourceStoneName, custom.type);
    assert.equal(pricing.totalStoneCost, 0);
  });
  test("keeps existing names linked to their automatic slab pricing", () => {
    const stone = estimationStoneToCalculator(
      { ...custom, type: " round " },
      settings,
    );
    assert.equal(stone.stoneTypeId, settings.stoneTypes[0].stoneId);
    const pricing = computeEstimateFromInputs(settings, 0, "18K", [stone]);
    assert.ok(pricing.stoneDetails[0].slabInfo);
    assert.ok(pricing.totalStoneCost > 0);
  });
  test("shows a saved free-text value in name-based pickers", () => {
    const html = renderToStaticMarkup(
      createElement(StoneTypeCombobox, {
        options: [{ value: "Round", label: "Round" }],
        value: custom.type,
        onValueChange() {},
      }),
    );
    assert.ok(html.includes(custom.type));
    assert.ok(!html.includes("Select stone type..."));
  });
  test("shows a custom name in ID-based pickers without fabricating a master ID", () => {
    const html = renderToStaticMarkup(
      createElement(StoneTypeCombobox, {
        options: [],
        value: "",
        customValue: custom.type,
        onValueChange() {},
        onCustomValueChange() {},
      }),
    );
    assert.ok(html.includes(custom.type));
  });
});
