export interface CreateOrderCustomerInput {
  phoneNumber: string;
  name: string;
  notes?: string;
  address: string;
}

export interface CreateOrderProductInput {
  id: string;
  source: "EXISTING" | "CUSTOM";
  sourceEnquiryItemId?: string;
  productCode?: string;
  name: string;
  category?: string;
  metalType?: string;
  metalPurity?: string;
  notes?: string;
  media?: Array<{ type: "IMAGE" | "VIDEO" | "LINK"; url: string }>;
  stones?: Array<{ stoneType: string; weight?: string }>;
  vendorName?: string;
  cadApprovalRequired: boolean;
  estimatedDeliveryDate: string;
}

export interface CreateOrderInput {
  sourceEnquiryId?: string;
  customer: CreateOrderCustomerInput;
  products: CreateOrderProductInput[];
  createdBy: string;
}
