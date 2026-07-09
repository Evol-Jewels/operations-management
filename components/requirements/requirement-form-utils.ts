import type { ProductReference } from "@/components/enquiries/enquiry-form-types";
import type { BackendEnquiryMedia } from "@/types/enquiry-api";
import type {
  RequirementColorStone,
  RequirementDiamond,
  RequirementDraft,
} from "./requirement-form-types";

export function generateRequirementId() {
  return Math.random().toString(36).slice(2, 9);
}

export function createEmptyDiamond(): RequirementDiamond {
  return {
    id: generateRequirementId(),
    type: "",
    growthMethod: "",
    shape: "",
    clarity: "",
    colour: "",
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
    nature: "",
    origin: "",
    treatment: "",
    shape: "",
    colour: "",
    size: "",
    pieces: "",
    weight: "",
    notes: "",
  };
}

export function createEmptyRequirement(): RequirementDraft {
  return {
    id: "",
    category: "",
    metalType: "",
    metalPurity: "",
    metalWeight: "",
    diamonds: [createEmptyDiamond()],
    colorStones: [createEmptyColorStone()],
    details: {},
    references: [],
    notes: "",
  };
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
  return Boolean(
    requirement.category.trim() ||
      requirement.metalType.trim() ||
      requirement.metalPurity.trim() ||
      requirement.references.length ||
      requirement.diamonds.some((diamond) =>
        Object.entries(diamond).some(
          ([key, value]) => key !== "id" && String(value ?? "").trim(),
        ),
      ) ||
      requirement.colorStones.some((stone) =>
        Object.entries(stone).some(
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
    shape: cleanText(stone.shape),
    colour: cleanText(stone.colour),
    size: cleanText(stone.size),
    pieces: cleanText(stone.pieces),
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
