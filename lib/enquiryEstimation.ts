import type {
  CalculatorSettings,
  CalculatorStoneInput,
  EstimationStoneDetail,
  ProductEstimation,
} from "@/types";
import { computeEstimateFromInputs } from "@/lib/calculator/pricing";

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

export function computeEnquiryEstimate(
  estimation: ProductEstimation,
  settings: CalculatorSettings,
) {
  const metalName = (estimation.metalType ?? "Gold").trim();
  const metal = settings.metalTypes.find(
    (item) =>
      item.id.toLowerCase() === metalName.toLowerCase() ||
      item.name.toLowerCase() === metalName.toLowerCase(),
  );
  const pricing = computeEstimateFromInputs(
    settings,
    estimation.metalWeight,
    "Other",
    estimation.stoneDetails.map((stone) =>
      estimationStoneToCalculator(stone, settings),
    ),
    {
      makingCostOverride: estimation.makingCost ?? 0,
      metals: [
        {
          id: estimation.id,
          metalTypeId: metal?.id ?? metalName.toLowerCase(),
          purityId: estimation.purity,
          weight: estimation.metalWeight,
        },
      ],
    },
  );
  const unpricedItems: string[] = [];
  if (
    !Number.isFinite(estimation.metalWeight) ||
    estimation.metalWeight < 0 ||
    (estimation.metalWeight > 0 &&
      (!metal ||
        !estimation.purity.trim() ||
        !Number.isFinite(pricing.metalDetails?.[0]?.ratePerGram) ||
        (pricing.metalDetails?.[0]?.ratePerGram ?? 0) <= 0))
  ) {
    unpricedItems.push(`${metalName} ${estimation.purity}`.trim());
  }
  for (const stone of pricing.stoneDetails) {
    if (
      !Number.isFinite(stone.weight) ||
      stone.weight < 0 ||
      (stone.weight > 0 &&
        (!Number.isInteger(stone.quantity) ||
          stone.quantity <= 0 ||
          !stone.slabInfo ||
          !Number.isFinite(stone.slabInfo.pricePerCarat) ||
          stone.slabInfo.pricePerCarat < 0))
    ) {
      unpricedItems.push(
        stone.sourceStoneName || stone.stoneType?.name || "Stone",
      );
    }
  }
  if (!Number.isFinite(pricing.makingCost) || pricing.makingCost < 0) {
    unpricedItems.push("Making charges");
  }
  if (!Number.isFinite(pricing.gstRate) || pricing.gstRate < 0) {
    unpricedItems.push("GST");
  }
  return { pricing, unpricedItems };
}
