import type {
  CalculatorSettings,
  CalculatorStoneInput,
  EstimationStoneDetail,
  ProductEstimation,
} from "@/types";
import type { CreateEstimationInput } from "@/types/enquiry-api";

export function estimationStoneToCalculator(
  stone: EstimationStoneDetail,
  settings: CalculatorSettings,
): CalculatorStoneInput {
  const stoneTypeId =
    stone.ratePerCarat === undefined
      ? (settings.stoneTypes.find(
          (item) =>
            item.name.trim().toLowerCase() === stone.type.trim().toLowerCase(),
        )?.stoneId ?? "")
      : "";
  return {
    id: stone.id,
    stoneTypeId,
    sourceStoneName: stone.type,
    fixedRatePerCarat: stone.ratePerCarat,
    weight: stone.netWeight,
    quantity: stone.pieces,
  };
}

export function isEstimationStoneComplete(
  stone: CalculatorStoneInput,
): boolean {
  return (
    Boolean(stone.stoneTypeId || stone.sourceStoneName?.trim()) &&
    Number.isFinite(stone.weight) &&
    stone.weight > 0 &&
    Number.isInteger(stone.quantity) &&
    stone.quantity > 0 &&
    (stone.fixedRatePerCarat === undefined
      ? Boolean(stone.stoneTypeId)
      : Number.isFinite(stone.fixedRatePerCarat) &&
        stone.fixedRatePerCarat >= 0)
  );
}

export function estimationToApiInput(
  estimation: ProductEstimation,
): CreateEstimationInput {
  return {
    metalType: "Gold",
    metalPurity: estimation.purity,
    netWeight: estimation.metalWeight.toFixed(3),
    stones: estimation.stoneDetails.map((stone) => ({
      stoneType: stone.type.trim(),
      ratePerCarat:
        stone.ratePerCarat === undefined
          ? undefined
          : stone.ratePerCarat.toFixed(2),
      weight: stone.netWeight.toFixed(3),
      pieces: stone.pieces,
    })),
    makingCost: (estimation.makingCost ?? 0).toFixed(2),
    vendorName: estimation.vendorName?.trim() || undefined,
    notes: estimation.notes?.trim() || undefined,
  };
}
