export interface StoneTypeResponse {
  id: string;
  name: string;
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
}

export interface UpdateStoneTypeInput {
  name?: string;
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
