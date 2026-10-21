export interface Vendor {
  vendorId: string;
  name: string;
  email: string | null;
}

export interface VendorInput {
  name: string;
  email: string | null;
}

export function findOrderVendor(
  vendors: Vendor[],
  vendorId?: string | null,
  vendorName?: string | null,
) {
  if (vendorId) return vendors.find((vendor) => vendor.vendorId === vendorId);
  const name = vendorName?.trim().toLowerCase();
  return name
    ? vendors.find((vendor) => vendor.name.toLowerCase() === name)
    : undefined;
}

export const UNLINKED_VENDOR = "unlinked";

/** "ALL", "unlinked" (no linked vendor) or a vendor id. */
export type VendorFilter = string;

export function getVendorFilterLabel(value: VendorFilter, vendors: Vendor[]) {
  if (value === "ALL") return "All vendors";
  if (value === UNLINKED_VENDOR) return "No linked vendor";
  return (
    vendors.find((vendor) => vendor.vendorId === value)?.name ??
    "Selected vendor"
  );
}
