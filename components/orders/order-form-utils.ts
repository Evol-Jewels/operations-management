import { getInventoryMediaUrl } from "@/lib/inventory-media";
import {
  getInventoryPrimaryImage,
  mapInventoryProductToEnquiryProduct,
} from "@/lib/inventoryProductMapping";
import type {
  BackendEnquiryMedia,
  BackendEnquiryStone,
} from "@/types/enquiry-api";
import type { InventoryProduct } from "@/types/inventory-api";
import type { BackendCustomProductDetails } from "@/types/order-api";
import type {
  NewProduct,
  ProductReference,
} from "../enquiries/enquiry-form-types";

export const METAL_WEIGHT_PATTERN = /^\d+(\.\d{1,3})?$/;
export const METAL_WEIGHT_ERROR =
  "Enter a weight using digits with up to 3 decimal places, for example 5.800";

export interface RefillOrderSeed {
  name: string;
  productCode: string;
  category: string;
  metalType: string;
  metalPurity: string;
  metalNetWeight?: string;
  metalGrossWeight?: string;
  size?: string;
  imageUrl?: string;
  basePrice?: number;
  notes?: string;
  vendor: string;
}

export function createRefillOrderSeed(
  product: InventoryProduct,
): RefillOrderSeed {
  const mappedProduct = mapInventoryProductToEnquiryProduct(product);
  const primaryImage = getInventoryPrimaryImage(product);

  return {
    name: mappedProduct.name,
    productCode: mappedProduct.productCode,
    category: mappedProduct.category,
    metalType: mappedProduct.metalType,
    metalPurity: mappedProduct.metalPurity,
    metalNetWeight: product.netWeight || undefined,
    metalGrossWeight: product.grossWeight || undefined,
    size: product.size || undefined,
    imageUrl: primaryImage ? getInventoryMediaUrl(primaryImage) : undefined,
    basePrice: product.price?.total,
    notes: product.notes || product.description || undefined,
    vendor: product.vendor?.trim() || "",
  };
}

export function addDaysDateString(baseDate: Date, days: number) {
  const next = new Date(baseDate);
  next.setDate(next.getDate() + days);
  return next.toISOString().slice(0, 10);
}

export function cleanOptionalText(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function isIsoDateString(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value
  );
}

export function isValidMetalWeight(value?: string) {
  const trimmed = value?.trim();
  return Boolean(trimmed && METAL_WEIGHT_PATTERN.test(trimmed));
}

export function referenceToOrderMedia(
  reference: ProductReference,
): BackendEnquiryMedia | null {
  if (reference.type === "link") {
    return { type: "LINK", url: reference.url };
  }

  if (reference.url.startsWith("http")) {
    return {
      type:
        reference.type === "image"
          ? "IMAGE"
          : reference.type === "video"
            ? "VIDEO"
            : "AUDIO",
      url: reference.url,
      name: reference.name,
      mimeType: reference.mimeType,
      size: reference.size,
      durationSeconds: reference.durationSeconds,
    };
  }

  return null;
}

export function customProductStones(
  product: NewProduct,
): BackendEnquiryStone[] {
  const stones = product.stones
    .filter((stone) => stone.stoneType.trim())
    .map((stone) => ({
      stoneType: stone.stoneType.trim(),
      weight: stone.weight || undefined,
    }));

  if (stones.length > 0) return stones;
  if (!product.stoneDescription.trim()) return [];

  return [
    {
      stoneType: product.stoneDescription,
      weight: product.stoneCaratEstimate || undefined,
    },
  ];
}

export function mapCategoryToBackend(
  category: string,
): BackendCustomProductDetails["category"] {
  const normalized = category.trim().toUpperCase();
  if (normalized === "RING") return "RING";
  if (normalized === "NECKLACE") return "NECKLACE";
  if (normalized === "EARRINGS" || normalized === "EARRING") return "EARRING";
  if (normalized === "BRACELET") return "BRACELET";
  if (normalized === "PENDANT") return "PENDANT";
  if (normalized === "BANGLE") return "BANGLE";
  if (normalized === "ANKLET") return "ANKLET";
  if (normalized === "ACCESSORY" || normalized === "ACCESSORIES") {
    return "ACCESSORY";
  }
  if (normalized === "CHAIN" || normalized === "CHAINS") return "CHAIN";
  return "OTHER";
}

export function mapMetalColorToBackend(
  value: string,
): BackendCustomProductDetails["metalColor"] | undefined {
  const normalized = value.trim().toUpperCase();
  if (normalized === "YELLOW") return "YELLOW";
  if (normalized === "ROSE") return "ROSE";
  if (normalized === "WHITE") return "WHITE";
  if (normalized === "OTHERS" || normalized === "OTHER") return "OTHERS";
  return undefined;
}

export function customProductDetails(
  product: Pick<
    NewProduct,
    | "category"
    | "metalType"
    | "metalPurity"
    | "metalNetWeight"
    | "metalGrossWeight"
    | "metalColor"
    | "size"
    | "stones"
    | "stoneDescription"
    | "stoneCaratEstimate"
  >,
): BackendCustomProductDetails {
  const stones = product.stones
    .filter((stone) => stone.stoneType.trim())
    .map((stone) => ({
      stoneType: stone.stoneType.trim(),
      approxPieces: stone.pieces ? Number(stone.pieces) : 1,
      netWeight: stone.weight || undefined,
    }));

  return {
    category: mapCategoryToBackend(product.category),
    metalType: product.metalType,
    metalPurity: product.metalPurity || undefined,
    metalColor: mapMetalColorToBackend(product.metalColor),
    size: product.size ? Number(product.size) : undefined,
    metalNetWeight: product.metalNetWeight.trim() || undefined,
    metalGrossWeight: product.metalGrossWeight || undefined,
    stones:
      stones.length > 0
        ? stones
        : product.stoneDescription.trim()
          ? [
              {
                stoneType: product.stoneDescription.trim(),
                approxPieces: 1,
                netWeight: product.stoneCaratEstimate || undefined,
              },
            ]
          : [],
  };
}
