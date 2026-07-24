import type {
  CreateShopifyDraftInput,
  ShopifyProductDetail,
  ShopifyProductFormInput,
  ShopifyVariantInput,
} from "@/types/shopify-products";

export interface ProductOptionDraft {
  name: string;
  valuesText: string;
}

export interface ShopifyProductFormState {
  title: string;
  descriptionHtml: string;
  vendor: string;
  productType: string;
  tagsText: string;
  handle: string;
  seoTitle: string;
  seoDescription: string;
  collectionIds: string[];
  options: ProductOptionDraft[];
  variants: ShopifyVariantInput[];
}

export const EMPTY_PRODUCT_FORM: ShopifyProductFormState = {
  title: "",
  descriptionHtml: "",
  vendor: "EVOL Jewels",
  productType: "",
  tagsText: "",
  handle: "",
  seoTitle: "",
  seoDescription: "",
  collectionIds: [],
  options: [],
  variants: [
    {
      price: "",
      compareAtPrice: "",
      sku: "",
      barcode: "",
      taxable: true,
      optionValues: [],
    },
  ],
};

function splitValues(value: string) {
  return [
    ...new Set(
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
}

function cartesianOptions(options: ProductOptionDraft[]) {
  return options.reduce<Array<Array<{ optionName: string; name: string }>>>(
    (combinations, option) => {
      const values = splitValues(option.valuesText);
      if (!option.name.trim() || !values.length) return combinations;
      return combinations.flatMap((combination) =>
        values.map((name) => [
          ...combination,
          { optionName: option.name.trim(), name },
        ]),
      );
    },
    [[]],
  );
}

function optionKey(values: ShopifyVariantInput["optionValues"]) {
  return values.map((value) => `${value.optionName}:${value.name}`).join("|");
}

export function buildVariants(
  options: ProductOptionDraft[],
  current: ShopifyVariantInput[],
) {
  const combinations = cartesianOptions(options);
  if (!options.length || !combinations.length) {
    return [
      { ...(current[0] ?? EMPTY_PRODUCT_FORM.variants[0]), optionValues: [] },
    ];
  }
  const existing = new Map(
    current.map((variant) => [optionKey(variant.optionValues), variant]),
  );
  return combinations.map((optionValues) => ({
    ...(existing.get(optionKey(optionValues)) ?? {
      price: "",
      compareAtPrice: "",
      sku: "",
      barcode: "",
      taxable: true,
    }),
    optionValues,
  }));
}

export function stateFromProduct(
  product: ShopifyProductDetail,
): ShopifyProductFormState {
  const options = product.options
    .filter((option) => option.name !== "Title")
    .map((option) => ({
      name: option.name,
      valuesText: option.values.join(", "),
    }));
  return {
    title: product.title,
    descriptionHtml: product.descriptionHtml,
    vendor: product.vendor,
    productType: product.productType,
    tagsText: product.tags.join(", "),
    handle: product.handle,
    seoTitle: product.seo.title ?? "",
    seoDescription: product.seo.description ?? "",
    collectionIds: product.collections.nodes.map((collection) => collection.id),
    options,
    variants: product.variants.nodes.map((variant) => ({
      id: variant.id,
      price: variant.price,
      compareAtPrice: variant.compareAtPrice ?? "",
      sku: variant.sku ?? "",
      barcode: variant.barcode ?? "",
      taxable: variant.taxable,
      optionValues: variant.selectedOptions
        .filter((option) => option.name !== "Title")
        .map((option) => ({ optionName: option.name, name: option.value })),
    })),
  };
}

function basePayload(state: ShopifyProductFormState): ShopifyProductFormInput {
  return {
    title: state.title.trim(),
    descriptionHtml: state.descriptionHtml,
    vendor: state.vendor.trim() || undefined,
    productType: state.productType.trim() || undefined,
    tags: splitValues(state.tagsText),
    handle: state.handle.trim() || undefined,
    seoTitle: state.seoTitle.trim() || undefined,
    seoDescription: state.seoDescription.trim() || undefined,
    collectionIds: state.collectionIds,
    variants: state.variants.map((variant) => ({
      ...variant,
      price: variant.price || undefined,
      compareAtPrice: variant.compareAtPrice || undefined,
      sku: variant.sku?.trim() || undefined,
      barcode: variant.barcode?.trim() || undefined,
    })),
    media: [],
  };
}

export function createPayload(
  state: ShopifyProductFormState,
  media: CreateShopifyDraftInput["media"],
): CreateShopifyDraftInput {
  return {
    ...basePayload(state),
    options: state.options
      .filter(
        (option) => option.name.trim() && splitValues(option.valuesText).length,
      )
      .map((option) => ({
        name: option.name.trim(),
        values: splitValues(option.valuesText),
      })),
    media,
  };
}

export function updatePayload(
  state: ShopifyProductFormState,
  media: ShopifyProductFormInput["media"],
): ShopifyProductFormInput {
  return { ...basePayload(state), media };
}
