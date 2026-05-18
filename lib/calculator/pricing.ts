import { CARAT_TO_GRAM } from "@/lib/calculator/constants";
import type {
  CalculatorPricedStoneDetail,
  CalculatorPricingBreakdown,
  CalculatorSettings,
  CalculatorStoneInput,
  CalculatorStoneSlab,
  CalculatorStoneType,
  MetalPurity,
} from "@/types";

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
  if (netGoldWeight < 2) return flatRate;
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
  if (weight <= 0 || slabs.length === 0) return null;
  const pieces = Math.max(1, quantity);
  const perPieceWeight = weight / pieces;
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
): CalculatorPricingBreakdown {
  const normalizedNetGoldWeight = normalizeWeight(netGoldWeight);
  const goldRateValue = calculateGoldRate(
    settings.goldRate24k,
    purity,
    settings.purityPercentages,
  );
  const totalStoneWeightInCarats = stones.reduce(
    (sum, stone) => sum + stone.weight,
    0,
  );
  const totalStoneWeightInGrams = totalStoneWeightInCarats * CARAT_TO_GRAM;
  const grossWeight = normalizedNetGoldWeight + totalStoneWeightInGrams;
  const goldCost = normalizedNetGoldWeight * goldRateValue;
  const makingCost = calculateMakingCharge(
    normalizedNetGoldWeight,
    settings.makingChargeFlat,
    settings.makingChargePerGram,
  );

  const stoneDetails: CalculatorPricedStoneDetail[] = stones.map((stone) => {
    const stoneType = getStoneType(settings, stone.stoneTypeId);
    const slabInfo = resolveAutoSlab(
      getStoneSlabs(settings, stone.stoneTypeId),
      stone.weight,
      stone.quantity,
    );
    const totalCost = (slabInfo?.pricePerCarat ?? 0) * stone.weight;

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
  const gst = subTotal * settings.gstRate;
  const total = subTotal + gst;

  return {
    grossWeight,
    goldRateValue,
    goldCost,
    makingCost,
    stoneDetails,
    totalStoneCost,
    subTotal,
    gst,
    total,
  };
}
