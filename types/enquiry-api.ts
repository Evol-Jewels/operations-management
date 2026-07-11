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

export interface BackendEnquiryDiamond {
  id?: string;
  type?: string;
  growthMethod?: string;
  shape?: string;
  clarity?: string;
  colour?: string;
  size?: string;
  pieces?: string;
  weight?: string;
  notes?: string;
}

export interface BackendEnquiryColorStone {
  id?: string;
  stoneType?: string;
  nature?: string;
  origin?: string;
  treatment?: string;
  shape?: string;
  colour?: string;
  size?: string;
  pieces?: string;
  weight?: string;
  notes?: string;
}

export interface BackendEnquiryItemDetails {
  orderType?: string;
  subcategory?: string;
  productSize?: string;
  polish?: string;
  certification?: string;
  metalColor?: string;
  settingType?: string;
  findingType?: string;
  budgetRange?: string;
  deliveryDate?: string;
  specialNotes?: string;
}

export interface BackendEnquiryMedia {
  type: "IMAGE" | "VIDEO" | "LINK";
  url: string;
  publicId?: string;
  name?: string;
  mimeType?: string;
  size?: number;
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
  category: string | null;
  productCode: string | null;
  referenceProductCode: string | null;
  metalType: string | null;
  metalPurity: string | null;
  metalWeight: string | null;
  stones: BackendEnquiryStone[];
  diamonds: BackendEnquiryDiamond[];
  colorStones: BackendEnquiryColorStone[];
  details: BackendEnquiryItemDetails;
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
  category?: string;
  productCode?: string;
  referenceProductCode?: string;
  metalType?: string;
  metalPurity?: string;
  metalWeight?: string;
  stones?: BackendEnquiryStone[];
  diamonds?: BackendEnquiryDiamond[];
  colorStones?: BackendEnquiryColorStone[];
  details?: BackendEnquiryItemDetails;
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
