import { CARAT_TO_GRAM } from "@/lib/calculator/constants";
import type {
  CalculatorPricedStoneDetail,
  CalculatorPricingBreakdown,
  CalculatorSettings,
  CalculatorMetalInput,
  CalculatorStoneInput,
  CalculatorStoneSlab,
  CalculatorStoneType,
  MetalPurity,
} from "@/types";

export function computeMetalDetails(
  settings: CalculatorSettings,
  metals: CalculatorMetalInput[],
) {
  return metals.map((metal) => {
    const metalType = settings.metalTypes.find(
      (candidate) => candidate.id === metal.metalTypeId,
    );
    const purity = metalType?.purities.find(
      (candidate) => candidate.id === metal.purityId,
    );
    const ratePerGram = metal.rateOverride ?? resolveMetalRate(settings, metal);

    return {
      ...metal,
      metalName: metalType?.name ?? "Metal",
      purityLabel: purity?.label ?? metal.purityId,
      ratePerGram,
      totalCost: normalizeWeight(metal.weight) * ratePerGram,
    };
  });
}

export function resolveMetalRate(
  settings: CalculatorSettings,
  metal: Pick<CalculatorMetalInput, "metalTypeId" | "purityId">,
) {
  const metalType = settings.metalTypes.find(
    (candidate) => candidate.id === metal.metalTypeId,
  );
  const fixedPurity = metalType?.purities.find(
    (candidate) => candidate.id === metal.purityId,
  );
  if (fixedPurity) return fixedPurity.ratePerGram;
  if (metal.metalTypeId !== "gold")
    return metalType?.purities[0]?.ratePerGram ?? 0;

  const normalizedPurity = metal.purityId.trim().toUpperCase();
  const numericPurity = Number.parseFloat(normalizedPurity);
  if (!Number.isFinite(numericPurity) || numericPurity <= 0) return 0;

  const gold24kRate =
    metalType?.purities.find((purity) => purity.id === "24K")?.ratePerGram ??
    settings.goldRate24k;
  const purityRatio = normalizedPurity.includes("%")
    ? numericPurity / 100
    : numericPurity > 24
      ? numericPurity / 1000
      : numericPurity / 24;

  return Math.round(gold24kRate * Math.min(purityRatio, 1));
}

function normalizeWeight(weight: number): number {
  return Number(weight.toFixed(3));
}

export function calculateGoldRate(
  goldRate24k: number,
  purity: MetalPurity,
  purityPercentages: CalculatorSettings["purityPercentages"],
): number {
  const percentage = purityPercentages[purity] ?? 100;
  return Math.round(goldRate24k * (percentage / 100));
}

export function calculateMakingCharge(
  netGoldWeight: number,
  flatRate: number,
  perGramRate: number,
): number {
  if (netGoldWeight <= 0) return 0;
  if (netGoldWeight <= 2) return flatRate;
  return netGoldWeight * perGramRate;
}

export function getStoneType(
  settings: CalculatorSettings,
  stoneTypeId: string,
): CalculatorStoneType | undefined {
  return settings.stoneTypes.find((stone) => stone.stoneId === stoneTypeId);
}

export function getStoneSlabs(
  settings: CalculatorSettings,
  stoneTypeId: string,
): CalculatorStoneSlab[] {
  return getStoneType(settings, stoneTypeId)?.slabs ?? [];
}

export function resolveAutoSlab(
  slabs: CalculatorStoneSlab[],
  weight: number,
  quantity: number,
): CalculatorStoneSlab | null {
  if (weight <= 0 || quantity <= 0 || slabs.length === 0) return null;
  const perPieceWeight = weight / quantity;
  return (
    slabs.find(
      (slab) =>
        perPieceWeight >= slab.fromWeight && perPieceWeight < slab.toWeight,
    ) ?? null
  );
}

export function computeEstimateFromInputs(
  settings: CalculatorSettings,
  netGoldWeight: number,
  purity: MetalPurity,
  stones: CalculatorStoneInput[],
  options: {
    goldRateOverride?: number;
    makingCostOverride?: number;
    gstRateOverride?: number;
    metals?: CalculatorMetalInput[];
  } = {},
): CalculatorPricingBreakdown {
  const normalizedNetGoldWeight = normalizeWeight(netGoldWeight);
  const metalDetails = options.metals?.length
    ? computeMetalDetails(settings, options.metals)
    : undefined;
  const goldRateValue =
    options.goldRateOverride !== undefined && options.goldRateOverride > 0
      ? options.goldRateOverride
      : calculateGoldRate(
          settings.goldRate24k,
          purity,
          settings.purityPercentages,
        );
  const totalStoneWeightInCarats = stones.reduce(
    (sum, stone) => sum + stone.weight,
    0,
  );
  const totalStoneWeightInGrams = totalStoneWeightInCarats * CARAT_TO_GRAM;
  const totalMetalWeight = metalDetails
    ? metalDetails.reduce((sum, metal) => sum + metal.weight, 0)
    : normalizedNetGoldWeight;
  const grossWeight =
    normalizeWeight(totalMetalWeight) + totalStoneWeightInGrams;
  const goldCost = metalDetails
    ? metalDetails.reduce((sum, metal) => sum + metal.totalCost, 0)
    : normalizedNetGoldWeight * goldRateValue;
  const makingCost =
    options.makingCostOverride ??
    calculateMakingCharge(
      normalizedNetGoldWeight,
      settings.makingChargeFlat,
      settings.makingChargePerGram,
    );

  const stoneDetails: CalculatorPricedStoneDetail[] = stones.map((stone) => {
    const stoneType = getStoneType(settings, stone.stoneTypeId);
    const slabInfo =
      stone.fixedRatePerCarat === undefined
        ? resolveAutoSlab(
            getStoneSlabs(settings, stone.stoneTypeId),
            stone.weight,
            stone.quantity,
          )
        : null;
    const ratePerCarat =
      stone.fixedRatePerCarat ?? slabInfo?.pricePerCarat ?? 0;
    const totalCost = ratePerCarat * stone.weight;

    return {
      ...stone,
      stoneType,
      totalCost,
      slabInfo,
    };
  });

  const totalStoneCost = stoneDetails.reduce(
    (sum, stone) => sum + stone.totalCost,
    0,
  );
  const subTotal = goldCost + makingCost + totalStoneCost;
  const gstRate = options.gstRateOverride ?? settings.gstRate;
  const gst = subTotal * gstRate;
  const total = subTotal + gst;

  return {
    grossWeight,
    goldRateValue,
    goldCost,
    metalDetails,
    makingCost,
    stoneDetails,
    totalStoneCost,
    subTotal,
    gst,
    gstRate,
    total,
  };
}
