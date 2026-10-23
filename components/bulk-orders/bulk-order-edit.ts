import type { RequirementDraft } from "@/components/requirements/requirement-form-types";
import type {
  BackendBulkOrderDetails,
  BackendBulkOrderItem,
  BackendQuotationBreakdown,
  BulkCustomProductInput,
  UpdateBulkOrderInput,
  UpdateBulkOrderItemInput,
} from "@/types/bulk-order-api";

export function moneyToCents(value: string, signed = false) {
  const pattern = signed
    ? /^-?\d{1,12}(\.\d{1,2})?$/
    : /^\d{1,12}(\.\d{1,2})?$/;
  const text = value.trim();
  if (!pattern.test(text))
    throw new Error("Enter amounts using digits and up to 2 decimal places.");
  const [whole, fraction = ""] = text.replace(/^-/, "").split(".");
  const cents = BigInt(whole) * BigInt(100) + BigInt(fraction.padEnd(2, "0"));
  return text.startsWith("-") ? -cents : cents;
}

export function centsToMoney(value: bigint) {
  const absolute = value < BigInt(0) ? -value : value;
  return `${value < BigInt(0) ? "-" : ""}${absolute / BigInt(100)}.${String(absolute % BigInt(100)).padStart(2, "0")}`;
}

export function quotationSubtotal(quote: BackendQuotationBreakdown) {
  return centsToMoney(
    [
      quote.metal,
      quote.labour,
      ...quote.diamonds,
      ...quote.colorStones,
      ...quote.other,
      { amount: quote.setting },
    ].reduce((sum, row) => sum + moneyToCents(row.amount), BigInt(0)),
  );
}

export function createHeaderDraft(order: BackendBulkOrderDetails) {
  return {
    vendorId: order.vendorId,
    vendorCity: order.vendorCity ?? "",
    packingListNumber: order.packingListNumber,
    quotationDate: order.quotationDate,
    expectedDeliveryDate: order.expectedDeliveryDate,
    quotedSubtotal: order.quotedSubtotal,
    taxRate: order.taxRate,
    taxAmount: order.taxAmount,
    roundingAmount: order.roundingAmount,
    quotedTotal: order.quotedTotal,
    documentUrl: order.documentUrl ?? "",
  };
}

function changedFields<T extends object>(next: T, previous: T): Partial<T> {
  const serialize = (value: unknown) =>
    JSON.stringify(value, (_key, field: unknown) =>
      field !== null && typeof field === "object" && !Array.isArray(field)
        ? Object.fromEntries(
            Object.entries(field).sort(([left], [right]) =>
              left.localeCompare(right),
            ),
          )
        : field,
    );
  return Object.fromEntries(
    Object.entries(next).filter(
      ([key, value]) =>
        serialize(value) !== serialize(previous[key as keyof T]),
    ),
  ) as Partial<T>;
}

export function buildHeaderPatch(
  draft: ReturnType<typeof createHeaderDraft>,
  order: BackendBulkOrderDetails,
): UpdateBulkOrderInput {
  if (!draft.vendorId) throw new Error("Select a saved vendor.");
  if (!draft.packingListNumber.trim())
    throw new Error("Enter a packing-list number.");
  if (!draft.quotationDate || !draft.expectedDeliveryDate)
    throw new Error("Quotation and expected delivery dates are required.");
  if (
    !/^\d{1,3}(\.\d{1,2})?$/.test(draft.taxRate.trim()) ||
    Number(draft.taxRate) > 100
  )
    throw new Error(
      "Tax rate must be between 0 and 100 with up to 2 decimal places.",
    );
  if (draft.documentUrl && !URL.canParse(draft.documentUrl))
    throw new Error("Enter a valid document URL.");
  const normalized = {
    ...draft,
    packingListNumber: draft.packingListNumber.trim(),
    vendorCity: draft.vendorCity.trim() || null,
    documentUrl: draft.documentUrl.trim() || null,
    quotedSubtotal: centsToMoney(moneyToCents(draft.quotedSubtotal)),
    taxRate: centsToMoney(moneyToCents(draft.taxRate)),
    taxAmount: centsToMoney(moneyToCents(draft.taxAmount)),
    roundingAmount: centsToMoney(moneyToCents(draft.roundingAmount, true)),
    quotedTotal: centsToMoney(moneyToCents(draft.quotedTotal)),
  };
  const previous = {
    ...createHeaderDraft(order),
    vendorCity: order.vendorCity,
    documentUrl: order.documentUrl,
    taxRate: centsToMoney(moneyToCents(order.taxRate)),
  };
  return changedFields(normalized, previous);
}

