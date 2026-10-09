import { formatMetalTypeLabel } from "@/lib/metalDisplay";
import { formatDate } from "@/lib/utils";
import type {
  EnquiryCustomProduct,
  EnquirySelectedProduct,
  Order,
} from "@/types";

type EmailProduct = EnquirySelectedProduct | EnquiryCustomProduct;

function productName(product: EmailProduct) {
  return "name" in product ? product.name : `Custom ${product.category}`;
}

function metalSummary(
  metalType: string,
  metalPurity: string,
  metalColor?: string,
) {
  return [
    metalPurity === "Other" ? "" : metalPurity,
    formatMetalTypeLabel(metalType, metalColor),
  ]
    .filter(Boolean)
    .join(" ");
}

function productSummary(product: EmailProduct) {
  const stones = [
    ...(product.diamonds ?? []).map((stone) =>
      [
        stone.type || "Diamond",
        stone.shape,
        stone.weight && `${stone.weight} ct`,
      ]
        .filter(Boolean)
        .join(" "),
    ),
    ...(product.colorStones ?? []).map((stone) =>
      [
        stone.stoneType || "Colour stone",
        stone.shape,
        stone.weight && `${stone.weight} ct`,
      ]
        .filter(Boolean)
        .join(" "),
    ),
  ];
  if (stones.length === 0 && "stones" in product) {
    stones.push(
      ...product.stones.map((stone) =>
        [stone.stoneType, stone.weight != null && `${stone.weight} ct`]
          .filter(Boolean)
          .join(" "),
      ),
    );
    if (stones.length === 0 && product.stoneDescription) {
      stones.push(product.stoneDescription);
    }
  }

  return [
    `Product: ${productName(product)}`,
    `Metal: ${metalSummary(product.metalType, product.metalPurity, product.details?.metalColor)}`,
    "metalWeight" in product &&
      product.metalWeight &&
      `Metal weight: ${product.metalWeight} g`,
    stones.length > 0 && `Stones: ${stones.join(", ")}`,
    product.details?.productSize && `Size: ${product.details.productSize}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildVendorEmailSubject(order: Order) {
  const names = [
    ...(order.selectedProducts ?? []),
    ...(order.customProducts ?? []),
  ].map(productName);

  return `Order ${order.refCode ?? order.id} – ${names.join(", ") || order.category}`;
}

export function buildVendorEmailBody(order: Order) {
  const products = [
    ...(order.selectedProducts ?? []),
    ...(order.customProducts ?? []),
  ];
  const sizes = [
    order.ringSize && `Ring ${order.ringSize}`,
    order.chainLength && `Chain ${order.chainLength}`,
    order.bangleSize && `Bangle ${order.bangleSize}`,
  ]
    .filter(Boolean)
    .join(", ");
  const summary =
    products.length > 0
      ? products.map(productSummary).join("\n\n")
      : [
          `Product: ${order.category}`,
          `Metal: ${metalSummary(order.metalType, order.metalPurity)}`,
          order.stoneDescription && `Stones: ${order.stoneDescription}`,
        ]
          .filter(Boolean)
          .join("\n");

  return [
    "Hello,",
    `Please find the details for order ${order.refCode ?? order.id} below.`,
    [
      `Ref code: ${order.refCode ?? order.id}`,
      summary,
      order.metalWeight != null &&
        !products.some(
          (product) => "metalWeight" in product && product.metalWeight,
        ) &&
        `Metal weight: ${order.metalWeight} g`,
      order.stoneCaratEstimate != null &&
        !products.some(
          (product) => "stones" in product && product.stones.length > 0,
        ) &&
        `Stone carat estimate: ${order.stoneCaratEstimate} ct`,
      sizes && `Size: ${sizes}`,
      order.vendorDeliveryDate &&
        `Vendor delivery date: ${formatDate(order.vendorDeliveryDate)}`,
    ]
      .filter(Boolean)
      .join("\n"),
    "Please see the attached order PDF for the full details.",
  ].join("\n\n");
}
