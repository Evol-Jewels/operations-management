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
