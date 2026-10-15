import type { CalculatorPricingBreakdown } from "@/types";

export interface EstimationSummaryData {
  name: string;
  code: string;
  note: string;
  imageUrl?: string | null;
  imageUrls: string[];
  grossWeight: number;
  netGoldWeight: number;
  purity: string;
  goldRateValue: number;
  goldCost: number;
  metalDetails?: NonNullable<CalculatorPricingBreakdown["metalDetails"]>;
  makingCost: number;
  stoneDetails: CalculatorPricingBreakdown["stoneDetails"];
  diamondColor: string;
  diamondClarity: string;
  totalStoneCost: number;
  subTotal: number;
  gst: number;
  total: number;
  gstRate: number;
  documentDetails?: {
    reference: string;
    item: string;
    estimatedOn: string;
    recalculatedOn: string;
  };
}
