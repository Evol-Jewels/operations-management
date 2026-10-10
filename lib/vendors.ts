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
