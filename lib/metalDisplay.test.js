import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { formatMetalTypeLabel, normalizeMetalType } from "./metalDisplay.ts";

describe("normalizeMetalType", () => {
  test("preserves backend inventory colors", () => {
    assert.equal(normalizeMetalType("YELLOW"), "Gold");
    assert.equal(normalizeMetalType("ROSE"), "Rose Gold");
    assert.equal(normalizeMetalType("WHITE"), "White Gold");
  });
});

describe("formatMetalTypeLabel", () => {
  test("uses the selected color for gold", () => {
    assert.equal(formatMetalTypeLabel("Gold", "Rose"), "Rose Gold");
    assert.equal(
      formatMetalTypeLabel("Gold", "Yellow + White"),
      "Yellow + White Gold",
    );
  });

  test("defaults plain gold to yellow gold", () => {
    assert.equal(formatMetalTypeLabel("Gold"), "Yellow Gold");
  });

  test("does not append a color to another metal type", () => {
    assert.equal(formatMetalTypeLabel("Platinum", "White"), "Platinum");
  });
});
