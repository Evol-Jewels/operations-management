export function normalizeDiamondClarity(value?: string | null): string {
  return value?.trim() === "VVS/ES" ? "VVS/VS" : (value ?? "");
}
