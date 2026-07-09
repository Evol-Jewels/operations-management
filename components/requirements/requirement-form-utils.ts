import type { ProductReference } from "@/components/enquiries/enquiry-form-types";
import type { BackendEnquiryMedia } from "@/types/enquiry-api";
import type {
  RequirementColorStone,
  RequirementDiamond,
  RequirementDraft,
} from "./requirement-form-types";

export const DEFAULT_ORDER_TYPE = "Client";
export const DEFAULT_METAL_TYPE = "Gold";
export const DEFAULT_DIAMOND_TYPE = "Lab Grown";
export const DEFAULT_DIAMOND_METHOD = "CVD";
export const DEFAULT_DIAMOND_CLARITY = "VVS/ES";
export const DEFAULT_DIAMOND_COLOUR = "EF";
export const DEFAULT_COLOR_STONE_NATURE = "Lab Grown";

export function generateRequirementId() {
  return Math.random().toString(36).slice(2, 9);
}

export function createEmptyDiamond(): RequirementDiamond {
  return {
    id: generateRequirementId(),
    type: DEFAULT_DIAMOND_TYPE,
    growthMethod: DEFAULT_DIAMOND_METHOD,
    shape: "",
    clarity: DEFAULT_DIAMOND_CLARITY,
    colour: DEFAULT_DIAMOND_COLOUR,
    size: "",
    pieces: "",
    weight: "",
    notes: "",
  };
}

export function createEmptyColorStone(): RequirementColorStone {
  return {
    id: generateRequirementId(),
    stoneType: "",
    nature: DEFAULT_COLOR_STONE_NATURE,
    origin: "",
    treatment: "",
    weight: "",
    notes: "",
  };
}

export function createEmptyRequirement(): RequirementDraft {
  return {
    id: "",
    category: "",
    metalType: DEFAULT_METAL_TYPE,
    metalPurity: "",
    metalWeight: "",
    diamonds: [createEmptyDiamond()],
    colorStones: [],
    details: {
      orderType: DEFAULT_ORDER_TYPE,
    },
    references: [],
    notes: "",
  };
}

function isDefaultDiamond(diamond: RequirementDiamond) {
  return (
    diamond.type === DEFAULT_DIAMOND_TYPE &&
    diamond.growthMethod === DEFAULT_DIAMOND_METHOD &&
    diamond.clarity === DEFAULT_DIAMOND_CLARITY &&
    diamond.colour === DEFAULT_DIAMOND_COLOUR &&
    !diamond.shape?.trim() &&
    !diamond.size?.trim() &&
    !diamond.pieces?.trim() &&
    !diamond.weight?.trim() &&
    !diamond.notes?.trim()
  );
}

function isDefaultColorStone(stone: RequirementColorStone) {
  return (
    !stone.stoneType?.trim() &&
    stone.nature === DEFAULT_COLOR_STONE_NATURE &&
    !stone.origin?.trim() &&
    !stone.treatment?.trim() &&
    !stone.weight?.trim() &&
    !stone.notes?.trim()
  );
}

export function normalizeReferenceLink(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function isValidReferenceLink(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function formatFileSize(size?: number): string {
  if (!size) return "";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function revokeReferenceUrls(references: ProductReference[]) {
  for (const reference of references) {
    if (reference.type !== "link" && reference.url.startsWith("blob:")) {
      URL.revokeObjectURL(reference.url);
    }
  }
}

export function hasRequirementContent(requirement: RequirementDraft) {
  const details = requirement.details;

  return Boolean(
    requirement.category.trim() ||
      (requirement.metalType && requirement.metalType !== DEFAULT_METAL_TYPE) ||
      requirement.metalPurity.trim() ||
      requirement.metalWeight.trim() ||
      requirement.references.length ||
      requirement.notes.trim() ||
      (details.orderType && details.orderType !== DEFAULT_ORDER_TYPE) ||
      details.productSize?.trim() ||
      details.subcategory?.trim() ||
      details.polish?.trim() ||
      details.certification?.trim() ||
      details.metalColor?.trim() ||
      details.settingType?.trim() ||
      details.findingType?.trim() ||
      details.budgetRange?.trim() ||
      details.deliveryDate?.trim() ||
      details.specialNotes?.trim() ||
      requirement.diamonds.some((diamond) =>
        isDefaultDiamond(diamond)
          ? false
          : Object.entries(diamond).some(
              ([key, value]) => key !== "id" && String(value ?? "").trim(),
            ),
      ) ||
      requirement.colorStones.some((stone) =>
        isDefaultColorStone(stone)
          ? false
          : Object.entries(stone).some(
              ([key, value]) => key !== "id" && String(value ?? "").trim(),
            ),
      ),
  );
}

export function cleanText(value?: string) {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

export function cleanDiamond(diamond: RequirementDiamond) {
  return {
    id: diamond.id,
    type: cleanText(diamond.type),
    growthMethod: cleanText(diamond.growthMethod),
    shape: cleanText(diamond.shape),
    clarity: cleanText(diamond.clarity),
    colour: cleanText(diamond.colour),
    size: cleanText(diamond.size),
    pieces: cleanText(diamond.pieces),
    weight: cleanText(diamond.weight),
    notes: cleanText(diamond.notes),
  };
}

export function cleanColorStone(stone: RequirementColorStone) {
  return {
    id: stone.id,
    stoneType: cleanText(stone.stoneType),
    nature: cleanText(stone.nature),
    origin: cleanText(stone.origin),
    treatment: cleanText(stone.treatment),
    weight: cleanText(stone.weight),
    notes: cleanText(stone.notes),
  };
}

export function mediaFromReference(reference: ProductReference): BackendEnquiryMedia | null {
  if (reference.type === "link") {
    return { type: "LINK", url: reference.url, name: reference.name };
  }
  if (!reference.url.startsWith("http")) return null;

  return {
    type: reference.type === "image" ? "IMAGE" : "VIDEO",
    url: reference.url,
    name: reference.name,
    mimeType: reference.mimeType,
    size: reference.size,
  };
}
