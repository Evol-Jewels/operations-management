import type {
  BackendEnquiryMedia,
  BackendEnquiryStone,
} from "@/types/enquiry-api";
import type { BackendCustomProductDetails } from "@/types/order-api";
import type {
  NewProduct,
  ProductReference,
} from "../enquiries/enquiry-form-types";

export function addDaysDateString(baseDate: Date, days: number) {
  const next = new Date(baseDate);
  next.setDate(next.getDate() + days);
  return next.toISOString().slice(0, 10);
}

export function referenceToOrderMedia(
  reference: ProductReference,
): BackendEnquiryMedia | null {
  if (reference.type === "link") {
    return { type: "LINK", url: reference.url };
  }

  if (reference.url.startsWith("http")) {
    return {
      type: reference.type === "image" ? "IMAGE" : "VIDEO",
      url: reference.url,
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
    metalNetWeight: product.metalNetWeight,
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
