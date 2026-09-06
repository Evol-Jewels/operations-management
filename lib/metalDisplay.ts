import type { MetalType } from "@/types";

export function normalizeMetalType(value?: string | null): MetalType {
  const normalized = value?.trim().toUpperCase();

  if (!normalized || normalized === "GOLD" || normalized === "YELLOW") {
    return "Gold";
  }
  if (normalized === "WHITE" || normalized === "WHITE GOLD") {
    return "White Gold";
  }
  if (normalized === "ROSE" || normalized === "ROSE GOLD") {
    return "Rose Gold";
  }
  if (normalized === "SILVER") return "Silver";
  if (normalized === "PLATINUM") return "Platinum";

  return "Gold";
}

export function formatMetalTypeLabel(
  metalType: string,
  metalColor?: string,
): string {
  const normalizedType = metalType.trim();
  const normalizedColor = metalColor?.trim();

  if (normalizedType !== "Gold") return normalizedType;
  if (!normalizedColor) return "Yellow Gold";

  return `${normalizedColor} Gold`;
}
