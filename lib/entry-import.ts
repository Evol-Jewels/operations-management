import type { ProductReference } from "@/components/enquiries/enquiry-form-types";
import type { RequirementDraft } from "@/components/requirements/requirement-form-types";
import { generateRequirementId } from "@/components/requirements/requirement-form-utils";
import {
  METAL_COLOURS,
  METAL_TYPES,
  PRODUCT_CATEGORIES,
} from "@/components/requirements/requirement-options";
import type {
  BackendEnquiryItemRow,
  BackendEnquiryMedia,
} from "@/types/enquiry-api";
import type { BackendOrderRow } from "@/types/order-api";

function formOption(value: string, options: readonly string[]) {
  return (
    options.find((option) => option.toUpperCase() === value.toUpperCase()) ??
    value
  );
}

function importReferences(media: BackendEnquiryMedia[]): ProductReference[] {
  return media.map((reference, index) => ({
    id: generateRequirementId(),
    type:
      reference.type === "LINK"
        ? "link"
        : reference.type === "VIDEO"
          ? "video"
          : reference.type === "AUDIO"
            ? "audio"
            : "image",
    url: reference.url,
    name: reference.name || `Reference ${index + 1}`,
    mimeType: reference.mimeType,
    size: reference.size,
    durationSeconds: reference.durationSeconds,
  }));
}

export function importEnquiryRequirement(
  item: BackendEnquiryItemRow,
): RequirementDraft {
  return {
    id: generateRequirementId(),
    productCode:
      item.type === "EXISTING" ? item.productCode || undefined : undefined,
    referenceProductCode: item.referenceProductCode || item.productCode || "",
    category: item.category || "",
    metalType: item.metalType || "",
    metalPurity: item.metalPurity || "",
    metalWeight: item.metalWeight || "",
    diamonds: (item.diamonds ?? []).map((diamond) => ({
      ...diamond,
      id: generateRequirementId(),
    })),
    colorStones: (item.colorStones?.length
      ? item.colorStones
      : (item.stones ?? [])
    ).map((stone) => ({
      ...stone,
      pieces: stone.pieces === undefined ? undefined : String(stone.pieces),
      id: generateRequirementId(),
    })),
    details: { ...item.details },
    references: importReferences(item.media ?? []),
    notes: item.notes || item.details?.specialNotes || "",
  };
}

export function importOrderRequirement(
  order: BackendOrderRow,
): RequirementDraft {
  const product =
    order.customProduct ??
    (order.productDetails && "stones" in order.productDetails
      ? order.productDetails
      : null);
  if (!product)
    throw new Error("This order's custom product details are unavailable.");
  const specification = product.requirementSpecification;
  return {
    id: generateRequirementId(),
    referenceProductCode: product.referenceProductCode || "",
    category: formOption(
      product.category === "EARRING"
        ? "Earrings"
        : product.category === "ACCESSORY"
          ? "Accessories"
          : product.category,
      PRODUCT_CATEGORIES,
    ),
    metalType: formOption(product.metalType, METAL_TYPES),
    metalPurity: product.metalPurity || "",
    metalWeight: product.metalNetWeight || "",
    diamonds: (specification?.diamonds ?? []).map((diamond) => ({
      ...diamond,
      id: generateRequirementId(),
    })),
    colorStones: (
      specification?.colorStones ??
      (specification?.diamonds?.length
        ? []
        : product.stones.map((stone) => ({
            stoneType: stone.stoneType,
            pieces: String(stone.approxPieces),
            weight: stone.netWeight,
          })))
    ).map((stone) => ({ ...stone, id: generateRequirementId() })),
    details: {
      orderType: "Client",
      productSize:
        product.size === undefined ? undefined : String(product.size),
      metalColor: formOption(product.metalColor || "", METAL_COLOURS),
      ...specification?.details,
      deliveryDate: order.estimatedDeliveryDate?.slice(0, 10) || "",
    },
    references: importReferences(specification?.references ?? []),
    notes: order.notes ?? specification?.notes ?? "",
  };
}
