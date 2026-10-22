import { getInventoryMediaUrl } from "@/lib/inventory-media";
import type { ProductEstimation } from "@/types";
import type { AssistantEstimateCard } from "@/types/assistant";

/** Attached photos first, then the stock product's (through the media proxy). */
export function assistantEstimateImageUrls(card: AssistantEstimateCard) {
  return [
    ...new Set([
      ...card.imageUrls,
      ...(card.productImages ?? []).map(getInventoryMediaUrl),
    ]),
  ];
}

/**
 * The assistant's estimate as an enquiry-style estimation, so it is priced,
 * summarised and loaded into the calculator exactly like enquiry estimates.
 */
export function assistantEstimateToEstimation(
  card: AssistantEstimateCard,
): ProductEstimation {
  return {
    id: `assistant-${card.estimatedAt}`,
    productId: "assistant-estimate",
    metalType: card.metal.type,
    purity: card.metal.purity,
    metalWeight: card.metal.netWeight,
    stoneDetails: card.stones.map((stone, index) => ({
      id: `assistant-stone-${index + 1}`,
      type: stone.stoneType,
      netWeight: stone.weight,
      pieces: stone.pieces,
      pricePerCarat: stone.pricePerCarat,
    })),
    finalAmount: card.total,
    makingCost: card.makingCost,
    gstRate: card.gstPercent === undefined ? undefined : card.gstPercent / 100,
    createdAt: card.estimatedAt,
  };
}
