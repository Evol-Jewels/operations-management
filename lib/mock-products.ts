import type { JewelleryCategory, MetalPurity, MetalType } from "@/types";

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

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
    id: "prod_e25845a00945454c",
    productCode: "CBRC647635",
    name: "Bracelets",
    category: "Bracelet",
    metalType: "Gold",
    metalPurity: "14K",
    description:
      "Vendor DB PAHLAJANI VENTURES LLP, variant EVLBRCREGREG-4-1, net wt 21.26g, diamond wt 26.22ct",
    imageUrl:
      "https://files.synergicserp.com/PML/IMAGES/0ad3315c-f8e5-4308-89b3-303e0e597b05.jpg",
    basePrice: 2177707,
  },
  {
    id: "prod_e27defed32cd4097",
    productCode: "SERN679602",
    name: "Earrings",
    category: "Earrings",
    metalType: "Rose Gold",
    metalPurity: "14K",
    description:
      "Vendor FINESSE JEWELS PRIVATE LIMITED, variant EVPERNSTDFAN-21212-1, net wt 10.11g, diamond wt 2.68ct",
    imageUrl:
      "https://files.synergicserp.com/PML/IMAGES/131dd1a1-4009-4aca-8d93-8468dd1f0f7a.jpg",
    basePrice: 180786,
  },
  {
    id: "prod_8ddbe7f626c44e8c",
    productCode: "SERN679606",
    name: "Earrings",
    category: "Earrings",
    metalType: "Gold",
    metalPurity: "14K",
    description:
      "Vendor FINESSE JEWELS PRIVATE LIMITED, variant EVPERNSTDC09-21227-1, net wt 6.67g, diamond wt 0.76ct",
    imageUrl:
      "https://files.synergicserp.com/PML/IMAGES/1d1bbe05-a78d-40b9-a04c-606abdeaa9f2.jpg",
    basePrice: 111190,
  },
  {
    id: "prod_ba6dd011a7044d4c",
    productCode: "SERN679603",
    name: "Earrings",
    category: "Earrings",
    metalType: "Gold",
    metalPurity: "14K",
    description:
      "Vendor FINESSE JEWELS PRIVATE LIMITED, variant EVPERNSTDC11-21225-1, net wt 7.08g, diamond wt 0.97ct",
    imageUrl:
      "https://files.synergicserp.com/PML/IMAGES/3a9157da-66a5-4252-ae31-8e608faf378a.jpg",
    basePrice: 122410,
  },
  {
    id: "prod_f22ae1fec7fb4dc1",
    productCode: "SRNG679604",
    name: "Ring",
    category: "Ring",
    metalType: "Gold",
    metalPurity: "14K",
    description:
      "Vendor FINESSE JEWELS PRIVATE LIMITED, variant EVPRNGSTMC11-21238-1, net wt 5.45g, diamond wt 0.57ct",
    imageUrl:
      "https://files.synergicserp.com/PML/IMAGES/44b40e10-f8e5-4aa1-b77e-156e316e0003.jpg",
    basePrice: 90586,
  },
  {
    id: "prod_4e2dd7f5d9e24127",
    productCode: "SRNG679607",
    name: "Ring",
    category: "Ring",
    metalType: "Gold",
    metalPurity: "14K",
    description:
      "Vendor FINESSE JEWELS PRIVATE LIMITED, variant EVPRNGSTMC09-21237-1, net wt 4.14g, diamond wt 0.62ct",
    imageUrl:
      "https://files.synergicserp.com/PML/IMAGES/4ee87c2c-f215-4850-8242-faea4708d817.jpg",
    basePrice: 72377,
  },
  {
    id: "prod_0c1d9eed87af4a83",
    productCode: "SBRC679605",
    name: "Bracelets",
    category: "Bracelet",
    metalType: "Gold",
    metalPurity: "14K",
    description:
      "Vendor FINESSE JEWELS PRIVATE LIMITED, variant EVPBRCOBCC09-21213-1, net wt 16.19g, diamond wt 1.58ct",
    imageUrl:
      "https://files.synergicserp.com/PML/IMAGES/6621e8e4-6b7c-473f-aafa-a04a22972fe3.jpg",
    basePrice: 262025,
  },
  {
    id: "prod_2856a4309905428b",
    productCode: "SBRC640672",
    name: "Bracelets",
    category: "Bracelet",
    metalType: "White Gold",
    metalPurity: "14K",
    description:
      "Vendor DB PAHLAJANI VENTURES LLP, variant EVPBRCTNSMSP-21201-1, net wt 20.07g, stone wt 10.7ct",
    imageUrl:
      "https://files.synergicserp.com/PML/IMAGES/6ea2e163-45c6-4cfd-bfc5-f600855866b5.jpg",
    basePrice: 336868,
  },
  {
    id: "prod_75ac9580d9d64341",
    productCode: "SPND679608",
    name: "Pendant",
    category: "Pendant",
    metalType: "Gold",
    metalPurity: "14K",
    description:
      "Vendor FINESSE JEWELS PRIVATE LIMITED, variant EVPPNDSHPC09-21202-1, net wt 5.52g, diamond wt 0.59ct",
    imageUrl:
      "https://files.synergicserp.com/PML/IMAGES/708b8dfe-164b-4dc9-b4e5-fbe7d1943ebb.jpg",
    basePrice: 89730,
  },
  {
    id: "prod_8ce68f93f38646de",
    productCode: "CBRC1069650",
    name: "Bracelets",
    category: "Bracelet",
    metalType: "White Gold",
    metalPurity: "14K",
    description:
      "Vendor Khyra Collection LLP, variant EVLBRCREGREG-25-1, net wt 5.81g, diamond wt 6.34ct",
    imageUrl:
      "https://files.synergicserp.com/PML/IMAGES/CBRC1069650-1776069433502.jpg",
    basePrice: 303798,
  },
  {
    id: "prod_8eba93c8d782473a",
    productCode: "CBRC482673",
    name: "Bracelets",
    category: "Bracelet",
    metalType: "Rose Gold",
    metalPurity: "14K",
    description:
      "Vendor FINESSE JEWELS PRIVATE LIMITED, variant EVPBRCCBCFAN-21210-1, net wt 89.17g, diamond wt 13.06ct",
    imageUrl: "https://files.synergicserp.com/PML/IMAGES/CBRC482673.jpg",
    basePrice: 1355294,
  },
  {
    id: "prod_f8c091b711e1438c",
    productCode: "CBRC544802",
    name: "Bracelets",
    category: "Bracelet",
    metalType: "Gold",
    metalPurity: "14K",
    description:
      "Vendor DB PAHLAJANI VENTURES LLP, variant EVPBRCTNSCLS-21197-1, net wt 11.64g, diamond wt 8.31ct",
    imageUrl:
      "https://files.synergicserp.com/PML/IMAGES/CBRC544802-1746437082027.jpg",
    basePrice: 373651,
  },
  {
    id: "prod_7e685a6b9a814756",
    productCode: "CBRC725592",
    name: "Bracelets",
    category: "Bracelet",
    metalType: "Gold",
    metalPurity: "14K",
    description:
      "Vendor ROYKA DESIGNS LLP, variant EVPBRCTNSCLS-21200-1, net wt 8.56g, diamond wt 4.06ct",
    imageUrl:
      "https://files.synergicserp.com/PML/IMAGES/CBRC725592-1746437082277.jpg",
    basePrice: 201048,
  },
  {
    id: "prod_b11d175046a14af3",
    productCode: "CBRC845016",
    name: "Bracelets",
    category: "Bracelet",
    metalType: "Gold",
    metalPurity: "14K",
    description:
      "Vendor DB PAHLAJANI VENTURES LLP, variant EVPBRCTNSCLS-21197-1, net wt 12.04g, diamond wt 3.37ct",
    imageUrl:
      "https://files.synergicserp.com/PML/IMAGES/CBRC845016-1748003054308.jpg",
    basePrice: 251907,
  },
  {
    id: "prod_f0e39774edd24b1f",
    productCode: "CBRC908400",
    name: "Bracelets",
    category: "Bracelet",
    metalType: "White Gold",
    metalPurity: "14K",
    description:
      "Vendor IMAGINARIUM JEWEL TECH LLP, variant ESLBRCREGREG-6-1, net wt 7.97g, stone wt 10.26ct",
    imageUrl:
      "https://files.synergicserp.com/PML/IMAGES/CBRC908400-1756215792697.jpg",
    basePrice: 7267,
  },
  {
    id: "prod_17fe04771b1e47e7",
    productCode: "CERN1050835",
    name: "Earrings",
    category: "Earrings",
    metalType: "Gold",
    metalPurity: "14K",
    description:
      "Vendor MIDAMAS JEWELS LLP, variant EVLERNREGREG-86-1, net wt 4.12g, diamond wt 10.08ct",
    imageUrl:
      "https://files.synergicserp.com/PML/IMAGES/CERN1050835-1774005364145.jpeg",
    basePrice: 731422,
  },
  {
    id: "prod_77ffcffb98aa4fa1",
    productCode: "CERN1069648",
    name: "Earrings",
    category: "Earrings",
    metalType: "Rose Gold",
    metalPurity: "14K",
    description:
      "Vendor Khyra Collection LLP, variant EVLERNREGREG-90-1, net wt 1.76g, diamond wt 0.91ct",
    imageUrl:
      "https://files.synergicserp.com/PML/IMAGES/CERN1069648-1776069433714.jpg",
    basePrice: 47552,
  },
  {
    id: "prod_4e3856e84cd74ede",
    productCode: "CERN488794",
    name: "Earrings",
    category: "Earrings",
    metalType: "White Gold",
    metalPurity: "14K",
    description:
      "Vendor FINESSE JEWELS PRIVATE LIMITED, variant EVSERNDRPFAN-21193-1, net wt 4.73g, diamond wt 3.72ct",
    imageUrl: "https://files.synergicserp.com/PML/IMAGES/CERN488794.jpg",
    basePrice: 256414,
  },
  {
    id: "prod_5becc9a718d44eaa",
    productCode: "CERN553596",
    name: "Earrings",
    category: "Earrings",
    metalType: "Gold",
    metalPurity: "14K",
    description:
      "Vendor DB PAHLAJANI VENTURES LLP, variant EVSERNSTDCLS-21233-1, net wt 2.87g, diamond wt 4.02ct",
    imageUrl:
      "https://files.synergicserp.com/PML/IMAGES/CERN553596-1746437082638.jpg",
    basePrice: 287756,
  },
  {
    id: "prod_08101a01ca334a41",
    productCode: "CERN704671",
    name: "Earrings",
    category: "Earrings",
    metalType: "White Gold",
    metalPurity: "14K",
    description:
      "Vendor INDOJEWEL JEWELLERY PRIVATE LIMITED, variant EVPERNSTDFAN-21213-1, net wt 3.61g, diamond wt 2.67ct",
    imageUrl:
      "https://files.synergicserp.com/PML/IMAGES/CERN704671-1746437083305.jpg",
    basePrice: 118225,
  },
  {
    id: "prod_3438d43052a5466c",
    productCode: "CERN723956",
    name: "Earrings",
    category: "Earrings",
    metalType: "Gold",
    metalPurity: "14K",
    description:
      "Vendor ROYKA DESIGNS LLP, variant EVSERNSTDCLS-21220-1, net wt 2.43g, diamond wt 1.61ct",
    imageUrl:
      "https://files.synergicserp.com/PML/IMAGES/CERN723956-1746437083739.jpg",
    basePrice: 91352,
  },
  {
    id: "prod_641981f6588844c6",
    productCode: "CERN723957",
    name: "Earrings",
    category: "Earrings",
    metalType: "Gold",
    metalPurity: "14K",
    description:
      "Vendor ROYKA DESIGNS LLP, variant EVSERNSTDCLS-21196-1, net wt 2.61g, diamond wt 2.02ct",
    imageUrl:
      "https://files.synergicserp.com/PML/IMAGES/CERN723957-1746437083841.jpg",
    basePrice: 127300,
  },
  {
    id: "prod_9060aeb5238641ed",
    productCode: "CERN882588",
    name: "Earrings",
    category: "Earrings",
    metalType: "Gold",
    metalPurity: "14K",
    description:
      "Vendor DB PAHLAJANI VENTURES LLP, variant EVLERNREGREG-74-1, net wt 0.85g, diamond wt 0.64ct",
    imageUrl:
      "https://files.synergicserp.com/PML/IMAGES/CERN882588-1753968435161.jpg",
    basePrice: 30100,
  },
  {
    id: "prod_ec4620a3f8b44308",
    productCode: "CERN882589",
    name: "Earrings",
    category: "Earrings",
    metalType: "Gold",
    metalPurity: "14K",
    description:
      "Vendor DB PAHLAJANI VENTURES LLP, variant EVLERNREGREG-76-1, net wt 1.53g, diamond wt 1.25ct",
    imageUrl:
      "https://files.synergicserp.com/PML/IMAGES/CERN882589-1753968435412.jpg",
    basePrice: 56645,
  },
  {
    id: "prod_9f1d339964d04364",
    productCode: "CERN968259",
    name: "Earrings",
    category: "Earrings",
    metalType: "Rose Gold",
    metalPurity: "14K",
    description:
      "Vendor MIDAMAS JEWELS LLP, variant EVLERNREGREG-90-1, net wt 1.57g, diamond wt 0.13ct",
    imageUrl:
      "https://files.synergicserp.com/PML/IMAGES/CERN968259-1762944885743.jpg",
    basePrice: 24474,
  },
  {
    id: "prod_642d41f42f214ba2",
    productCode: "CERN969120",
    name: "Earrings",
    category: "Earrings",
    metalType: "Rose Gold",
    metalPurity: "14K",
    description:
      "Vendor DB PAHLAJANI VENTURES LLP, variant EVLERNREGREG-84-1, net wt 0.79g, diamond wt 0.13ct",
    imageUrl:
      "https://files.synergicserp.com/PML/IMAGES/CERN969120-1766493853388.jpg",
    basePrice: 14057,
  },
  {
    id: "prod_75426d192d874aa6",
    productCode: "CNEC711154",
    name: "Necklace",
    category: "Necklace",
    metalType: "White Gold",
    metalPurity: "14K",
    description:
      "Vendor DB PAHLAJANI VENTURES LLP, variant EVSNECSNLGRD-21193-1, net wt 27.03g, diamond wt 14.62ct",
    imageUrl:
      "https://files.synergicserp.com/PML/IMAGES/CNEC711154-1746437085039.jpg",
    basePrice: 706918,
  },
  {
    id: "prod_71c631b8b13a44ce",
    productCode: "CPND1005124",
    name: "Pendant",
    category: "Pendant",
    metalType: "White Gold",
    metalPurity: "14K",
    description:
      "Vendor Khyra Collection LLP, variant EVLPNDREGREG-32-1, net wt 3.37g, diamond wt 0.06ct",
    imageUrl:
      "https://files.synergicserp.com/PML/IMAGES/CPND1005124-1776328776194.jpeg",
    basePrice: 47444,
  },
  {
    id: "prod_ca5bbc23382d485d",
    productCode: "CPND1050834",
    name: "Pendant",
    category: "Pendant",
    metalType: "Gold",
    metalPurity: "14K",
    description:
      "Vendor MIDAMAS JEWELS LLP, variant EVLPNDREGREG-33-1, net wt 4.53g, diamond wt 5.04ct",
    imageUrl:
      "https://files.synergicserp.com/PML/IMAGES/CPND1050834-1774005364358.jpeg",
    basePrice: 399633,
  },
  {
    id: "prod_0b77de22c1934160",
    productCode: "CPND1066003",
    name: "Pendant",
    category: "Pendant",
    metalType: "Gold",
    metalPurity: "14K",
    description:
      "Vendor MIDAMAS JEWELS LLP, variant EVLPNDREGREG-32-1, net wt 3.79g, stone wt 0.27ct",
    imageUrl:
      "https://files.synergicserp.com/PML/IMAGES/CPND1066003-1775895579245.jpg",
    basePrice: 208020,
  },
  {
    id: "prod_24bc6118851c4e16",
    productCode: "CPND429592",
    name: "Pendant",
    category: "Pendant",
    metalType: "Gold",
    metalPurity: "14K",
    description:
      "Vendor MEERA JEWELLERYHOUSE LLP, variant EVSPNDSSRCLS-21223-1, net wt 2.88g, diamond wt 2.02ct",
    imageUrl: "https://files.synergicserp.com/PML/IMAGES/CPND429592.jpg",
    basePrice: 164348,
  },
  {
    id: "prod_ba68aa44efa1456d",
    productCode: "CPND553595",
    name: "Pendant",
    category: "Pendant",
    metalType: "Gold",
    metalPurity: "14K",
    description:
      "Vendor DB PAHLAJANI VENTURES LLP, variant EVSPNDSSRCLS-21206-1, net wt 2.81g, diamond wt 2.1ct",
    imageUrl:
      "https://files.synergicserp.com/PML/IMAGES/CPND553595-1746437085556.jpg",
    basePrice: 168332,
  },
  {
    id: "prod_143063c3178c4680",
    productCode: "CPND872301",
    name: "Pendant",
    category: "Pendant",
    metalType: "Rose Gold",
    metalPurity: "14K",
    description:
      "Vendor FINESSE JEWELS PRIVATE LIMITED, variant EVLPNDREGREG-25-1, net wt 3.92g, diamond wt 3.76ct",
    imageUrl:
      "https://files.synergicserp.com/PML/IMAGES/CPND872301-1753187781219.jpg",
    basePrice: 284354,
  },
  {
    id: "prod_fa21bd9bd9bf45aa",
    productCode: "CRNG380674",
    name: "Ring",
    category: "Ring",
    metalType: "Gold",
    metalPurity: "14K",
    description:
      "Vendor DB PAHLAJANI VENTURES LLP, variant EVPRNGFEBCLS-21232-1, net wt 3.32g, diamond wt 0.91ct",
    imageUrl: "https://files.synergicserp.com/PML/IMAGES/CRNG380674.jpg",
    basePrice: 68982,
  },
  {
    id: "prod_73cbed5c97bd4959",
    productCode: "CRNG488793",
    name: "Ring",
    category: "Ring",
    metalType: "Gold",
    metalPurity: "14K",
    description:
      "Vendor FINESSE JEWELS PRIVATE LIMITED, variant EVPRNGBNDFAN-21230-1, net wt 16.4g, diamond wt 1.27ct",
    imageUrl: "https://files.synergicserp.com/PML/IMAGES/CRNG488793.jpg",
    basePrice: 261027,
  },
  {
    id: "prod_d766dbb27bf54942",
    productCode: "CRNG556976",
    name: "Ring",
    category: "Ring",
    metalType: "Gold",
    metalPurity: "14K",
    description:
      "Vendor DB PAHLAJANI VENTURES LLP, variant EVSRNGSSRCLS-21235-1, net wt 2.31g, diamond wt 3.01ct",
    imageUrl:
      "https://files.synergicserp.com/PML/IMAGES/CRNG556976-1746437086455.jpg",
    basePrice: 214583,
  },
  {
    id: "prod_03bff5909b6d40df",
    productCode: "CRNG681997",
    name: "Ring",
    category: "Ring",
    metalType: "Gold",
    metalPurity: "14K",
    description:
      "Vendor DB PAHLAJANI VENTURES LLP, variant EVSRNGSSRCDI-21240-1, net wt 7.22g, stone wt 6.16ct",
    imageUrl:
      "https://files.synergicserp.com/PML/IMAGES/CRNG681997-1746437087287.jpg",
    basePrice: 228956,
  },
  {
    id: "prod_3eff2bbf89044b32",
    productCode: "CRNG694770",
    name: "Ring",
    category: "Ring",
    metalType: "Rose Gold",
    metalPurity: "14K",
    description:
      "Vendor DB PAHLAJANI VENTURES LLP, variant EVLRNGREGREG-37-1, net wt 5g, diamond wt 0.17ct",
    imageUrl:
      "https://files.synergicserp.com/PML/IMAGES/CRNG694770-1746437087480.jpg",
    basePrice: 73017,
  },
  {
    id: "prod_be4d236d2d7a4b8e",
    productCode: "CRNG704547",
    name: "Ring",
    category: "Ring",
    metalType: "Gold",
    metalPurity: "14K",
    description:
      "Vendor FINESSE JEWELS PRIVATE LIMITED, variant EVSRNGSSRCDI-21240-1, net wt 4.31g, diamond wt 0.62ct",
    imageUrl:
      "https://files.synergicserp.com/PML/IMAGES/CRNG704547-1746437087581.jpg",
    basePrice: 63422,
  },
  {
    id: "prod_073961d3faa34a7d",
    productCode: "CRNG714629",
    name: "Ring",
    category: "Ring",
    metalType: "Gold",
    metalPurity: "14K",
    description:
      "Vendor ROYKA DESIGNS LLP, variant EVPRNGSPIFAN-21215-1, net wt 3.98g, diamond wt 2.45ct",
    imageUrl:
      "https://files.synergicserp.com/PML/IMAGES/CRNG714629-1746437087718.jpg",
    basePrice: 107750,
  },
  {
    id: "prod_c7b084b1511f43f6",
    productCode: "CRNG916217",
    name: "Ring",
    category: "Ring",
    metalType: "Gold",
    metalPurity: "14K",
    description:
      "Vendor MIDAMAS JEWELS LLP, variant EVLRNGREGREG-97-1, net wt 7.25g, diamond wt 1.42ct",
    imageUrl:
      "https://files.synergicserp.com/PML/IMAGES/CRNG916217-1757400768467.jpg",
    basePrice: 154522,
  },
  {
    id: "prod_bcf0e573dbf7434e",
    productCode: "CRNG918838",
    name: "Ring",
    category: "Ring",
    metalType: "Gold",
    metalPurity: "14K",
    description:
      "Vendor FINESSE JEWELS PRIVATE LIMITED, variant EVLRNGREGREG-96-1, net wt 3.03g, diamond wt 1.82ct",
    imageUrl:
      "https://files.synergicserp.com/PML/IMAGES/CRNG918838-1757512861901.jpg",
    basePrice: 138101,
  },
  {
    id: "prod_59421b7f7ea54df6",
    productCode: "SBRC772949",
    name: "Bracelets",
    category: "Bracelet",
    metalType: "Gold",
    metalPurity: "14K",
    description:
      "Vendor FINESSE JEWELS PRIVATE LIMITED, variant EVPBRCRBCFAN-21203-1, net wt 36.67g, diamond wt 7.23ct",
    imageUrl:
      "https://files.synergicserp.com/PML/IMAGES/EVLBRCREGREG-51-1-1740630891753.jpg",
    basePrice: 578909,
  },
  {
    id: "prod_b966efca3f2c428e",
    productCode: "SERN772948",
    name: "Earrings",
    category: "Earrings",
    metalType: "White Gold",
    metalPurity: "14K",
    description:
      "Vendor FINESSE JEWELS PRIVATE LIMITED, variant EVPERNHNGFAN-21215-1, net wt 11.72g, diamond wt 10.41ct",
    imageUrl:
      "https://files.synergicserp.com/PML/IMAGES/EVLERNREGREG-307-1-1740630892332.jpg",
    basePrice: 420852,
  },
  {
    id: "prod_8559a5f970b541f2",
    productCode: "SPND681887",
    name: "Pendant",
    category: "Pendant",
    metalType: "Gold",
    metalPurity: "14K",
    description:
      "Vendor FINESSE JEWELS PRIVATE LIMITED, variant EVPPNDSHKC11-21200-1, net wt 5.66g, diamond wt 0.77ct",
    imageUrl:
      "https://files.synergicserp.com/PML/IMAGES/f82153f4-e82a-4284-8038-56c5a44fa5a8.jpg",
    basePrice: 95346,
  },
  {
    id: "prod_1e39e4b7758f4f99",
    productCode: "[MISC-CODE]BRC982311",
    name: "Bracelets",
    category: "Bracelet",
    metalType: "Gold",
    metalPurity: "14K",
    description:
      "Vendor ROYKA DESIGNS LLP, variant EVPBRCCFLFAN-21205-1, net wt 10.48g, diamond wt 3.34ct",
    imageUrl:
      "https://files.synergicserp.com/PML/IMAGES/[MISC-CODE]BRC317878.jpg",
    basePrice: 223325,
  },
];

export function searchProducts(query: string): Product[] {
  if (!query.trim()) return mockProducts;
  const q = query.toLowerCase();
  return mockProducts.filter((p) => p.productCode.toLowerCase().includes(q));
}
