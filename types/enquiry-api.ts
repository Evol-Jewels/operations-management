export type BackendEnquiryStatus =
  | "NEW"
  | "IN_PROGRESS"
  | "ESTIMATE_SENT"
  | "QUOTE_SENT"
  | "ORDER_PLACED"
  | "CLOSED";

export type BackendEnquiryItemStatus =
  | "PENDING"
  | "ESTIMATED"
  | "CONVERTED"
  | "CLOSED";

export type BackendEnquiryItemType = "EXISTING" | "CUSTOM";

export type BackendEnquiryEventType =
  | "ENQUIRY_CREATED"
  | "STATUS_CHANGED"
  | "ITEM_ADDED"
  | "ITEM_UPDATED"
  | "ESTIMATION_ADDED"
  | "ESTIMATION_UPDATED"
  | "MESSAGE_ADDED"
  | "ITEM_DELETED";

export interface BackendEnquiryStone {
  stoneType: string;
  slabId?: string;
  weight?: string;
}

export interface BackendEnquiryMedia {
  type: "IMAGE" | "VIDEO" | "LINK";
  url: string;
}

export interface BackendEnquiryRow {
  id: string;
  name: string;
  phoneNumber: string;
  notes: string | null;
  budget: string | null;
  status: BackendEnquiryStatus;
  createdBy: string | null;
  poc: string;
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
  createdBy: string;
  updatedBy: string | null;
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
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  estimations?: BackendEstimationRow[];
}

export interface BackendEnquiryEventRow {
  id: string;
  enquiryId: string;
  type: BackendEnquiryEventType;
  message: string | null;
  enquiryItemId: string | null;
  estimationId: string | null;
  createdBy: string;
  createdAt: string;
}

export interface BackendEnquiryDetails {
  enquiry: BackendEnquiryRow;
  items: BackendEnquiryItemRow[];
  events: BackendEnquiryEventRow[];
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
  status?: BackendEnquiryStatus;
  poc: string;
  items?: CreateEnquiryItemInput[];
}

export interface UpdateEnquiryInput {
  name?: string;
  phoneNumber?: string;
  notes?: string | null;
  status?: BackendEnquiryStatus;
  poc?: string;
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

export interface CreateEventInput {
  message: string;
  enquiryItemId?: string;
  estimationId?: string;
}
