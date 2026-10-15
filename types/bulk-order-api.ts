import type {
  BackendCustomProductDetails,
  BackendOrderStatus,
  BackendOrderUserSummary,
} from "@/types/order-api";

export type BackendBulkOrderStatus =
  | "PENDING"
  | "PARTIALLY_FILLED"
  | "FILLED"
  | "CANCELLED";

interface BackendQuotationComponent {
  rate?: string;
  amount: string;
}

interface BackendStoneQuotation extends BackendQuotationComponent {
  specId: string;
}

export interface BackendQuotationBreakdown {
  metal: BackendQuotationComponent;
  diamonds: BackendStoneQuotation[];
  colorStones: BackendStoneQuotation[];
  other: Array<{ code: string; amount: string }>;
  setting: string;
  labour: BackendQuotationComponent;
}

export interface BackendBulkOrderSummary {
  status: BackendBulkOrderStatus;
  lines: number;
  filledLines: number;
  pendingLines: number;
  cancelledLines: number;
  pieces: number;
  filled: number;
  pending: number;
  cancelledPieces: number;
  cancelledAmount: string;
  amounts: {
    metal: string;
    stone: string;
    other: string;
    setting: string;
    labour: string;
    quoted: string;
  };
}

export interface BackendBulkOrder {
  id: string;
  refCode: number;
  vendorId: string;
  vendorName: string;
  vendorCity: string | null;
  packingListNumber: string;
  quotationDate: string;
  expectedDeliveryDate: string;
  currency: string;
  quotedSubtotal: string;
  taxRate: string;
  taxAmount: string;
  roundingAmount: string;
  quotedTotal: string;
  documentUrl: string | null;
  createdBy: BackendOrderUserSummary | null;
  createdAt: string;
  updatedAt: string;
  previewImages?: string[];
  summary: BackendBulkOrderSummary;
}

export interface BackendBulkOrderItem {
  id: string;
  refCode: number;
  bulkSerialNumber: number;
  quantity: number;
  vendorDesignNumber: string;
  status: BackendOrderStatus;
  notes: string | null;
  estimatedDeliveryDate: string | null;
  quotedSubtotal: string;
  quotationBreakdown: BackendQuotationBreakdown;
  customProduct: BackendCustomProductDetails | null;
}

export interface BackendBulkOrderDetails extends BackendBulkOrder {
  items: BackendBulkOrderItem[];
}

export interface ListBulkOrdersQuery {
  search?: string;
  vendorId?: string;
  status?: BackendBulkOrderStatus;
  limit?: number;
  offset?: number;
}
