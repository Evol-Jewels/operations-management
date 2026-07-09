import type { ProductReference } from "@/components/enquiries/enquiry-form-types";
import type {
  BackendEnquiryColorStone,
  BackendEnquiryDiamond,
  BackendEnquiryItemDetails,
} from "@/types/enquiry-api";

export type RequirementDiamond = BackendEnquiryDiamond & { id: string };
export type RequirementColorStone = BackendEnquiryColorStone & { id: string };

export interface RequirementDraft {
  id: string;
  category: string;
  metalType: string;
  metalPurity: string;
  metalWeight: string;
  diamonds: RequirementDiamond[];
  colorStones: RequirementColorStone[];
  details: BackendEnquiryItemDetails;
  references: ProductReference[];
  notes: string;
}

export const PRODUCT_CATEGORIES = [
  "Ring",
  "Necklace",
  "Bracelet",
  "Earrings",
  "Bangle",
  "Pendant",
  "Chain",
  "Accessory",
  "Brooch",
  "Other",
] as const;

export const ORDER_TYPES = ["Client", "Stock", "Repair", "Remake", "Other"];
export const METAL_TYPES = ["Gold", "White Gold", "Rose Gold", "Silver", "Platinum", "Other"];
export const METAL_PURITIES = ["14K", "18K", "22K", "24K", "950", "925", "Other"];
export const DIAMOND_TYPES = ["Lab Grown", "Natural", "Moissanite", "Other"];
export const DIAMOND_METHODS = ["CVD", "HPHT", "Natural", "Other"];
export const DIAMOND_SHAPES = ["Round", "Oval", "Princess", "Cushion", "Emerald", "Pear", "Marquise", "Radiant", "Mix", "Other"];
export const DIAMOND_CLARITIES = ["FL", "IF", "VVS", "VVS/VS", "VS", "SI", "I", "Other"];
export const DIAMOND_COLOURS = ["D", "E", "F", "EF", "G", "H", "GH", "I", "J", "Other"];
export const COLOR_STONE_TYPES = ["Ruby", "Emerald", "Sapphire", "Tanzanite", "Polki", "Pearl", "Other"];
export const COLOR_STONE_NATURES = ["Natural", "Lab Created", "Synthetic", "Other"];
export const COLOR_STONE_ORIGINS = ["Burma", "Zambia", "Colombia", "Sri Lanka", "Thailand", "India", "Other"];
export const COLOR_STONE_TREATMENTS = ["Unheated", "Heated", "Oil", "Glass Filled", "None", "Other"];
export const POLISH_OPTIONS = ["High polish", "Matte", "Satin", "Brushed", "Antique finish", "Other"];
export const CERTIFICATIONS = ["IGI", "GIA", "SGL", "BIS", "None", "Other"];
