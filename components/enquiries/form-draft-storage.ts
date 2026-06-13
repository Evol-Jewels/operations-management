import type {
  EnquiryFormData,
  NewProduct,
  ProductReference,
} from "./enquiry-form-types";

export const ENQUIRY_DRAFT_KEY = "evol:new-enquiry:draft:v1";
export const CREATE_ORDER_DRAFT_KEY = "evol:new-order:draft:v1";

export function readDraft<T>(key: string): T | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    window.localStorage.removeItem(key);
    return null;
  }
}

export function writeDraft(key: string, value: unknown) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can fail in private mode or when quota is exceeded.
  }
}

export function removeDraft(key: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key);
}

export function sanitizeReferences(
  references: ProductReference[],
): ProductReference[] {
  return references
    .filter((reference) => reference.type === "link")
    .map(({ file: _file, ...reference }) => reference);
}

export function sanitizeNewProduct(product: NewProduct): NewProduct {
  return {
    ...product,
    references: sanitizeReferences(product.references),
  };
}

export function sanitizeEnquiryFormData(
  form: EnquiryFormData,
): EnquiryFormData {
  return {
    ...form,
    newProducts: form.newProducts.map(sanitizeNewProduct),
  };
}
