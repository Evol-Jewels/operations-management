// ─── Pipeline Stages ────────────────────────────────────────────────────────

import type { BackendEnquiryStatus } from "@/types/enquiry-api";
import type { BackendOrderStatus } from "@/types/order-api";

export const STAGES = [
  "Enquiry",
  "Estimation",
  "New",
  "CAD Design",
  "Order Confirmed",
  "In Production",
  "Certification",
  "At Store",
  "In Transit",
  "Delivered",
  "Closed",
  "Cancelled",
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
  New: 2,
  "CAD Design": 5,
  "Order Confirmed": 2,
  "In Production": 10,
  Certification: 5,
  "At Store": 3,
  "In Transit": 3,
  // Delivered, Closed, and Cancelled are terminal.
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
  | "Accessory"
  | "Brooch"
  | "Other";

export type MetalType =
  | "Gold"
  | "Silver"
  | "Platinum"
  | "Rose Gold"
  | "White Gold";

export type MetalPurity = "14K" | "18K" | "22K" | "24K" | "Other";

export type CertificationType = "Jewellery" | "GIA" | "IGI" | "SGL" | "None";

export type CloseReason =
  | "Customer not interested"
  | "Out of budget"
  | "Product not available"
  | "Duplicate enquiry"
  | "Customer Ordered another product"
  | "Customer didn't respond for a month"
  | "Other";

// ─── Activity Feed Entry ──────────────────────────────────────────────────────

export type ActivityEntryType =
  | "order_created" // auto-generated system event at creation
  | "stage_change" // moved to a new stage
  | "comment" // user-posted message (rendered as a boxed bubble)
  | "file_upload" // file or photo attached
  | "enquiry_closed"
  | "item_added"
  | "estimation_added"
  | "system_note"; // any other backend activity log — rendered as a simple line using log.message

export interface PersonSummary {
  id: string;
  name: string;
  image?: string | null;
}

export interface ActivityEntry {
  id: string;
  orderId: string;
  postedBy: PersonSummary | string;
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

export type CustomerCategory = "VIP" | "Middle" | "Lower";

export type EnquiryReferenceType = "link" | "image" | "video";

export interface EnquiryReference {
  id: string;
  type: EnquiryReferenceType;
  name: string;
  url?: string;
  mediaId?: string;
  mimeType?: string;
  size?: number;
}

export interface EnquirySelectedProduct {
  id: string;
  productCode: string;
  name: string;
  category: JewelleryCategory;
  metalType: MetalType;
  metalPurity: MetalPurity;
  description?: string;
  imageUrl?: string;
  basePrice?: number;
  status?: EnquiryItemStatus;
}

export interface EnquiryCustomStone {
  id: string;
  stoneType: string;
  pieces?: number;
  weight?: number;
}

export interface EnquiryCustomProduct {
  id: string;
  category: string;
  metalType: string;
  metalPurity: string;
  polish: string;
  stones: EnquiryCustomStone[];
  stoneDescription: string;
  stoneCut: string;
  stoneQuality: string;
  stoneCaratEstimate?: number;
  references: EnquiryReference[];
  status?: EnquiryItemStatus;
}

export type EnquiryItemStatus =
  | "PENDING"
  | "ESTIMATED"
  | "CONVERTED"
  | "CLOSED";

// ─── Estimation Types ───────────────────────────────────────────────────────

export interface EstimationStoneDetail {
  id: string;
  type: string;
  netWeight: number;
  pieces: number;
}

export interface ProductEstimation {
  id: string;
  productId: string;
  metalWeight: number;
  purity: MetalPurity;
  stoneDetails: EstimationStoneDetail[];
  finalAmount: number;
  makingCost?: number;
  createdAt: string;
  vendorName?: string;
  notes?: string;
}

export interface RecentProductEstimate {
  id: string;
  productCode: string;
  imageUrl?: string | null;
  totalSearches: number;
  createdAt: string;
  updatedAt: string;
}

export interface RecentProductEstimatesQuery {
  productCode?: string;
  limit?: number;
  offset?: number;
}

export interface CalculatorStoneSlab {
  code: string;
  fromWeight: number;
  toWeight: number;
  pricePerCarat: number;
}

export interface CalculatorStoneType {
  stoneId: string;
  name: string;
  category: "Diamond" | "Gemstone";
  clarity?: string;
  color?: string;
  slabs: CalculatorStoneSlab[];
}

export interface CalculatorSettings {
  goldRate24k: number;
  makingChargeFlat: number;
  makingChargePerGram: number;
  gstRate: number;
  purityPercentages: Record<MetalPurity, number>;
  stoneTypes: CalculatorStoneType[];
}

export interface CalculatorStoneInput {
  id: string;
  stoneTypeId: string;
  weight: number;
  quantity: number;
  fixedRatePerCarat?: number;
  sourceStoneName?: string;
}

export interface CalculatorFormState {
  netGoldWeight: number;
  purity: MetalPurity;
  stones: CalculatorStoneInput[];
  gstRate: number;
  makingCharge: number;
  productName: string;
  productNote: string;
  productImageUrl?: string;
}

export interface CalculatorPricedStoneDetail extends CalculatorStoneInput {
  stoneType?: CalculatorStoneType;
  totalCost: number;
  slabInfo: CalculatorStoneSlab | null;
}

export interface CalculatorPricingBreakdown {
  grossWeight: number;
  goldRateValue: number;
  goldCost: number;
  makingCost: number;
  stoneDetails: CalculatorPricedStoneDetail[];
  totalStoneCost: number;
  subTotal: number;
  gst: number;
  gstRate: number;
  total: number;
}

export interface SystemConfig {
  id: string;
  key: string;
  value: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateSystemConfigInput {
  value: string;
}

export interface SpecialProductMakingCharge {
  id: string;
  productCode: string;
  makingCost: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

export interface CreateSpecialProductMakingChargeInput {
  productCode: string;
  makingCost: string;
  notes?: string;
}

export interface UpdateSpecialProductMakingChargeInput {
  productCode?: string;
  makingCost?: string;
  notes?: string | null;
}

// ─── Order / Enquiry ──────────────────────────────────────────────────────────

export interface Order {
  id: string;
  type: RecordType;
  orderNumber?: string;
  refCode?: number;

  // Customer
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  customerDob?: string;
  customerLocation?: string;
  customerCategory?: CustomerCategory;
  customerNotes?: string;

  // Staff
  salespersonName: string;
  createdBy?: PersonSummary;
  vendorName?: string;

  // Financial
  budget?: number;

  // Product
  category: JewelleryCategory;
  metalType: MetalType;
  metalPurity: MetalPurity;
  metalWeight?: number;
  grossWeight?: number;
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
  orderStatus?: BackendOrderStatus;
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
  sourceEnquiryId?: string;
  enquiryStatus?: BackendEnquiryStatus;
  selectedProducts?: EnquirySelectedProduct[];
  customProducts?: EnquiryCustomProduct[];

  // Close enquiry
  status?: "open" | "closed";
  closedAt?: string;
  closeReason?: CloseReason;
  closeNotes?: string;

  // Estimations
  estimations?: ProductEstimation[];
}

// ─── Product Lookup Types ────────────────────────────────────────────────────

export interface ProductLookupStoneLine {
  id: string;
  code: string;
  quantity: number;
  weight: number;
  sourceRate: number;
  sourceAmount: number;
  stoneTypeId: string;
  stoneName: string;
  slabCode: string;
}

export interface ProductLookupProduct {
  lookupKey: string;
  slug: string;
  productCode: string;
  productName: string;
  description: string;
  note: string;
  imageUrl: string | null;
  purity: string;
  netGoldWeight: number;
  grossWeight: number;
  location: string;
  categoryLabel: string;
  sourcePrice: number | null;
  sourceCurrency: string;
  sourceMetalCost: number;
  sourceMakingAmount: number;
  sourceStoneAmount: number;
  stones: ProductLookupStoneLine[];
}

export interface ProductMappingIssue {
  code: string;
  reason: string;
}

export interface ProductEstimateResult {
  product: ProductLookupProduct;
  stones: CalculatorStoneInput[];
  pricing: CalculatorPricingBreakdown;
  issues: ProductMappingIssue[];
}