export function createItemDraft(item: BackendBulkOrderItem): RequirementDraft {
  const product = item.customProduct;
  const spec = product?.requirementSpecification;
  return {
    id: item.id,
    referenceProductCode: "",
    category: product?.category ?? "OTHER",
    metalType: product?.metalType ?? "",
    metalPurity: product?.metalPurity ?? "",
    metalWeight: product?.metalNetWeight ?? "",
    diamonds: (spec?.diamonds ?? []).map((row) => ({
      ...row,
      id: row.id ?? crypto.randomUUID(),
    })),
    colorStones: (spec?.colorStones ?? []).map((row) => ({
      ...row,
      id: row.id ?? crypto.randomUUID(),
    })),
    details: {
      ...spec?.details,
      ...(spec?.details?.metalColor
        ? {}
        : product?.metalColor
          ? {
              metalColor:
                product.metalColor.charAt(0) +
                product.metalColor.slice(1).toLowerCase(),
            }
          : {}),
    },
    references: [],
    notes: spec?.notes ?? "",
  };
}

const categories: BulkCustomProductInput["category"][] = [
  "RING",
  "NECKLACE",
  "EARRING",
  "BRACELET",
  "PENDANT",
  "BANGLE",
  "ANKLET",
  "ACCESSORY",
  "CHAIN",
  "OTHER",
];
const clean = (value?: string | null) => value?.trim() || undefined;

export function buildProductInput(
  item: BackendBulkOrderItem,
  draft: RequirementDraft,
  weights: { size: string; gross: string; pure: string },
): BulkCustomProductInput {
  const categoryAliases: Record<string, BulkCustomProductInput["category"]> = {
    EARRINGS: "EARRING",
    ACCESSORIES: "ACCESSORY",
    TANMANIA: "NECKLACE",
  };
  const categoryName = draft.category.toUpperCase();
  const category =
    categoryAliases[categoryName] ??
    categories.find((value) => value === categoryName);
  if (!category) throw new Error("Select a supported product category.");
  for (const value of [draft.metalWeight, weights.gross, weights.pure]) {
    if (
      value &&
      (!/^\d{1,7}(\.\d{1,3})?$/.test(value) || Number(value) > 9999999.999)
    )
      throw new Error(
        "Weights must be non-negative with up to 3 decimal places.",
      );
  }
  if (
    weights.size &&
    (!/^\d{1,10}(\.\d{1,2})?$/.test(weights.size) ||
      Number(weights.size) <= 0 ||
      Number(weights.size) > 9999999999.99)
  )
    throw new Error("Size must be positive with up to 2 decimal places.");
  return {
    category,
    metalType: clean(draft.metalType),
    metalPurity: clean(draft.metalPurity),
    metalColor: item.customProduct?.metalColor ?? undefined,
    size: weights.size ? Number(weights.size) : undefined,
    metalNetWeight: clean(draft.metalWeight),
    metalGrossWeight: clean(weights.gross),
    metalPureWeight: clean(weights.pure),
    stones: item.customProduct?.stones ?? [],
  };
}

export function syncStoneQuotes(
  quote: BackendQuotationBreakdown,
  draft: RequirementDraft,
): BackendQuotationBreakdown {
  const rows = (key: "diamonds" | "colorStones") =>
    draft[key].map(
      (stone) =>
        quote[key].find((row) => row.specId === stone.id) ?? {
          specId: stone.id,
          amount: "0.00",
        },
    );
  return {
    ...quote,
    diamonds: rows("diamonds"),
    colorStones: rows("colorStones"),
  };
}

export function buildItemPatch(
  item: BackendBulkOrderItem,
  input: UpdateBulkOrderItemInput,
): UpdateBulkOrderItemInput {
  if (
    input.vendorDesignNumber !== undefined &&
    !input.vendorDesignNumber.trim()
  )
    throw new Error("Enter a vendor design number.");
  if (
    input.quantity !== undefined &&
    (!Number.isInteger(input.quantity) ||
      input.quantity < 1 ||
      input.quantity > 2147483647)
  )
    throw new Error("Quantity must be a positive whole number.");
  const product = item.customProduct;
  if (!product) throw new Error("This line has no product specification.");
  const oldDraft = createItemDraft(item);
  const previous: UpdateBulkOrderItemInput = {
    vendorDesignNumber: item.vendorDesignNumber,
    quantity: item.quantity,
    isCadRequired: item.isCadRequired,
    estimatedDeliveryDate: item.estimatedDeliveryDate,
    vendorDeliveryDate: item.vendorDeliveryDate,
    notes: item.notes,
    customProduct: buildProductInput(item, oldDraft, {
      size: product.size == null ? "" : String(product.size),
      gross: product.metalGrossWeight ?? "",
      pure: product.metalPureWeight ?? "",
    }),
    requirementSpecification: {
      ...product.requirementSpecification,
      details: { ...oldDraft.details },
      diamonds: oldDraft.diamonds.map((row) => ({ ...row })),
      colorStones: oldDraft.colorStones.map((row) => ({ ...row })),
      notes: clean(oldDraft.notes),
    },
    quotedSubtotal: item.quotedSubtotal,
    quotationBreakdown: item.quotationBreakdown,
  };
  return changedFields(input, previous);
}
