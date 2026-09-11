import type {
  CalculatorSettings,
  CalculatorStoneInput,
  EstimationStoneDetail,
} from "@/types";

export function estimationStoneToCalculator(
  stone: EstimationStoneDetail,
  settings: CalculatorSettings,
): CalculatorStoneInput {
  const stoneTypeId =
    settings.stoneTypes.find(
      (item) =>
        item.name.trim().toLowerCase() === stone.type.trim().toLowerCase(),
    )?.stoneId ?? "";
  return {
    id: stone.id,
    stoneTypeId,
    sourceStoneName: stone.type,
    weight: stone.netWeight,
    quantity: stone.pieces,
  };
}
