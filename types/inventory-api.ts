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
  stoneSlabCode: string;
  totalNetWeight: string;
  totalPieces: number;
  slab: {
    id: string;
    code: string;
    pricePerCarat: string;
    rangeFrom: string;
    rangeTo: string;
    notes: string | null;
    stoneType: {
      id: string;
      name: string;
      category: string;
      clarity: string;
      color: string | null;
    };
  };
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
  sourceCreatedAt: string;
  netWeight: string;
  grossWeight: string;
  totalDiamondWeight: string;
  totalStoneWeight: string;
  notes: string | null;
  media: InventoryMedia[];
  stones: InventoryStone[];
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
};

export type InventoryProductListQuery = {
  q?: string;
  code?: string;
  category?: string;
  color?: ProductColor;
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
