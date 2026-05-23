import type {
  CustomerCategory,
  JewelleryCategory,
  MetalPurity,
  MetalType,
} from "@/types";

export interface Product {
  id: string;
  productCode: string;
  name: string;
  category: JewelleryCategory;
  metalType: MetalType;
  metalPurity: MetalPurity;
  description?: string;
  imageUrl?: string;
  basePrice?: number;
}

export const CATEGORIES: JewelleryCategory[] = [
  "Ring",
  "Necklace",
  "Bracelet",
  "Earrings",
  "Bangle",
  "Pendant",
  "Chain",
  "Brooch",
  "Other",
];

export const METAL_TYPES: MetalType[] = [
  "Gold",
  "White Gold",
  "Rose Gold",
  "Silver",
  "Platinum",
];

export const METAL_PURITIES: MetalPurity[] = [
  "14K",
  "18K",
  "22K",
  "24K",
  "Other",
];

export const STONE_CUTS = [
  "Round Brilliant",
  "Princess",
  "Oval",
  "Cushion",
  "Emerald Cut",
  "Pear",
  "Marquise",
  "Radiant",
  "Asscher",
  "Polki",
  "Cabochon",
  "Rose Cut",
  "Uncut",
  "Other",
];

export const STONE_QUALITIES = [
  "AAA Grade",
  "VVS",
  "VS1",
  "VS2",
  "SI1",
  "SI2",
  "Eye-clean",
  "Good",
  "Commercial",
];

export const POLISH_OPTIONS = [
  "High polish",
  "Matte",
  "Satin",
  "Hammered",
  "Brushed",
  "Antique finish",
];

export const INTEREST_LEVELS = ["Low", "Average", "High"];

export type EnquiryMode = "store_visit" | "online";

export const STORE_VISIT_LOCATIONS = [
  "Hyderabad - Banjara Hills",
  "Bangalore - ITC Gardenia",
] as const;

export const VISIT_HOURS = Array.from({ length: 12 }, (_, index) =>
  String(index + 1).padStart(2, "0"),
);
export const VISIT_MINUTES = ["00", "15", "30", "45"] as const;
export const VISIT_PERIODS = ["AM", "PM"] as const;

export interface CustomerDetails {
  isExisting: boolean;
  phone: string;
  name: string;
  dob: string;
  city: string;
  address: string;
  email: string;
  category: CustomerCategory;
  notes: string;
  enquiryMode: EnquiryMode | "";
  visitCity: string;
  visitTime: string;
  budget?: number;
}

export type ProductReferenceType = "link" | "image" | "video";

export interface ProductReference {
  id: string;
  type: ProductReferenceType;
  url: string;
  name: string;
  mimeType?: string;
  size?: number;
  file?: File;
}

export interface NewProduct {
  id: string;
  category: string;
  metalType: string;
  metalPurity: string;
  polish: string;
  stoneDescription: string;
  stoneCut: string;
  stoneQuality: string;
  stoneCaratEstimate: string;
  references: ProductReference[];
  notes: string;
  interestLevel: string;
}

export interface EnquiryFormData {
  customer: CustomerDetails;
  selectedProducts: Product[];
  newProducts: NewProduct[];
}

export type StepId =
  | "phone"
  | "name"
  | "enquiry-type"
  | "visit-details"
  | "category"
  | "email"
  | "city"
  | "notes"
  | "products";

export type ProductAddMode = "choose" | "search" | "custom";

export const EMPTY_CUSTOMER: CustomerDetails = {
  isExisting: false,
  phone: "",
  name: "",
  dob: "",
  city: "",
  address: "",
  email: "",
  category: "Middle",
  notes: "",
  enquiryMode: "",
  visitCity: "",
  visitTime: "",
  budget: undefined,
};

export function createEmptyNewProduct(): NewProduct {
  return {
    id: "",
    category: "",
    metalType: "",
    metalPurity: "",
    polish: "",
    stoneDescription: "",
    stoneCut: "",
    stoneQuality: "",
    stoneCaratEstimate: "",
    references: [],
    notes: "",
    interestLevel: "",
  };
}
