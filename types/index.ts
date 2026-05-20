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
  | "note" // human message / update
  | "file_upload" // file or photo attached
  | "enquiry_closed"
  | "estimation_added";

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
}

export interface EnquiryCustomProduct {
  id: string;
  category: string;
  metalType: string;
  metalPurity: string;
  polish: string;
  stoneDescription: string;
  stoneCut: string;
  stoneQuality: string;
  stoneCaratEstimate?: number;
  references: EnquiryReference[];
}

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
  createdAt: string;
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
}

export interface CalculatorFormState {
  netGoldWeight: number;
  purity: MetalPurity;
  stones: CalculatorStoneInput[];
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
  total: number;
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
  customerDob?: string;
  customerLocation?: string;
  customerCategory?: CustomerCategory;
  customerNotes?: string;

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
  sourceEnquiryId?: string;
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

// ─── Catalogue Product Types ────────────────────────────────────────────────────

export interface CatalogueSearchItem {
  id: number;
  title: string;
  product_code: string;
  slug: string;
  cdn_images: string[];
  location: string;
  price: string;
  product_gross_weight: number;
  product_Net_weight: number;
  total_stone_weight: number;
  total_diamond_weight: number;
  currency: string;
  category?: {
    title: string;
    description: string;
  };
  attribute?: {
    stock_code: string;
    quantity: number;
    varient_name: string;
    colour: string;
  };
}

export interface CatalogueSearchResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: CatalogueSearchItem[];
}

export interface CatalogueProductDetailStone {
  id: number;
  bom_varient_name: string;
  stone_pieces: number;
  stone_weight: number;
  stone_amount: number;
  stone_rate: number;
  diamond: boolean;
  slug: string;
}

export interface CatalogueProductDetailResponse {
  id: number;
  title: string;
  description: string;
  product_code: string;
  slug: string;
  location: string;
  cdn_images: string[];
  department: string;
  ageing: number;
  price: string;
  currency: string;
  custom_duty_charges: number;
  sales_tax: number;
  category?: {
    title: string;
    description: string;
  };
  metal_data: {
    gross_weight: number;
    net_weight: number;
    making_rate: number;
    metal_cost: number;
    purity_data: {
      metal_rate: number;
      title: string;
      description: string;
      purity: string;
      colour: string;
    };
  };
  attribute: {
    total_style_value: string;
    total_diamond_wt: number;
    stock_code: string;
    varient_name: string;
    quantity: number;
    making_amount: number;
    wastage: number;
    stone_total: number | null;
    diamond_total: number | null;
    colour: string;
    currency_type: string;
  };
  stone_diamond: CatalogueProductDetailStone[];
}

export interface CatalogueLookupStoneLine {
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

export interface CatalogueLookupProduct {
  lookupKey: string;
  slug: string;
  productCode: string;
  productName: string;
  description: string;
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
  stones: CatalogueLookupStoneLine[];
}

export interface CatalogueMappingIssue {
  code: string;
  reason: string;
}

export interface CatalogueEstimateResult {
  product: CatalogueLookupProduct;
  stones: CalculatorStoneInput[];
  pricing: CalculatorPricingBreakdown;
  issues: CatalogueMappingIssue[];
}
