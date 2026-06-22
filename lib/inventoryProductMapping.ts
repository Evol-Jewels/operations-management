import type { Product } from "@/components/enquiries/enquiry-form-types";
import type {
  CalculatorFormState,
  CalculatorPricingBreakdown,
  CalculatorSettings,
  CalculatorStoneInput,
  JewelleryCategory,
  MetalPurity,
  MetalType,
  ProductEstimateResult,
  ProductLookupStoneLine,
} from "@/types";
import type { InventoryMedia, InventoryProduct } from "@/types/inventory-api";

const CATEGORY_MAP: Record<string, JewelleryCategory> = {
  ring: "Ring",
  rings: "Ring",
  necklace: "Necklace",
  necklaces: "Necklace",
  bracelet: "Bracelet",
  bracelets: "Bracelet",
  earrings: "Earrings",
  earring: "Earrings",
  bangle: "Bangle",
  bangles: "Bangle",
  pendant: "Pendant",
  pendants: "Pendant",
  chain: "Chain",
  chains: "Chain",
  brooch: "Brooch",
  brooches: "Brooch",
};

export function parseInventoryNumber(
  value: string | number | null | undefined,
) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

export function getInventoryPrimaryImage(
  product: InventoryProduct,
): InventoryMedia | undefined {
  return product.media.find((item) => item.isPrimary) ?? product.media[0];
}

export function getInventoryPurity(product: InventoryProduct): MetalPurity {
  const purity = `${product.purity}K`;
  return ["14K", "18K", "22K", "24K"].includes(purity)
    ? (purity as MetalPurity)
    : "Other";
}

export function getInventoryMetalType(product: InventoryProduct): MetalType {
  const color = product.color.trim().toLowerCase();

  if (color.includes("rose")) return "Rose Gold";
  if (color.includes("white")) return "White Gold";
  if (product.category.toLowerCase().includes("silver")) return "Silver";
  if (product.category.toLowerCase().includes("platinum")) return "Platinum";

  return "Gold";
}

export function getInventoryCategory(
  product: InventoryProduct,
): JewelleryCategory {
  const text = `${product.category} ${product.name}`.toLowerCase();

  for (const [needle, category] of Object.entries(CATEGORY_MAP)) {
    if (text.includes(needle)) return category;
  }

  return "Other";
}

function findStoneTypeIdByName(
  settings: CalculatorSettings,
  stoneName: string | null,
) {
  if (!stoneName) return settings.stoneTypes[0]?.stoneId ?? "";
  const normalizedName = stoneName.trim().toLowerCase();
  return (
    settings.stoneTypes.find(
      (stoneType) => stoneType.name.trim().toLowerCase() === normalizedName,
    )?.stoneId ??
    settings.stoneTypes[0]?.stoneId ??
    ""
  );
}

export function buildInventoryCalculatorStones(
  product: InventoryProduct,
  settings: CalculatorSettings,
): CalculatorStoneInput[] {
  return (product.stones ?? [])
    .filter((stone) => stone.netWeight > 0)
    .map((stone) => ({
      id: stone.id,
      stoneTypeId: findStoneTypeIdByName(settings, stone.stoneName),
      weight: stone.netWeight,
      quantity: Math.max(1, stone.pieces),
      fixedRatePerCarat: stone.ratePerCarat,
      sourceStoneName: stone.stoneName ?? stone.slabName,
    }));
}

export function buildInventoryCalculatorForm(
  product: InventoryProduct,
  settings: CalculatorSettings,
): CalculatorFormState {
  return {
    netGoldWeight: parseInventoryNumber(product.netWeight),
    purity: getInventoryPurity(product),
    stones: buildInventoryCalculatorStones(product, settings),
    productName: product.name,
    productNote: product.description ?? product.notes ?? "",
    productImageUrl: getInventoryPrimaryImage(product)?.storageKey,
  };
}

function buildBackendPricingBreakdown(
  product: InventoryProduct,
): CalculatorPricingBreakdown {
  const estimation = product.estimation;
  const stoneDetails = (product.stones ?? []).map((stone) => ({
    id: stone.id,
    stoneTypeId: "",
    weight: stone.netWeight,
    quantity: Math.max(1, stone.pieces),
    fixedRatePerCarat: stone.ratePerCarat,
    sourceStoneName: stone.stoneName ?? stone.slabName,
    totalCost: stone.amount,
    slabInfo: null,
  }));

  return {
    grossWeight: parseInventoryNumber(product.grossWeight),
    goldRateValue: estimation?.goldRateValue ?? 0,
    goldCost: estimation?.goldCost ?? 0,
    makingCost: estimation?.makingCost ?? 0,
    stoneDetails,
    totalStoneCost: estimation?.totalStoneCost ?? 0,
    subTotal: estimation?.subTotal ?? 0,
    gst: estimation?.gst ?? 0,
    total: estimation?.total ?? 0,
  };
}

export function normalizeInventoryProductEstimate(
  product: InventoryProduct,
  settings: CalculatorSettings,
): ProductEstimateResult {
  const stones: ProductLookupStoneLine[] = (product.stones ?? []).map(
    (stone) => ({
      id: stone.id,
      code: stone.slabName,
      quantity: Math.max(1, stone.pieces),
      weight: stone.netWeight,
      sourceRate: stone.ratePerCarat,
      sourceAmount: stone.amount,
      stoneTypeId: findStoneTypeIdByName(settings, stone.stoneName),
      stoneName: stone.stoneName ?? stone.slabName,
      slabCode: stone.slabName,
    }),
  );

  return {
    product: {
      lookupKey: `${product.id}:${product.productCode}`,
      slug: product.id,
      productCode: product.productCode,
      productName: product.name,
      description: product.description ?? product.notes ?? "",
      imageUrl: getInventoryPrimaryImage(product)?.storageKey ?? null,
      purity: getInventoryPurity(product),
      netGoldWeight: parseInventoryNumber(product.netWeight),
      grossWeight: parseInventoryNumber(product.grossWeight),
      location: product.location.name,
      categoryLabel: product.category,
      sourcePrice: product.estimation?.total ?? null,
      sourceCurrency: "INR",
      sourceMetalCost: product.estimation?.goldCost ?? 0,
      sourceMakingAmount: product.estimation?.makingCost ?? 0,
      sourceStoneAmount: product.estimation?.totalStoneCost ?? 0,
      stones,
    },
    stones: buildInventoryCalculatorStones(product, settings),
    pricing: buildBackendPricingBreakdown(product),
    issues:
      product.estimation?.issues?.map((issue) => ({
        code: issue.code,
        reason: issue.message,
      })) ?? [],
  };
}

export function mapInventoryProductToEnquiryProduct(
  product: InventoryProduct,
): Product {
  const diamondWeight =
    parseInventoryNumber(product.totalDiamondWeight) ||
    product.stones?.[0]?.netWeight;
  const descriptionParts = [
    product.description,
    product.location?.name ? `Location: ${product.location.name}` : null,
    `Net wt ${product.netWeight}g`,
    `Gross wt ${product.grossWeight}g`,
    diamondWeight ? `Diamond wt ${diamondWeight}ct` : null,
  ].filter(Boolean);

  return {
    id: product.id,
    productCode: product.productCode,
    name: product.name || product.productCode,
    category: getInventoryCategory(product),
    metalType: getInventoryMetalType(product),
    metalPurity: getInventoryPurity(product),
    description: descriptionParts.join(", "),
    imageUrl: getInventoryPrimaryImage(product)?.storageKey,
  };
}
