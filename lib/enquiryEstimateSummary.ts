import type { EstimationSummaryData } from "@/lib/calculator/summary";
import { normalizeDiamondClarity } from "@/lib/diamondClarity";
import { computeEnquiryEstimate } from "@/lib/enquiryEstimation";
import { formatDate } from "@/lib/utils";
import type { CalculatorSettings, ProductEstimation } from "@/types";

export function createEnquiryEstimateSummary({
  estimation,
  settings,
  productName,
  imageUrls,
  reference,
  itemLabel,
  recalculatedAt = new Date().toISOString(),
}: {
  estimation: ProductEstimation;
  settings: CalculatorSettings;
  productName: string;
  imageUrls: string[];
  reference: string;
  itemLabel: string;
  recalculatedAt?: string;
}) {
  const { pricing, unpricedItems } = computeEnquiryEstimate(
    estimation,
    settings,
  );
  const diamond = pricing.stoneDetails.find(
    (stone) => stone.stoneType?.category === "Diamond",
  );
  const summary: EstimationSummaryData = {
    name: productName,
    code: "",
    note: "",
    imageUrl: imageUrls[0],
    imageUrls,
    ...pricing,
    netGoldWeight: estimation.metalWeight,
    purity: estimation.purity,
    diamondColor: diamond?.stoneType?.color ?? "",
    diamondClarity: normalizeDiamondClarity(diamond?.stoneType?.clarity),
    documentDetails: {
      reference,
      item: itemLabel,
      estimatedOn: formatDate(estimation.createdAt),
      recalculatedOn: formatDate(recalculatedAt),
    },
  };
  return { summary, unpricedItems };
}
