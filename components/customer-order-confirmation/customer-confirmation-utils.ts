export type AccessStep = "phone" | "otp" | "requirements";

export interface LocalConfirmation {
  confirmedAt: string;
}

export const OTP_LENGTH = 6;

export function getConfirmationStorageKey(refCode: string) {
  return `evol:customer-requirements:confirmed:${refCode}`;
}

export function readLocalConfirmation(
  refCode: string,
): LocalConfirmation | null {
  try {
    const raw = window.localStorage.getItem(getConfirmationStorageKey(refCode));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LocalConfirmation>;
    return typeof parsed.confirmedAt === "string"
      ? { confirmedAt: parsed.confirmedAt }
      : null;
  } catch {
    return null;
  }
}

function normalizePhoneNumber(value: string) {
  return value.replace(/\D/g, "").replace(/^00/, "");
}

export function phoneNumbersMatch(input: string, stored: string) {
  const enteredNumber = normalizePhoneNumber(input);
  const customerNumber = normalizePhoneNumber(stored);

  if (!enteredNumber || !customerNumber) return false;
  if (enteredNumber === customerNumber) return true;

  // The customer record can contain a local Indian number while PhoneInput
  // returns E.164. Only relax matching when one side is exactly 10 digits.
  return (
    (enteredNumber.length === 10 && customerNumber.endsWith(enteredNumber)) ||
    (customerNumber.length === 10 && enteredNumber.endsWith(customerNumber))
  );
}

export function maskPhoneNumber(value: string) {
  const digits = normalizePhoneNumber(value);
  if (digits.length < 4) return "your phone";
  return `••••••${digits.slice(-4)}`;
}

export function customerNamesMatch(input: string, customerName: string) {
  const normalize = (value: string) =>
    value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
  return normalize(input) === normalize(customerName);
}

export function formatConfirmedAt(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
