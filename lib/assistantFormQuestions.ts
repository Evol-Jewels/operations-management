import {
  getMetalColours,
  getMetalPurities,
  METAL_TYPES,
} from "@/components/requirements/requirement-options";
import type { AssistantAnswer, AssistantQuestion } from "@/types/assistant";

type Values = Record<string, AssistantAnswer | undefined>;
const options = (values: readonly string[]) =>
  values.map((value) => ({ value, label: value }));

// Repair old forms as well as applying the server's dependent choice metadata.
export function enquiryMetalQuestions(
  questions: AssistantQuestion[],
): AssistantQuestion[] {
  const key = (value: string) => value.toLowerCase().replace(/[^a-z]/g, "");
  const metal = questions.find(
    (q) =>
      ["metal", "metaltype"].includes(key(q.id)) ||
      ["metal", "metaltype"].includes(key(q.label)),
  );
  if (!metal) return questions;
  return questions.map((q) => {
    if (q.id === metal.id)
      return {
        ...q,
        type: "choice",
        options: options(METAL_TYPES),
        allowOther: false,
      };
    const purity =
      /^(metal)?purity(?:optional)?$/.test(key(q.id)) ||
      /^(metal)?purity(?:optional)?$/.test(key(q.label));
    const colour = ["metalcolor", "metalcolour"].includes(key(q.id));
    if (!purity && !colour) return q;
    return {
      ...q,
      type: "choice",
      allowOther: false,
      options: [],
      optionsFrom: {
        questionId: metal.id,
        optionsByValue: Object.fromEntries(
          METAL_TYPES.map((value) => [
            value,
            options(purity ? getMetalPurities(value) : getMetalColours(value)),
          ]),
        ),
      },
    };
  });
}

export function resolveAssistantQuestions(
  questions: AssistantQuestion[],
  values: Values,
) {
  return questions.map((q) =>
    q.optionsFrom
      ? {
          ...q,
          options:
            q.optionsFrom.optionsByValue[
              String(values[q.optionsFrom.questionId] ?? "")
            ] ?? [],
        }
      : q,
  );
}

export function clearInvalidDependentAnswers(
  questions: AssistantQuestion[],
  values: Record<string, string | string[]>,
): Record<string, string | string[]> {
  const next = { ...values };
  for (const q of resolveAssistantQuestions(questions, values)) {
    if (!q.optionsFrom) continue;
    const value = next[q.id];
    if (value && !q.options?.some((option) => option.value === value))
      next[q.id] = "";
  }
  return next;
}
