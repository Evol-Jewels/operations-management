export const REPAIR_FLOW_STAGES = [
  "New",
  "Ready for Repair",
  "Dispatched",
  "Vendor",
  "Shipping",
  "At Store",
  "Closed",
] as const;
export const REPAIR_STAGES = [...REPAIR_FLOW_STAGES, "Cancelled"] as const;

export type RepairStage = (typeof REPAIR_STAGES)[number];
export type RepairMedia = { id: string; name: string; file: Blob };
export type RepairComment = {
  id: string;
  message: string;
  timestamp: string;
  author: { id: string; name: string; image?: string | null };
  attachments: (RepairMedia & { type: "image" | "video" | "audio" })[];
};
export type RepairReference = {
  id: string;
  type: "image" | "video" | "audio" | "link";
  name: string;
  url?: string;
  file?: Blob;
  mimeType?: string;
  size?: number;
  durationSeconds?: number;
};
export type RepairVendor = {
  vendorName: string;
  vendorEstimateDate: string;
  deliveryDate: string;
};
export type RepairProduct = {
  category: string;
  barcode: string;
  grossWeight: string;
  netWeight: string;
  purity: string;
  metalColor: string;
  diamondCarats: string;
  diamondPieces: string;
  productRemarks: string;
};
export type RepairDraft = RepairProduct & {
  productType: "Customer" | "Stock";
  customerName: string;
  customerPhone: string;
  repairRemarks: string;
  images: RepairMedia[];
  video?: RepairMedia;
  references?: RepairReference[];
  vendor?: RepairVendor;
};
export type Repair = RepairDraft & {
  id: string;
  refCode: string;
  stage: RepairStage;
  createdAt: string;
  updatedAt: string;
  history: { stage: RepairStage; timestamp: string; message?: string }[];
  comments?: RepairComment[];
};

export const EMPTY_REPAIR: RepairDraft = {
  category: "",
  productType: "Customer",
  customerName: "",
  customerPhone: "",
  barcode: "",
  grossWeight: "",
  netWeight: "",
  purity: "",
  metalColor: "",
  diamondCarats: "",
  diamondPieces: "",
  productRemarks: "",
  repairRemarks: "",
  images: [],
};

export const REPAIR_VENDORS = [
  "Evol Workshop",
  "Diamond Care Studio",
  "Goldcraft Repairs",
];
export function prepareRepairMedia(references: RepairReference[]) {
  const stored = references.map(
    ({ id, type, name, url, file, mimeType, size, durationSeconds }) => ({
      id,
      type,
      name,
      url: type === "link" ? url : undefined,
      file,
      mimeType,
      size,
      durationSeconds,
    }),
  );
  const images: RepairMedia[] = [];
  let video: RepairMedia | undefined;
  for (const reference of stored) {
    if (!reference.file) continue;
    const media = {
      id: reference.id,
      name: reference.name,
      file: reference.file,
    };
    if (reference.type === "image") images.push(media);
    if (reference.type === "video" && !video) video = media;
  }
  return { images, video, references: stored };
}

export function validateRepair(draft: RepairDraft) {
  const errors: Partial<Record<keyof RepairDraft, string>> = {};
  if (!draft.barcode.trim()) errors.barcode = "Enter the product barcode.";
  if (!draft.category?.trim()) errors.category = "Select the product category.";
  const vendorErrors = validateRepairVendor(draft.vendor, false);
  if (Object.keys(vendorErrors).length)
    errors.vendor = "Enter valid vendor and delivery dates.";
  if (draft.productType === "Customer") {
    if (!draft.customerName.trim())
      errors.customerName = "Enter the customer name.";
    if (
      !/^\+?[\d\s()-]{7,20}$/.test(draft.customerPhone.trim()) ||
      draft.customerPhone.replace(/\D/g, "").length < 7
    )
      errors.customerPhone = "Enter a valid customer phone number.";
  }
  for (const key of ["grossWeight", "netWeight"] as const) {
    if (
      !draft[key].trim() ||
      !Number.isFinite(Number(draft[key])) ||
      Number(draft[key]) <= 0
    )
      errors[key] = "Enter a weight greater than zero.";
  }
  if (
    !errors.grossWeight &&
    !errors.netWeight &&
    Number(draft.netWeight) > Number(draft.grossWeight)
  )
    errors.netWeight = "Net weight cannot exceed gross weight.";
  if (!draft.purity.trim()) errors.purity = "Select the purity.";
  if (!draft.metalColor.trim()) errors.metalColor = "Select the metal color.";
  for (const key of ["diamondCarats", "diamondPieces"] as const) {
    if (
      draft[key] &&
      (!Number.isFinite(Number(draft[key])) ||
        Number(draft[key]) < 0 ||
        (key === "diamondPieces" && !Number.isInteger(Number(draft[key]))))
    )
      errors[key] =
        key === "diamondPieces"
          ? "Enter a whole number of pieces, zero or more."
          : "Enter zero or more carats.";
  }
  if (!draft.images.length) errors.images = "Add at least one product image.";
  if (!draft.repairRemarks.trim())
    errors.repairRemarks = "Describe the repair work required.";
  return errors;
}

export function moveRepair(
  repair: Repair,
  stage: RepairStage,
  vendor = repair.vendor,
): Repair {
  if (isRepairTerminal(repair.stage))
    throw new Error("Closed and cancelled repairs cannot change stage.");
  if (
    stage !== "Cancelled" &&
    Math.abs(
      REPAIR_STAGES.indexOf(stage) - REPAIR_STAGES.indexOf(repair.stage),
    ) !== 1
  )
    throw new Error("Move a repair one stage forward or back at a time.");
  if (
    repair.stage === "New" &&
    stage === "Ready for Repair" &&
    Object.keys(validateRepairVendor(vendor)).length > 0
  )
    throw new Error(
      "Vendor name, vendor estimate date and delivery date are required.",
    );
  const timestamp = new Date().toISOString();
  return {
    ...repair,
    stage,
    vendor,
    updatedAt: timestamp,
    history: [...repair.history, { stage, timestamp }],
  };
}

export function isRepairTerminal(stage: RepairStage) {
  return stage === "Closed" || stage === "Cancelled";
}

export function appendRepairComment(
  repair: Repair,
  comment: RepairComment,
): Repair {
  const message = comment.message.trim();
  if (!message) throw new Error("Enter a comment before posting.");
  return {
    ...repair,
    updatedAt: comment.timestamp,
    comments: [...(repair.comments ?? []), { ...comment, message }],
  };
}

export function validateRepairVendor(vendor?: RepairVendor, required = true) {
  const errors: Partial<Record<keyof RepairVendor, string>> = {};
  if (required && !vendor?.vendorName.trim())
    errors.vendorName = "Enter the vendor name.";
  for (const key of ["vendorEstimateDate", "deliveryDate"] as const) {
    const value = vendor?.[key] ?? "";
    if ((required || value) && !isRepairDate(value))
      errors[key] = "Select a valid date.";
  }
  return errors;
}

export function isRepairDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00`);
  return (
    !Number.isNaN(date.getTime()) &&
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}` ===
      value
  );
}
