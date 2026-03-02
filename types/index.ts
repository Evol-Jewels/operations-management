// ─── Pipeline Stages ────────────────────────────────────────────────────────

export const STAGES = [
  "Enquiry",
  "Estimation",
  "CAD Design",
  "Order Confirmed",
  "Building",
  "Certification",
  "Shipped to Store",
  "Customer Pickup",
] as const;

export type Stage = (typeof STAGES)[number];

// ─── Record Type ─────────────────────────────────────────────────────────────

export type RecordType = "enquiry" | "order";

// ─── Urgency ─────────────────────────────────────────────────────────────────

export type UrgencyLevel = "overdue" | "due-soon" | "on-track" | "none";

// ─── Risk signals ─────────────────────────────────────────────────────────────

/**
 * Risk signal beyond simple delivery-date urgency.
 * - "stale": no activity posted in 7+ days (someone needs to check in)
 * - "stuck": sitting in current stage longer than expected for that stage
 * - null: no risk signal
 */
export type RiskSignal = "stale" | "stuck" | null;

/**
 * Expected maximum number of days an order should stay in a given stage
 * before it's considered "stuck". Terminal stages are excluded.
 */
export const STAGE_EXPECTED_DAYS: Partial<Record<Stage, number>> = {
  Enquiry: 2,
  Estimation: 3,
  "CAD Design": 5,
  "Order Confirmed": 2,
  Building: 10,
  Certification: 5,
  "Shipped to Store": 3,
  // "Customer Pickup" is terminal — no expected duration
};

// ─── Actor Roles ─────────────────────────────────────────────────────────────

export type ActorRole = "sales" | "vendor" | "owner" | "customer";

export const ACTOR_ROLE_LABELS: Record<ActorRole, string> = {
  sales: "Sales",
  vendor: "Vendor",
  owner: "Owner",
  customer: "Customer",
};

// Role → color token (used for avatar bg + badge)
export const ACTOR_ROLE_COLORS: Record<
  ActorRole,
  {
    bg: string; // avatar background
    text: string; // avatar text
    badge: string; // role badge
    dot: string; // timeline dot fill (solid color class)
    dotSolid: string; // solid bg for compose dot indicator
  }
> = {
  sales: {
    bg: "bg-blue-100 dark:bg-blue-950",
    text: "text-blue-700 dark:text-blue-300",
    badge:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
    dot: "border-blue-400 bg-blue-100 dark:border-blue-600 dark:bg-blue-950",
    dotSolid: "bg-blue-400 dark:bg-blue-500",
  },
  vendor: {
    bg: "bg-amber-100 dark:bg-amber-950",
    text: "text-amber-700 dark:text-amber-300",
    badge:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
    dot: "border-amber-400 bg-amber-100 dark:border-amber-600 dark:bg-amber-950",
    dotSolid: "bg-amber-400 dark:bg-amber-500",
  },
  owner: {
    bg: "bg-purple-100 dark:bg-purple-950",
    text: "text-purple-700 dark:text-purple-300",
    badge:
      "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800",
    dot: "border-purple-400 bg-purple-100 dark:border-purple-600 dark:bg-purple-950",
    dotSolid: "bg-purple-400 dark:bg-purple-500",
  },
  customer: {
    bg: "bg-emerald-100 dark:bg-emerald-950",
    text: "text-emerald-700 dark:text-emerald-300",
    badge:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
    dot: "border-emerald-400 bg-emerald-100 dark:border-emerald-600 dark:bg-emerald-950",
    dotSolid: "bg-emerald-400 dark:bg-emerald-500",
  },
};

// ─── Product ─────────────────────────────────────────────────────────────────

export type JewelleryCategory =
  | "Ring"
  | "Necklace"
  | "Bracelet"
  | "Earrings"
  | "Bangle"
  | "Pendant"
  | "Chain"
  | "Brooch"
  | "Other";

export type MetalType =
  | "Gold"
  | "Silver"
  | "Platinum"
  | "Rose Gold"
  | "White Gold";

export type MetalPurity =
  | "18K"
  | "22K"
  | "24K"
  | "925 Sterling"
  | "950 Platinum"
  | "Other";

export type CertificationType = "Jewellery" | "GIA" | "IGI" | "SGL" | "None";

// ─── Activity Feed Entry ──────────────────────────────────────────────────────

export type ActivityEntryType =
  | "order_created" // auto-generated system event at creation
  | "stage_change" // moved to a new stage
  | "note" // human message / update
  | "file_upload"; // file or photo attached

export interface ActivityEntry {
  id: string;
  orderId: string;
  postedBy: string;
  actorRole?: ActorRole; // who posted — sales, vendor, owner, customer
  timestamp: string; // ISO 8601
  type: ActivityEntryType;
  note?: string;
  newStage?: Stage;
  previousStage?: Stage; // for stage_change entries — what it moved FROM
  file?: {
    url: string;
    filename: string;
    fileType: "image" | "pdf" | "other";
  };
}

// ─── Order / Enquiry ──────────────────────────────────────────────────────────

export interface Order {
  id: string;
  type: RecordType;
  orderNumber?: string;
  shareableToken: string;

  // Customer
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;

  // Staff
  salespersonName: string;
  vendorName?: string;

  // Product
  category: JewelleryCategory;
  metalType: MetalType;
  metalPurity: MetalPurity;
  metalWeight?: number;
  polish?: string;

  // Stones
  stoneDescription?: string;
  stoneQuality?: string;
  stoneCut?: string;
  stoneCaratEstimate?: number;

  // Sizing
  ringSize?: string;
  chainLength?: string;
  bangleSize?: string;

  // Order specifics
  certification: CertificationType;
  cadDesignRequired: boolean;
  advancePaid?: number;
  totalEstimate?: number;
  deliveryDate?: string;

  // Pipeline
  currentStage: Stage;
  createdAt: string;
  lastUpdatedAt: string;

  // Activity
  activityFeed: ActivityEntry[];

  // Extra
  specialInstructions?: string;
  budgetRange?: string;
  occasion?: string;
  timelineNotes?: string;
}
