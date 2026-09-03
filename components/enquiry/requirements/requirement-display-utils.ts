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
  videos: EnquiryReference[];
  audios: EnquiryReference[];
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
  const normalized = value?.trim().toUpperCase();
  const karat = normalized?.match(/^(9|14|18|22|24)\s*K(?:T)?$/)?.[1];

  return karat ? (`${karat}K` as MetalPurity) : "22K";
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
    const metal = [
      product.metalType,
      getDisplayMetalPurity(product.metalPurity),
    ]
      .filter(Boolean)
      .join(" ");

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
      videos: references.filter((item) => item.type === "video"),
      audios: references.filter((item) => item.type === "audio"),
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
    const metal = [
      product.metalType,
      getDisplayMetalPurity(product.metalPurity),
    ]
      .filter(Boolean)
      .join(" ");
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
      images: (product.references ?? []).filter(
        (item) => item.type === "image",
      ),
      videos: (product.references ?? []).filter(
        (item) => item.type === "video",
      ),
      audios: (product.references ?? []).filter(
        (item) => item.type === "audio",
      ),
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

export function getDisplayMetalPurity(value?: string | null) {
  if (!hasValue(value) || value?.trim().toLowerCase() === "other") {
    return undefined;
  }

  return value;
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
