import type { Product } from "@/components/enquiries/enquiry-form-types";
import {
  computeEstimateFromInputs,
  getStoneSlabs,
  resolveAutoSlab,
} from "@/lib/calculator/pricing";
import type {
  CalculatorFormState,
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

function findStoneTypeBySlabCode(
  settings: CalculatorSettings,
  slabCode: string,
) {
  const normalizedCode = slabCode.trim();

  for (const stoneType of settings.stoneTypes) {
    const slab = stoneType.slabs.find(
      (candidate) => candidate.code === normalizedCode,
    );
    if (slab) return { stoneType, slab };
  }

  return null;
}

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

export function buildInventoryPricingSettings(
  product: InventoryProduct,
  settings: CalculatorSettings,
): CalculatorSettings {
  const stoneTypes = settings.stoneTypes.map((stoneType) => ({
    ...stoneType,
    slabs: [...stoneType.slabs],
  }));

  for (const stone of product.stones ?? []) {
    if (
      findStoneTypeBySlabCode({ ...settings, stoneTypes }, stone.stoneSlabCode)
    ) {
      continue;
    }

    const stoneTypeId = stone.slab.stoneType.id;
    const existingStoneType = stoneTypes.find(
      (stoneType) => stoneType.stoneId === stoneTypeId,
    );
    const apiSlab = {
      code: stone.stoneSlabCode,
      fromWeight: parseInventoryNumber(stone.slab.rangeFrom),
      toWeight: parseInventoryNumber(stone.slab.rangeTo),
      pricePerCarat: parseInventoryNumber(stone.slab.pricePerCarat),
    };

    if (existingStoneType) {
      existingStoneType.slabs = [...existingStoneType.slabs, apiSlab];
      continue;
    }

    stoneTypes.push({
      stoneId: stoneTypeId,
      name: stone.slab.stoneType.name,
      category:
        stone.slab.stoneType.category === "Gemstone" ? "Gemstone" : "Diamond",
      clarity: stone.slab.stoneType.clarity,
      color: stone.slab.stoneType.color ?? undefined,
      slabs: [apiSlab],
    });
  }

  return { ...settings, stoneTypes };
}

export function buildInventoryCalculatorStones(
  product: InventoryProduct,
  settings: CalculatorSettings,
): CalculatorStoneInput[] {
  return (product.stones ?? []).flatMap((stone) => {
    const matched = findStoneTypeBySlabCode(settings, stone.stoneSlabCode);
    const weight = parseInventoryNumber(stone.totalNetWeight);

    if (!matched || weight <= 0) return [];

    return [
      {
        id: stone.id,
        stoneTypeId: matched.stoneType.stoneId,
        weight,
        quantity: Math.max(1, stone.totalPieces),
      },
    ];
  });
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

export function normalizeInventoryProductEstimate(
  product: InventoryProduct,
  settings: CalculatorSettings,
): ProductEstimateResult {
  const pricingSettings = buildInventoryPricingSettings(product, settings);
  const issues: { code: string; reason: string }[] = [];

  const normalizedStones: ProductLookupStoneLine[] = (product.stones ?? []).map(
    (stone) => {
      const slabCode = stone.stoneSlabCode.trim();
      const matched = findStoneTypeBySlabCode(pricingSettings, slabCode);
      const weight = parseInventoryNumber(stone.totalNetWeight);
      const quantity = Math.max(1, stone.totalPieces);
      const sourceRate = parseInventoryNumber(stone.slab.pricePerCarat);

      if (!matched) {
        issues.push({
          code: slabCode,
          reason: "No local slab matched this code",
        });
      } else {
        const resolved = resolveAutoSlab(
          getStoneSlabs(pricingSettings, matched.stoneType.stoneId),
          weight,
          quantity,
        );

        if (!resolved || resolved.code !== slabCode) {
          issues.push({
            code: slabCode,
            reason:
              "Per-piece weight did not resolve back to the expected local slab",
          });
        }
      }

      return {
        id: stone.id,
        code: slabCode,
        quantity,
        weight,
        sourceRate,
        sourceAmount: sourceRate * weight,
        stoneTypeId: matched?.stoneType.stoneId ?? "",
        stoneName: matched?.stoneType.name ?? stone.slab.stoneType.name,
        slabCode,
      };
    },
  );

  const stones = buildInventoryCalculatorStones(product, pricingSettings);
  const purity = getInventoryPurity(product);

  return {
    product: {
      lookupKey: `${product.id}:${product.productCode}`,
      slug: product.id,
      productCode: product.productCode,
      productName: product.name,
      description: product.description ?? product.notes ?? "",
      imageUrl: getInventoryPrimaryImage(product)?.storageKey ?? null,
      purity,
      netGoldWeight: parseInventoryNumber(product.netWeight),
      grossWeight: parseInventoryNumber(product.grossWeight),
      location: product.location.name,
      categoryLabel: product.category,
      sourcePrice: null,
      sourceCurrency: "INR",
      sourceMetalCost: 0,
      sourceMakingAmount: 0,
      sourceStoneAmount: normalizedStones.reduce(
        (sum, stone) => sum + stone.sourceAmount,
        0,
      ),
      stones: normalizedStones,
    },
    stones,
    pricing: computeEstimateFromInputs(
      pricingSettings,
      parseInventoryNumber(product.netWeight),
      purity === "Other" ? "22K" : purity,
      stones,
    ),
    issues,
  };
}

export function mapInventoryProductToEnquiryProduct(
  product: InventoryProduct,
): Product {
  const diamondWeight =
    parseInventoryNumber(product.totalDiamondWeight) ||
    product.stones?.[0]?.totalNetWeight;
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
