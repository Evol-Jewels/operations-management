import type {
  CatalogueProductDetailResponse,
  JewelleryCategory,
  MetalPurity,
  MetalType,
} from "@/types";
import type { Product } from "./enquiry-form-types";

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

function parsePrice(value: string | number | null | undefined) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (!value) return null;
  const parsed = Number(value.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function mapCategory(
  details: CatalogueProductDetailResponse,
): JewelleryCategory {
  const categoryText = [
    details.category?.description,
    details.category?.title,
    details.title,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  for (const [needle, category] of Object.entries(CATEGORY_MAP)) {
    if (categoryText.includes(needle)) return category;
  }

  return "Other";
}

function mapMetalType(details: CatalogueProductDetailResponse): MetalType {
  const text = [
    details.metal_data.purity_data.colour,
    details.metal_data.purity_data.title,
    details.metal_data.purity_data.description,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (text.includes("rose")) return "Rose Gold";
  if (text.includes("white")) return "White Gold";
  if (text.includes("silver")) return "Silver";
  if (text.includes("platinum")) return "Platinum";
  return "Gold";
}

function mapPurity(details: CatalogueProductDetailResponse): MetalPurity {
  const purity = details.metal_data.purity_data.purity.trim();
  if (purity.includes("14")) return "14K";
  if (purity.includes("18")) return "18K";
  if (purity.includes("22")) return "22K";
  if (purity.includes("24")) return "24K";
  return "Other";
}

export function mapCatalogueDetailsToEnquiryProduct(
  details: CatalogueProductDetailResponse,
): Product {
  const price = parsePrice(details.price);
  const diamondWeight =
    details.attribute.total_diamond_wt ||
    details.stone_diamond[0]?.stone_weight;
  const descriptionParts = [
    details.description,
    details.location ? `Location: ${details.location}` : null,
    `Net wt ${details.metal_data.net_weight}g`,
    `Gross wt ${details.metal_data.gross_weight}g`,
    diamondWeight ? `Diamond wt ${diamondWeight}ct` : null,
  ].filter(Boolean);

  return {
    id: details.slug || details.product_code,
    productCode: details.product_code,
    name:
      details.title ||
      details.category?.description ||
      details.category?.title ||
      details.product_code,
    category: mapCategory(details),
    metalType: mapMetalType(details),
    metalPurity: mapPurity(details),
    description: descriptionParts.join(", "),
    imageUrl: details.cdn_images[0],
    basePrice: price ?? undefined,
  };
}
