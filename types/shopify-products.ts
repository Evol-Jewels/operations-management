export type ShopifyProductStatus = "ACTIVE" | "ARCHIVED" | "DRAFT";
export type ShopifyProductStatusFilter = "ALL" | "ACTIVE" | "DRAFT";

export interface ShopifyMoney {
  amount: string;
  currencyCode: string;
}

export interface ShopifyProductSummary {
  id: string;
  legacyResourceId: string;
  title: string;
  handle: string;
  status: ShopifyProductStatus;
  vendor: string;
  productType: string;
  tags: string[];
  updatedAt: string;
  totalInventory: number;
  variantsCount: { count: number };
  featuredMedia: {
    preview: { image: { url: string; altText: string | null } | null } | null;
  } | null;
  priceRangeV2: {
    minVariantPrice: ShopifyMoney;
    maxVariantPrice: ShopifyMoney;
  };
  adminUrl: string;
}

export interface ShopifyProductDetail extends ShopifyProductSummary {
  descriptionHtml: string;
  seo: { title: string | null; description: string | null };
  options: Array<{ id: string; name: string; values: string[] }>;
  collections: {
    nodes: Array<{ id: string; title: string }>;
  };
  media: {
    nodes: Array<{
      id: string;
      alt: string | null;
      mediaContentType: string;
      status: string;
      preview: { image: { url: string; altText: string | null } | null } | null;
    }>;
  };
  variants: {
    nodes: Array<{
      id: string;
      title: string;
      sku: string | null;
      barcode: string | null;
      price: string;
      compareAtPrice: string | null;
      taxable: boolean;
      inventoryQuantity: number | null;
      selectedOptions: Array<{ name: string; value: string }>;
    }>;
  };
}

export interface ShopifyProductsPage {
  products: ShopifyProductSummary[];
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
}

export interface ShopifyCollection {
  id: string;
  title: string;
  handle: string;
}

export interface ShopifyProductOptionInput {
  name: string;
  values: string[];
}

export interface ShopifyVariantInput {
  id?: string;
  price?: string;
  compareAtPrice?: string;
  sku?: string;
  barcode?: string;
  taxable: boolean;
  optionValues: Array<{ optionName: string; name: string }>;
}

export interface ShopifyMediaInput {
  originalSource: string;
  alt?: string;
  mediaContentType: "IMAGE" | "EXTERNAL_VIDEO";
  filename?: string;
}

export interface ShopifyProductFormInput {
  title: string;
  descriptionHtml: string;
  vendor?: string;
  productType?: string;
  tags: string[];
  handle?: string;
  seoTitle?: string;
  seoDescription?: string;
  collectionIds: string[];
  variants: ShopifyVariantInput[];
  media: ShopifyMediaInput[];
}

export interface CreateShopifyDraftInput extends ShopifyProductFormInput {
  options: ShopifyProductOptionInput[];
}

export interface ShopifyMutationResult {
  id: string;
  legacyResourceId: string;
  title: string;
  status: ShopifyProductStatus;
  adminUrl: string;
  warnings: string[];
}
