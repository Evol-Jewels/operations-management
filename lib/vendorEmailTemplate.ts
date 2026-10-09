export function buildVendorEmailSubject(refCode: number, itemTitle: string) {
  return `Order #${refCode} – ${itemTitle}`;
}

export function buildVendorEmailBody(refCode: number, itemTitle: string) {
  return [
    "Hello,",
    `Please find attached the specification for order #${refCode} – ${itemTitle}.`,
    "Kindly confirm receipt and the expected delivery date.",
    "Regards,\nEvol Jewels",
  ].join("\n\n");
}
