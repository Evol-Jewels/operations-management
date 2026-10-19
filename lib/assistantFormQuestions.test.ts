import assert from "node:assert/strict";
import { test } from "node:test";
import { getMetalPurityError } from "@/components/requirements/requirement-options";
import type { AssistantQuestion } from "@/types/assistant";
import {
  clearInvalidDependentAnswers,
  enquiryMetalQuestions,
  resolveAssistantQuestions,
} from "./assistantFormQuestions";

const questions: AssistantQuestion[] = [
  {
    id: "metal",
    label: "Metal",
    type: "choice",
    required: true,
    options: [{ value: "Gold", label: "Gold" }],
  },
  {
    id: "purity",
    label: "Purity (optional)",
    type: "choice",
    required: false,
    allowOther: true,
    options: [{ value: "925", label: "925 (silver)" }],
  },
  { id: "notes", label: "Notes", type: "text", required: false },
];

test("legacy mixed forms use the complete purity list for the selected metal", () => {
  const fields = enquiryMetalQuestions(questions);
  for (const [metal, expected] of [
    ["Gold", ["9KT", "14KT", "18KT", "22KT", "24KT"]],
    ["Silver", ["925"]],
    ["Platinum", ["950"]],
    ["", []],
  ] as const) {
    const purity = resolveAssistantQuestions(fields, { metal }).find(
      (q) => q.id === "purity",
    );
    assert.deepEqual(
      purity?.options?.map((o) => o.value),
      [...expected],
    );
    assert.equal(purity?.allowOther, false);
  }
});

test("changing the metal clears incompatible purity while preserving other answers", () => {
  const fields = enquiryMetalQuestions(questions);
  assert.deepEqual(
    clearInvalidDependentAnswers(fields, {
      metal: "Gold",
      purity: "925",
      notes: "Keep my notes",
    }),
    { metal: "Gold", purity: "", notes: "Keep my notes" },
  );
  assert.equal(
    clearInvalidDependentAnswers(fields, { metal: "Silver", purity: "925" })
      .purity,
    "925",
  );
  assert.equal(
    clearInvalidDependentAnswers(fields, { metal: "Platinum", purity: "925" })
      .purity,
    "",
  );
  assert.equal(
    clearInvalidDependentAnswers(fields, { metal: "Gold", purity: "24KT" })
      .purity,
    "24KT",
  );
});

test("the original form accepts gold K/KT aliases and rejects mismatched values", () => {
  for (const purity of ["9KT", "14KT", "18KT", "22KT", "24KT", "18K", ""])
    assert.equal(getMetalPurityError("Gold", purity), undefined);
  assert.equal(getMetalPurityError("Silver", "925"), undefined);
  assert.equal(getMetalPurityError("Platinum", "950"), undefined);
  for (const [metal, purity] of [
    ["Gold", "925"],
    ["Gold", "950"],
    ["Silver", "18KT"],
    ["Platinum", "925"],
  ])
    assert.ok(getMetalPurityError(metal, purity));
});
