import type {
  BackendOrderUserSummary,
  BackendPreviewImage,
} from "@/types/order-api";

export type RefillRequestStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "PLACED"
  | "CANCELLED";

export interface RefillRequestItem {
  productCode: string;
  quantity: number;
  name: string;
  image: BackendPreviewImage | null;
}

export interface RefillRequest {
  id: string;
  refCode: number;
  status: RefillRequestStatus;
  notes: string | null;
  vendor: { id: string; name: string };
  createdBy: BackendOrderUserSummary | null;
  statusUpdatedBy: BackendOrderUserSummary | null;
  createdAt: string;
  updatedAt: string;
  items: RefillRequestItem[];
}

export interface CreateRefillRequestInput {
  vendorId: string;
  items: Array<{ productCode: string; quantity: number }>;
  notes?: string;
}
