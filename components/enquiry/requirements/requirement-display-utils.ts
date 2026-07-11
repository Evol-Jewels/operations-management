import type {
  EnquiryColorStone,
  EnquiryCustomProduct,
  EnquiryDiamond,
  EnquiryItemDetails,
  EnquiryItemStatus,
  EnquiryReference,
  EnquirySelectedProduct,
  MetalPurity,
  ProductEstimation,
} from "@/types";

export type RequirementKind = "existing" | "custom";

export interface RequirementDisplayItem {
  id: string;
  kind: RequirementKind;
  title: string;
  subtitle: string;
  status: EnquiryItemStatus;
  defaultPurity: MetalPurity;
  references: EnquiryReference[];
  images: EnquiryReference[];
  links: EnquiryReference[];
  diamonds: EnquiryDiamond[];
  colorStones: EnquiryColorStone[];
  details: EnquiryItemDetails;
  metalType?: string;
  metalPurity?: string;
  metalWeight?: string;
  notes?: string;
  estimation?: ProductEstimation;
}

export function getItemStatus(status?: EnquiryItemStatus): EnquiryItemStatus {
  return status ?? "PENDING";
}

export function getDefaultPurity(value?: string): MetalPurity {
  return value && ["14K", "18K", "22K", "24K"].includes(value)
    ? (value as MetalPurity)
    : "22K";
}

export function normalizeRequirementItems({
  selectedProducts,
  customProducts,
  estimations,
}: {
  selectedProducts: EnquirySelectedProduct[];
  customProducts: EnquiryCustomProduct[];
  estimations: ProductEstimation[];
}): RequirementDisplayItem[] {
  const existingItems = selectedProducts.map((product) => {
    const references = product.references ?? imageReference(product.imageUrl);
    const metal = [product.metalType, product.metalPurity].filter(Boolean).join(" ");

    return {
      id: product.id,
      kind: "existing" as const,
      title: product.name,
      subtitle: [product.productCode, product.category, metal]
        .filter(Boolean)
        .join(" · "),
      status: getItemStatus(product.status),
      defaultPurity: product.metalPurity,
      references,
      images: references.filter((item) => item.type === "image"),
      links: references.filter((item) => item.type === "link"),
      diamonds: product.diamonds ?? [],
      colorStones: product.colorStones ?? [],
      details: product.details ?? {},
      metalType: product.metalType,
      metalPurity: product.metalPurity,
      notes: product.description,
      estimation: estimations.find((item) => item.productId === product.id),
    };
  });

  const customItems = customProducts.map((product) => {
    const details = product.details ?? {};
    const metal = [product.metalType, product.metalPurity].filter(Boolean).join(" ");
    const title = product.category || "Custom requirement";

    return {
      id: product.id,
      kind: "custom" as const,
      title,
      subtitle:
        [
          product.referenceProductCode
            ? `Ref ${product.referenceProductCode}`
            : null,
          details.subcategory,
          metal,
          details.productSize,
        ]
          .filter(Boolean)
          .join(" · ") || "Custom design",
      status: getItemStatus(product.status),
      defaultPurity: getDefaultPurity(product.metalPurity),
      references: product.references ?? [],
      images: (product.references ?? []).filter((item) => item.type === "image"),
      links: (product.references ?? []).filter((item) => item.type === "link"),
      diamonds: product.diamonds ?? [],
      colorStones: product.colorStones ?? [],
      details,
      metalType: product.metalType,
      metalPurity: product.metalPurity,
      metalWeight: product.metalWeight,
      notes: product.notes ?? details.specialNotes,
      estimation: estimations.find((item) => item.productId === product.id),
    };
  });

  return [...existingItems, ...customItems];
}

function imageReference(imageUrl?: string): EnquiryReference[] {
  return imageUrl
    ? [
        {
          id: `image-${imageUrl}`,
          type: "image",
          name: imageUrl,
          url: imageUrl,
        },
      ]
    : [];
}

export function hasValue(value: unknown) {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

export function compactUrl(url?: string) {
  if (!url) return "Reference";
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.replace(/\/$/, "");
    return `${parsed.hostname}${path ? path.slice(0, 24) : ""}`;
  } catch {
    return url;
  }
}
