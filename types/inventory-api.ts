export type InventoryMedia = {
  id: string;
  mediaType: "IMAGE";
  storageKey: string;
  altText: string;
  sortOrder: number;
  isPrimary: boolean;
};

export type InventoryStone = {
  id: string;
  stoneName: string | null;
  slabName: string;
  ratePerCarat: number;
  netWeight: number;
  pieces: number;
  amount: number;
  isMapped: boolean;
};

export type InventoryStonesMappingStatus =
  | "fully_mapped"
  | "partially_mapped"
  | "fully_unmapped"
  | "no_stones";

export type InventoryEstimationIssue = {
  severity: "info" | "warning";
  code:
    | "STONE_MAPPING_PARTIAL"
    | "STONE_MAPPING_FULLY_MAPPED"
    | "STONE_MAPPING_NONE"
    | "NO_STONES";
  message: string;
};

export type InventoryProductEstimation = {
  pricingStatus: "complete" | "fallback_used" | "partial" | "unpriced";
  goldRateValue: number;
  goldCost: number;
  makingCost: number;
  totalStoneCost: number;
  subTotal: number;
  gst: number;
  gstPercentage?: number;
  total: number;
  issues: InventoryEstimationIssue[];
};

export type ProductColor = "YELLOW" | "ROSE" | "WHITE" | "OTHERS";

export const PRODUCT_COLOR_VALUES: readonly ProductColor[] = [
  "YELLOW",
  "ROSE",
  "WHITE",
  "OTHERS",
] as const;

export const PRODUCT_PURITY_VALUES: readonly number[] = [14, 18, 24] as const;

export type InventoryProduct = {
  id: string;
  productCode: string;
  name: string;
  category: string;
  description: string;
  vendor: string;
  color: ProductColor | string;
  purity: number;
  size: string | null;
  isCustomerProduct: boolean;
  locationId: string;
  location: {
    id: string;
    name: string;
    city: string;
    type: string;
    notes: string | null;
  };
  sourceCategoryCode: string | null;
  sourceCategoryTitle: string | null;
  sourceCreatedAt: string;
  netWeight: string;
  grossWeight: string;
  totalDiamondWeight: string;
  totalStoneWeight: string;
  notes: string | null;
  media: InventoryMedia[];
  stones: InventoryStone[];
  stonesMappingStatus?: InventoryStonesMappingStatus;
  estimation?: InventoryProductEstimation;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
};

export type InventoryProductListQuery = {
  q?: string;
  code?: string;
  category?: string;
  color?: ProductColor;
  status?: string;
  purity?: number;
  locationId?: string;
  isCustomerProduct?: boolean;
  netWeightFrom?: number;
  netWeightTo?: number;
  sourceCreatedFrom?: string;
  sourceCreatedTo?: string;
  limit?: number;
  offset?: number;
};

export type InventoryProductListResponse = {
  data: InventoryProduct[];
  total: number;
};

export type InventoryAnalyticsBucket = {
  key: string;
  label: string;
  count: number;
  netWeight: number;
  grossWeight: number;
};

export type InventoryAnalyticsLocationBucket = InventoryAnalyticsBucket & {
  locationId: string | null;
  city: string | null;
  type: string | null;
};

export type InventoryAnalyticsMatrixCell = {
  category: string;
  locationId: string | null;
  locationLabel: string;
  count: number;
};

export type InventoryAnalyticsColorPurityCell = {
  color: ProductColor;
  colorLabel: string;
  purity: number | null;
  purityLabel: string;
  count: number;
  netWeight: number;
  grossWeight: number;
};

export type InventoryAnalyticsResponse = {
  summary: {
    totalProducts: number;
    availableProducts: number;
    notAvailableProducts: number;
    stockProducts: number;
    customerProducts: number;
    totalNetWeight: number;
    totalGrossWeight: number;
    averageNetWeight: number;
  };
  breakdowns: {
    byCategory: InventoryAnalyticsBucket[];
    byColor: InventoryAnalyticsBucket[];
    byPurity: InventoryAnalyticsBucket[];
    byStatus: InventoryAnalyticsBucket[];
    bySource: InventoryAnalyticsBucket[];
    byLocation: InventoryAnalyticsLocationBucket[];
    byCategoryLocation: InventoryAnalyticsMatrixCell[];
    byColorPurity: InventoryAnalyticsColorPurityCell[];
  };
};
