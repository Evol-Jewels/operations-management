import {
  calculateMakingCharge,
  computeEstimateFromInputs,
} from "@/lib/calculator/pricing";
import { estimationStoneToCalculator } from "@/lib/enquiryEstimation";
import type {
  CalculatorFormState,
  CalculatorSettings,
  CalculatorStoneInput,
  ProductEstimation,
} from "@/types";

export function createEnquiryCalculatorStone(
  settings: CalculatorSettings,
): CalculatorStoneInput {
  return {
    id: crypto.randomUUID(),
    stoneTypeId:
      (
        settings.stoneTypes.find(
          (stone) => stone.name.trim().toLowerCase() === "round",
        ) ?? settings.stoneTypes[0]
      )?.stoneId ?? "",
    weight: 0,
    quantity: 1,
  };
}

export function buildEnquiryCalculatorForm({
  settings,
  productId,
  productName,
  metalType,
  purity,
  imageUrls = [],
  estimation,
}: {
  settings: CalculatorSettings;
  productId: string;
  productName: string;
  metalType: string;
  purity: string;
  imageUrls?: string[];
  estimation?: ProductEstimation;
}): CalculatorFormState {
  const metalName = estimation?.metalType ?? metalType;
  const metal = settings.metalTypes.find(
    (item) =>
      item.id.toLowerCase() === metalName.toLowerCase() ||
      item.name.toLowerCase() === metalName.toLowerCase(),
  );
  const requestedPurity = estimation?.purity ?? purity;
  const purityId =
    estimation?.purity ??
    metal?.purities.find((item) => item.id === requestedPurity)?.id ??
    metal?.purities[0]?.id ??
    requestedPurity;
  const weight = estimation?.metalWeight ?? 0;
  return {
    netGoldWeight: weight,
    purity: "Other",
    metals: [
      {
        id: productId,
        metalTypeId: metal?.id ?? metalName.toLowerCase(),
        purityId,
        weight,
      },
    ],
    stones: estimation?.stoneDetails.length
      ? estimation.stoneDetails.map((stone) =>
          estimationStoneToCalculator(stone, settings),
        )
      : [createEnquiryCalculatorStone(settings)],
    gstRate: settings.gstRate,
    makingCharge:
      estimation?.makingCost ??
      calculateMakingCharge(
        weight,
        settings.makingChargeFlat,
        settings.makingChargePerGram,
      ),
    productName,
    productNote: "",
    productImageUrl: imageUrls[0],
    productImageUrls: imageUrls,
    diamondColor: "",
    diamondClarity: "",
  };
}

export function enquiryCalculatorToEstimation({
  form,
  settings,
  productId,
  estimation,
  vendorName,
  notes,
}: {
  form: CalculatorFormState;
  settings: CalculatorSettings;
  productId: string;
  estimation?: Pick<ProductEstimation, "id" | "createdAt">;
  vendorName?: string;
  notes?: string;
}): ProductEstimation {
  const metal = form.metals?.[0];
  if (
    !metal ||
    form.metals?.length !== 1 ||
    metal.rateOverride !== undefined ||
    form.gstRate !== settings.gstRate ||
    form.stones.some((stone) => stone.fixedRatePerCarat !== undefined)
  ) {
    throw new Error(
      "Enquiry estimates support one metal and configured rates.",
    );
  }
  const metalType = settings.metalTypes.find(
    (item) => item.id === metal.metalTypeId,
  );
  const pricing = computeEstimateFromInputs(
    settings,
    metal.weight,
    "Other",
    form.stones,
    {
      metals: [metal],
      makingCostOverride: form.makingCharge,
    },
  );
  return {
    id: estimation?.id ?? `est-${crypto.randomUUID()}`,
    productId,
    metalType: metalType?.name ?? metal.metalTypeId,
    purity: metal.purityId,
    metalWeight: metal.weight,
    stoneDetails: pricing.stoneDetails
      .filter((stone) => stone.weight > 0)
      .map((stone) => ({
        id: stone.id,
        type: stone.sourceStoneName || stone.stoneType?.name || "Stone",
        netWeight: stone.weight,
        pieces: stone.quantity,
      })),
    makingCost: form.makingCharge,
    finalAmount: Math.round(pricing.total),
    createdAt: estimation?.createdAt ?? new Date().toISOString(),
    vendorName: vendorName?.trim() || undefined,
    notes: notes?.trim() || undefined,
  };
}
