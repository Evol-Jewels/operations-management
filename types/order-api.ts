import type { BackendActivityLog } from "@/types/activity-api";

export type BackendOrderStatus =
  | "NEW"
  | "CAD_DESIGN"
  | "MANUFACTURING"
  | "CERTIFICATION"
  | "IN_STORE"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "CLOSED";

export type BackendOrderProductType = "EXISTING" | "CUSTOM";

export interface BackendOrderUserSummary {
  id: string;
  name: string;
  image: string | null;
}

export type BackendOrderCreatedBy = BackendOrderUserSummary | string | null;

export interface BackendExistingProductDetails {
  productCode: string;
}

export interface BackendOrderStone {
  stoneType: string;
  slabCode?: string;
  approxPieces: number;
  netWeight?: string;
}

export interface BackendCustomProductDetails {
  category:
    | "RING"
    | "NECKLACE"
    | "EARRING"
    | "BRACELET"
    | "PENDANT"
    | "BANGLE"
    | "ANKLET"
    | "OTHER";
  metalType: string;
  metalPurity?: string;
  metalColor?: "YELLOW" | "ROSE" | "WHITE" | "OTHERS";
  size?: number;
  metalNetWeight: string;
  metalGrossWeight?: string;
  stones: BackendOrderStone[];
}

export interface BackendProductDetails {
  id: string;
  productCode: string;
  name: string;
  category: string;
  description: string;
  vendor: string;
  color: string;
  purity: number;
  size: number | null;
  isCustomerProduct: boolean;
  locationId: string;
  sourceCreatedAt: string;
  netWeight: string;
  grossWeight: string;
  totalDiamondWeight: string;
  totalStoneWeight: string;
  notes: string | null;
  updatedAt: string;
  createdAt: string;
  isDeleted: boolean;
  kind: string;
}

export interface BackendOrderRow {
  id: string;
  refCode: number;
  sourceEnquiry: number | null;
  name: string;
  phoneNumber: string;
  customerAddress?: string | null;
  notes: string | null;
  salesPerson: BackendOrderUserSummary;
  createdBy: BackendOrderCreatedBy;
  status: BackendOrderStatus;
  productType: BackendOrderProductType;
  productCode?: string | null;
  customProductId?: string | null;
  existingProduct?: BackendExistingProductDetails | null;
  customProduct?: BackendCustomProductDetails | null;
  productDetails?: BackendProductDetails | null;
  isCadRequired: boolean;
  estimatedDeliveryDate: string | null;
  vendor: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BackendOrderDetailsResponse {
  order: BackendOrderRow;
  activityLogs: BackendActivityLog[];
}

export interface BackendOrderDetails extends BackendOrderRow {}

export interface CreateExistingOrderItemInput {
  productType: "EXISTING";
  productCode: string;
  notes?: string;
  isCadRequired?: boolean;
  estimatedDeliveryDate?: string;
  vendor?: string;
}

export interface CreateCustomOrderItemInput {
  productType: "CUSTOM";
  customProduct: BackendCustomProductDetails;
  notes?: string;
  isCadRequired?: boolean;
  estimatedDeliveryDate?: string;
  vendor?: string;
}

export type CreateOrderItemInput =
  | CreateExistingOrderItemInput
  | CreateCustomOrderItemInput;

export interface CreateOrdersInput {
  sourceEnquiry?: number;
  name: string;
  phoneNumber: string;
  customerAddress?: string;
  salesPerson: string;
  orders: CreateOrderItemInput[];
}

export interface ListOrdersQuery {
  status?: BackendOrderStatus;
  phoneNumber?: string;
  name?: string;
  createdBy?: string;
  createdFrom?: string;
  createdTo?: string;
  limit?: number;
  offset?: number;
}

export interface UpdateOrderInput {
  status?: BackendOrderStatus;
  estimatedDeliveryDate?: string | null;
  vendor?: string | null;
  notes?: string | null;
  isCadRequired?: boolean;
}

export interface CreateOrdersResponse {
  message: "All orders are created" | string;
  orderIds: string[];
  refCodes?: number[];
}

export type UpdateOrderResponse = BackendOrderDetails;
