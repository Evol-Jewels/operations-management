import type { CalculatorFormState } from "@/types";

const IMPORT_STORAGE_PREFIX = "evol:calculator-import:";

export function queueCalculatorImport(
  form: CalculatorFormState,
  storage: Pick<Storage, "setItem"> = sessionStorage,
) {
  const token = crypto.randomUUID();
  storage.setItem(
    `${IMPORT_STORAGE_PREFIX}${token}`,
    JSON.stringify({ form, isGstEdited: false, isMakingChargeEdited: true }),
  );
  return `/calculator?tab=calculate&import=${token}`;
}

export function consumeCalculatorImport(
  token: string,
  storage: Pick<Storage, "getItem" | "removeItem"> = sessionStorage,
) {
  const key = `${IMPORT_STORAGE_PREFIX}${token}`;
  const value = storage.getItem(key);
  if (value !== null) storage.removeItem(key);
  return value;
}
