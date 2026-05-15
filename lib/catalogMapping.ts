import type {
  CatalogueEstimateResult,
  CatalogueLookupProduct,
  CatalogueLookupStoneLine,
  CatalogueProductDetailResponse,
  CalculatorSettings,
  CalculatorStoneInput,
} from "@/types";
import {
  getStoneSlabs,
  resolveAutoSlab,
  computeEstimateFromInputs,
} from "@/lib/calculator/pricing";

function parseCurrencyValue(
  value: string | number | null | undefined,
): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (!value) return null;
  const cleaned = value.replace(/[^0-9.-]/g, "");
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function findStoneTypeBySlabCode(
  settings: CalculatorSettings,
  slabCode: string,
) {
  for (const stoneType of settings.stoneTypes) {
    const slab = stoneType.slabs.find(
      (candidate) => candidate.code === slabCode,
    );
    if (slab) return { stoneType, slab };
  }
  return null;
}

export function normalizeCatalogueProduct(
  details: CatalogueProductDetailResponse,
  settings: CalculatorSettings,
): CatalogueEstimateResult {
  const issues: { code: string; reason: string }[] = [];

  const normalizedStones: CatalogueLookupStoneLine[] =
    details.stone_diamond.map((stone) => {
      const slabCode = stone.bom_varient_name.trim();
      const matched = findStoneTypeBySlabCode(settings, slabCode);

      if (!matched) {
        issues.push({
          code: slabCode,
          reason: "No local slab matched this code",
        });
        return {
          id: stone.slug,
          code: slabCode,
          quantity: stone.stone_pieces,
          weight: stone.stone_weight,
          sourceRate: stone.stone_rate,
          sourceAmount: stone.stone_amount,
          stoneTypeId: "",
          stoneName: "Unknown",
          slabCode,
        };
      }

      const resolved = resolveAutoSlab(
        getStoneSlabs(settings, matched.stoneType.stoneId),
        stone.stone_weight,
        stone.stone_pieces,
      );

      if (!resolved || resolved.code !== slabCode) {
        issues.push({
          code: slabCode,
          reason:
            "Per-piece weight did not resolve back to the expected local slab",
        });
      }

      return {
        id: stone.slug,
        code: slabCode,
        quantity: stone.stone_pieces,
        weight: stone.stone_weight,
        sourceRate: stone.stone_rate,
        sourceAmount: stone.stone_amount,
        stoneTypeId: matched.stoneType.stoneId,
        stoneName: matched.stoneType.name,
        slabCode,
      };
    });

  const stones: CalculatorStoneInput[] = normalizedStones
    .filter((stone) => stone.stoneTypeId !== "")
    .map((stone) => ({
      id: stone.id,
      stoneTypeId: stone.stoneTypeId,
      weight: stone.weight,
      quantity: stone.quantity,
    }));

  // Map purity string to MetalPurity
  const purityMap: Record<string, string> = {
    "24": "24K",
    "22": "22K",
    "18": "18K",
    "14": "14K",
  };
  const mappedPurity =
    purityMap[details.metal_data.purity_data.purity] || "24K";

  const product: CatalogueLookupProduct = {
    lookupKey: `${details.slug}:${details.attribute.stock_code}`,
    slug: details.slug,
    productCode: details.product_code,
    productName: details.title || details.description || details.product_code,
    description: details.description,
    imageUrl: details.cdn_images[0] ?? null,
    purity: details.metal_data.purity_data.purity,
    netGoldWeight: details.metal_data.net_weight,
    grossWeight: details.metal_data.gross_weight,
    location: details.location,
    categoryLabel:
      details.category?.description ?? details.category?.title ?? "Catalogue",
    sourcePrice: parseCurrencyValue(details.price),
    sourceCurrency:
      details.currency || details.attribute.currency_type || "INR",
    sourceMetalCost: details.metal_data.metal_cost,
    sourceMakingAmount: details.attribute.making_amount,
    sourceStoneAmount: normalizedStones.reduce(
      (sum, stone) => sum + stone.sourceAmount,
      0,
    ),
    stones: normalizedStones,
  };

  return {
    product,
    stones,
    pricing: computeEstimateFromInputs(
      settings,
      details.metal_data.net_weight,
      mappedPurity as "24K" | "22K" | "18K" | "14K",
      stones,
    ),
    issues,
  };
}
