import type { JewelleryCategory, MetalPurity, MetalType } from "@/types";

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

export const mockProducts: Product[] = [
  {
    id: "prod-001",
    productCode: "SRNG679604",
    name: "Classic Gold Ring",
    category: "Ring",
    metalType: "Gold",
    metalPurity: "22K",
    description: "Simple 22K gold band, 3mm width",
    imageUrl: "/mock/products/ring-classic.jpg",
    basePrice: 15000,
  },
  {
    id: "prod-002",
    productCode: "SRNG385221",
    name: "Diamond Solitaire Ring",
    category: "Ring",
    metalType: "White Gold",
    metalPurity: "18K",
    description: "18K white gold with 1ct round brilliant diamond",
    imageUrl: "/mock/products/ring-diamond.jpg",
    basePrice: 45000,
  },
  {
    id: "prod-003",
    productCode: "SNEC847102",
    name: "Temple Necklace",
    category: "Necklace",
    metalType: "Gold",
    metalPurity: "22K",
    description: "Temple style necklace with goddess motif",
    basePrice: 85000,
  },
  {
    id: "prod-004",
    productCode: "SNEC229104",
    name: "Pearl String Necklace",
    category: "Necklace",
    metalType: "Gold",
    metalPurity: "18K",
    description: "Freshwater pearls on 18K gold string",
    basePrice: 22000,
  },
  {
    id: "prod-005",
    productCode: "SBRC584701",
    name: "Gold Bracelet",
    category: "Bracelet",
    metalType: "Gold",
    metalPurity: "22K",
    description: "Cuff style bracelet, 6mm width",
    basePrice: 28000,
  },
  {
    id: "prod-006",
    productCode: "SBRC991205",
    name: "Diamond Tennis Bracelet",
    category: "Bracelet",
    metalType: "White Gold",
    metalPurity: "18K",
    description: "Round diamonds in channel setting",
    basePrice: 65000,
  },
  {
    id: "prod-007",
    productCode: "SEAR772106",
    name: "Gold Drop Earrings",
    category: "Earrings",
    metalType: "Gold",
    metalPurity: "22K",
    description: "Traditional jhumka style",
    basePrice: 12000,
  },
  {
    id: "prod-008",
    productCode: "SEAR443208",
    name: "Diamond Stud Earrings",
    category: "Earrings",
    metalType: "White Gold",
    metalPurity: "18K",
    description: "0.5ct round diamonds per ear",
    basePrice: 28000,
  },
  {
    id: "prod-009",
    productCode: "SBANG910902",
    name: "Gold Bangle Set",
    category: "Bangle",
    metalType: "Gold",
    metalPurity: "22K",
    description: "Pair of plain bangles",
    basePrice: 35000,
  },
  {
    id: "prod-010",
    productCode: "SBANG556709",
    name: "Kundan Bangle Set",
    category: "Bangle",
    metalType: "Gold",
    metalPurity: "22K",
    description: "Kundan work with coloured stones",
    basePrice: 55000,
  },
  {
    id: "prod-011",
    productCode: "SPND887104",
    name: "Gold Pendant",
    category: "Pendant",
    metalType: "Gold",
    metalPurity: "18K",
    description: "Solitaire pendant with chain",
    basePrice: 18000,
  },
  {
    id: "prod-012",
    productCode: "SPND332109",
    name: "Gemstone Pendant",
    category: "Pendant",
    metalType: "White Gold",
    metalPurity: "18K",
    description: "Blue sapphire pendant",
    basePrice: 32000,
  },
  {
    id: "prod-013",
    productCode: "SCHN774503",
    name: "Gold Chain",
    category: "Chain",
    metalType: "Gold",
    metalPurity: "22K",
    description: "Cable chain, 50cm",
    basePrice: 38000,
  },
  {
    id: "prod-014",
    productCode: "SCHN228506",
    name: "Rose Gold Chain",
    category: "Chain",
    metalType: "Rose Gold",
    metalPurity: "18K",
    description: "Rose gold snake chain",
    basePrice: 25000,
  },
  {
    id: "prod-015",
    productCode: "SBROC115808",
    name: "Gold Brooch",
    category: "Brooch",
    metalType: "Gold",
    metalPurity: "18K",
    description: "Floral design brooch",
    basePrice: 8500,
  },
  {
    id: "prod-016",
    productCode: "SRNG991016",
    name: "Platinum Band",
    category: "Ring",
    metalType: "Platinum",
    metalPurity: "950 Platinum",
    description: "Simple platinum wedding band",
    basePrice: 22000,
  },
];

export function searchProducts(query: string): Product[] {
  if (!query.trim()) return mockProducts;
  const q = query.toLowerCase();
  return mockProducts.filter((p) => p.productCode.toLowerCase().includes(q));
}
