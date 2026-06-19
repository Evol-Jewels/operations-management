export type BackendEnquiryStatus = "NEW" | "ESTIMATED" | "CONVERTED" | "CLOSED";

export type BackendEnquiryItemStatus =
  | "PENDING"
  | "ESTIMATED"
  | "CONVERTED"
  | "CLOSED";

export type BackendEnquiryItemType = "EXISTING" | "CUSTOM";

import type { BackendActivityLog } from "@/types/activity-api";

export interface BackendEnquiryStone {
  stoneType: string;
  slabId?: string;
  weight?: string;
}

export interface BackendEnquiryMedia {
  type: "IMAGE" | "VIDEO" | "LINK";
  url: string;
}

export interface BackendUserSummary {
  id: string;
  name: string;
  image: string | null;
}

export type BackendCreatedBy = BackendUserSummary | string | null;

export interface BackendEnquiryRow {
  id: string;
  refCode: number;
  name: string;
  phoneNumber: string;
  notes: string | null;
  budget: string | null;
  status: BackendEnquiryStatus;
  createdBy: BackendCreatedBy;
  salesPerson: BackendUserSummary;
  createdAt: string;
  updatedAt: string;
}

export interface BackendEnquiryListItem extends BackendEnquiryRow {
  itemCount: number;
  estimationCount: number;
}

export interface BackendEstimationRow {
  id: string;
  enquiryItemId: string;
  vendorName: string | null;
  metalType: string | null;
  metalPurity: string | null;
  netWeight: string | null;
  stones: BackendEnquiryStone[];
  media: BackendEnquiryMedia[];
  notes: string | null;
  makingCost: string | null;
  createdBy: BackendCreatedBy;
  updatedBy: BackendCreatedBy;
  createdAt: string;
  updatedAt: string;
}

export interface BackendEnquiryItemRow {
  id: string;
  enquiryId: string;
  type: BackendEnquiryItemType;
  productCode: string | null;
  metalType: string | null;
  metalPurity: string | null;
  metalWeight: string | null;
  stones: BackendEnquiryStone[];
  media: BackendEnquiryMedia[];
  notes: string | null;
  status: BackendEnquiryItemStatus;
  createdBy: BackendCreatedBy;
  updatedBy: BackendCreatedBy;
  createdAt: string;
  updatedAt: string;
  estimations?: BackendEstimationRow[];
}

export interface BackendEnquiryDetails {
  enquiry: BackendEnquiryRow;
  items: BackendEnquiryItemRow[];
  activityLogs: BackendActivityLog[];
}

export interface ListEnquiriesQuery {
  status?: BackendEnquiryStatus;
  phoneNumber?: string;
  name?: string;
  createdBy?: string;
  createdFrom?: string;
  createdTo?: string;
}

export interface CreateEnquiryItemInput {
  type?: BackendEnquiryItemType;
  productCode?: string;
  metalType?: string;
  metalPurity?: string;
  metalWeight?: string;
  stones?: BackendEnquiryStone[];
  media?: BackendEnquiryMedia[];
  notes?: string;
  status?: BackendEnquiryItemStatus;
}

export interface CreateEnquiryInput {
  name: string;
  phoneNumber: string;
  notes?: string;
  budget?: string | null;
  status?: BackendEnquiryStatus;
  salesPerson: string;
  items?: CreateEnquiryItemInput[];
}

export interface UpdateEnquiryInput {
  name?: string;
  phoneNumber?: string;
  notes?: string | null;
  budget?: string | null;
  status?: BackendEnquiryStatus;
  salesPerson?: string;
  items?: Array<CreateEnquiryItemInput & { id?: string }>;
}

export interface CreateEstimationInput {
  vendorName?: string;
  metalType?: string;
  metalPurity?: string;
  netWeight?: string;
  stones?: BackendEnquiryStone[];
  media?: BackendEnquiryMedia[];
  notes?: string;
  makingCost?: string;
}

export interface UpdateEstimationInput {
  vendorName?: string | null;
  metalType?: string | null;
  metalPurity?: string | null;
  netWeight?: string | null;
  stones?: BackendEnquiryStone[];
  media?: BackendEnquiryMedia[];
  notes?: string | null;
  makingCost?: string | null;
}
