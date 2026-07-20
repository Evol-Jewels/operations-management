export interface StoneTypeResponse {
  id: string;
  name: string;
  category: "Diamond" | "Gemstone" | null;
  clarity: string | null;
  color: string | null;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

export interface StoneTypeListResponse {
  data: StoneTypeResponse[];
  total: number;
}

export interface CreateStoneTypeInput {
  name: string;
  category: "Diamond" | "Gemstone";
}

export interface UpdateStoneTypeInput {
  name?: string;
  category?: "Diamond" | "Gemstone";
}

export interface StoneSlabResponse {
  id: string;
  stoneTypeId: string;
  stoneType: { id: string; name: string } | null;
  code: string;
  pricePerCarat: string;
  rangeFrom: string;
  rangeTo: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

export interface StoneSlabListResponse {
  data: StoneSlabResponse[];
  total: number;
}

export interface CreateStoneSlabInput {
  stoneTypeId: string;
  code: string;
  pricePerCarat: string;
  rangeFrom: string;
  rangeTo: string;
  notes?: string;
}

export interface UpdateStoneSlabInput {
  stoneTypeId?: string | null;
  code?: string | null;
  pricePerCarat?: string | null;
  rangeFrom?: string | null;
  rangeTo?: string | null;
  notes?: string | null;
}

export interface MetalResponse {
  id: string;
  name: string;
  type: string | null;
  percentage: string | null;
  ratePerGram: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

export interface MetalListResponse {
  data: MetalResponse[];
  total: number;
}

export interface CreateMetalInput {
  name: string;
  type?: string;
  percentage?: string;
  ratePerGram?: string;
  notes?: string;
}

export interface UpdateMetalInput {
  name?: string | null;
  type?: string | null;
  percentage?: string | null;
  ratePerGram?: string | null;
  notes?: string | null;
}

export interface LocationResponse {
  id: string;
  name: string;
  city: string;
  type: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

export interface LocationListResponse {
  data: LocationResponse[];
  total: number;
}

export interface CreateLocationInput {
  name: string;
  city: string;
  type: "WAREHOUSE" | "STORE";
  notes?: string;
}

export interface UpdateLocationInput {
  name?: string | null;
  city?: string | null;
  type?: "WAREHOUSE" | "STORE" | null;
  notes?: string | null;
}
