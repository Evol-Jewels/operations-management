import { mergeActivityFeed } from "@/lib/enquiryMappers";
import { normalizePerson } from "@/lib/people";
import type {
  EnquiryCustomProduct,
  CertificationType,
  EnquiryReference,
  EnquirySelectedProduct,
  JewelleryCategory,
  MetalPurity,
  MetalType,
  Order,
  Stage,
} from "@/types";
import type { BackendComment } from "@/types/activity-api";
import type {
  BackendCustomProductDetails,
  BackendOrderDetailsResponse,
  BackendOrderRow,
  BackendOrderStatus,
  BackendProductDetails,
} from "@/types/order-api";

const ORDER_STATUS_TO_STAGE: Record<BackendOrderStatus, Stage> = {
  NEW: "New",
  IN_PRODUCTION: "In Production",
  CAD_DESIGN: "CAD Design",
  IN_TRANSIT: "In Transit",
  CERTIFICATION: "Certification",
  AT_STORE: "At Store",
  DELIVERED: "Delivered",
  CLOSED: "Closed",
  CANCELLED: "Cancelled",
};

function normalizeMetalType(value?: string | null): MetalType {
  if (!value) return "Gold";
  const upper = value.trim().toUpperCase();
  if (upper === "YELLOW") return "Gold";
  if (upper === "WHITE") return "White Gold";
  if (upper === "ROSE") return "Rose Gold";
  if (
    ["Gold", "Silver", "Platinum", "Rose Gold", "White Gold"].includes(
      value.trim(),
    )
  ) {
    return value.trim() as MetalType;
  }
  return "Gold";
}

function normalizeMetalPurity(value?: string | number | null): MetalPurity {
  if (!value) return "Other";
  const str = String(value).trim();
  if (["14K", "18K", "22K", "24K", "Other"].includes(str)) {
    return str as MetalPurity;
  }
  const num = Number(str);
  if (!Number.isNaN(num) && [14, 18, 22, 24].includes(num)) {
    return `${num}K` as MetalPurity;
  }
  return "Other";
}

function normalizeCertification(value?: string | null): CertificationType {
  if (!value) return "None";
  const normalized = value.trim().toUpperCase();
  if (normalized === "GIA") return "GIA";
  if (normalized === "IGI") return "IGI";
  if (normalized === "SGL") return "SGL";
  if (normalized === "JEWELLERY" || normalized === "JEWELRY") {
    return "Jewellery";
  }
  return "None";
}

export function mapBackendOrderStatusToStage(
  status: BackendOrderStatus,
): Stage {
  return ORDER_STATUS_TO_STAGE[status];
}

function mapProductDetailsCategory(
  category?: BackendProductDetails["category"],
): JewelleryCategory {
  const map: Record<string, JewelleryCategory> = {
    RING: "Ring",
    NECKLACE: "Necklace",
    EARRING: "Earrings",
    BRACELET: "Bracelet",
    PENDANT: "Pendant",
    BANGLE: "Bangle",
    ACCESSORY: "Accessory",
    CHAIN: "Chain",
    ANKLET: "Other",
    OTHER: "Other",
  };
  return category ? (map[category] ?? "Other") : "Other";
}

function normalizeCategory(
  category?: BackendCustomProductDetails["category"],
): JewelleryCategory {
  const map: Record<
    BackendCustomProductDetails["category"],
    JewelleryCategory
  > = {
    RING: "Ring",
    NECKLACE: "Necklace",
    EARRING: "Earrings",
    BRACELET: "Bracelet",
    PENDANT: "Pendant",
    BANGLE: "Bangle",
    ACCESSORY: "Accessory",
    CHAIN: "Chain",
    ANKLET: "Other",
    OTHER: "Other",
  };
  return category ? map[category] : "Other";
}

function mapOrderReferences(
  specification: BackendCustomProductDetails["requirementSpecification"],
): EnquiryReference[] {
  return (specification?.references ?? []).map((reference, index) => ({
    id: "requirement-" + index + "-" + reference.url,
    type: reference.type.toLowerCase() as EnquiryReference["type"],
    name: reference.name || reference.url,
    url: reference.url,
    mimeType: reference.mimeType,
    size: reference.size,
  }));
}

function mapOrderCustomProduct(order: BackendOrderRow): EnquiryCustomProduct | null {
  const product = order.customProduct;
  if (!product) return null;

  const specification = product.requirementSpecification;

  return {
    id: order.id,
    category: normalizeCategory(product.category),
    metalType: normalizeMetalType(product.metalType),
    metalPurity: normalizeMetalPurity(product.metalPurity),
    metalWeight: product.metalNetWeight,
    polish: specification?.details.polish ?? "",
    stones: product.stones.map((stone, index) => ({
      id: order.id + "-stone-" + index,
      stoneType: stone.stoneType,
      pieces: stone.approxPieces,
      weight: stone.netWeight ? Number(stone.netWeight) : undefined,
    })),
    stoneDescription: product.stones.map((stone) => stone.stoneType).join(", "),
    stoneCut: "",
    stoneQuality: "",
    stoneCaratEstimate: product.stones[0]?.netWeight
      ? Number(product.stones[0].netWeight)
      : undefined,
    references: mapOrderReferences(specification),
    diamonds: (specification?.diamonds ?? []).map((diamond, index) => ({
      id: order.id + "-diamond-" + index,
      ...diamond,
    })),
    colorStones: (specification?.colorStones ?? []).map((stone, index) => ({
      id: order.id + "-color-stone-" + index,
      ...stone,
    })),
    details: specification?.details,
    notes: specification?.notes ?? order.notes ?? undefined,
    status: "CONVERTED",
  };
}

function mapOrderSelectedProduct(order: BackendOrderRow): EnquirySelectedProduct | null {
  const product = order.productDetails;
  if (!product) return null;

  return {
    id: order.id,
    productCode: product.productCode,
    name: product.name,
    category: mapProductDetailsCategory(product.category),
    metalType: normalizeMetalType(product.color),
    metalPurity: normalizeMetalPurity(product.purity),
    description: product.description || product.notes || undefined,
    status: "CONVERTED",
  };
}

function baseOrderFromBackend(order: BackendOrderRow): Order {
  const isExisting = order.productType === "EXISTING";
  const productDetails = isExisting ? order.productDetails : undefined;
  const custom = isExisting ? undefined : order.customProduct;
  const firstStone = custom?.stones[0];
  const customDetails = custom?.requirementSpecification?.details;

  if (isExisting && productDetails) {
    return {
      id: order.id,
      type: "order",
      refCode: order.refCode,
      orderNumber: order.productCode ? `#${order.productCode}` : undefined,
      customerName: order.name,
      customerPhone: order.phoneNumber,
      customerAddress: order.customerAddress ?? undefined,
      customerNotes: order.notes ?? undefined,
      salespersonName: order?.salesPerson?.name,
      createdBy: normalizePerson(order.createdBy, order?.salesPerson?.name),
      vendorName: order.vendor ?? undefined,
      category: mapProductDetailsCategory(productDetails.category),
      metalType: normalizeMetalType(productDetails.color),
      metalPurity: normalizeMetalPurity(productDetails.purity),
      metalWeight: productDetails.netWeight
        ? Number(productDetails.netWeight)
        : undefined,
      grossWeight: productDetails.grossWeight
        ? Number(productDetails.grossWeight)
        : undefined,
      stoneDescription: undefined,
      stoneCaratEstimate: productDetails.totalStoneWeight
        ? Number(productDetails.totalStoneWeight)
        : undefined,
      certification: "None",
      cadDesignRequired: order.isCadRequired,
      deliveryDate: order.estimatedDeliveryDate ?? undefined,
      currentStage: mapBackendOrderStatusToStage(order.status),
      createdAt: order.createdAt,
      lastUpdatedAt: order.updatedAt,
      orderStatus: order.status,
      activityFeed: [],
      sourceEnquiryId:
        order.sourceEnquiry !== null && order.sourceEnquiry !== undefined
          ? String(order.sourceEnquiry)
          : undefined,
    };
  }

  return {
    id: order.id,
    type: "order",
    refCode: order.refCode,
    orderNumber: `#${order.refCode}`,
    customerName: order.name,
    customerPhone: order.phoneNumber,
    customerAddress: order.customerAddress ?? undefined,
    customerNotes: order.notes ?? undefined,
    salespersonName: order?.salesPerson?.name,
    createdBy: normalizePerson(order.createdBy, order?.salesPerson?.name),
    vendorName: order.vendor ?? undefined,
    category: normalizeCategory(custom?.category),
    metalType: normalizeMetalType(custom?.metalType),
    metalPurity: normalizeMetalPurity(custom?.metalPurity),
    metalWeight: custom?.metalNetWeight
      ? Number(custom.metalNetWeight)
      : undefined,
    stoneDescription:
      custom?.stones.map((stone) => stone.stoneType).join(", ") || undefined,
    stoneCaratEstimate: firstStone?.netWeight
      ? Number(firstStone.netWeight)
      : undefined,
    certification: normalizeCertification(customDetails?.certification),
    cadDesignRequired: order.isCadRequired,
    deliveryDate:
      order.estimatedDeliveryDate ?? customDetails?.deliveryDate ?? undefined,
    currentStage: mapBackendOrderStatusToStage(order.status),
    createdAt: order.createdAt,
    lastUpdatedAt: order.updatedAt,
    orderStatus: order.status,
    activityFeed: [],
    sourceEnquiryId:
      order.sourceEnquiry !== null && order.sourceEnquiry !== undefined
        ? String(order.sourceEnquiry)
        : undefined,
  };
}

export function mapBackendOrderListItemToOrder(order: BackendOrderRow): Order {
  return baseOrderFromBackend(order);
}

export function mapBackendOrderDetailsToOrder(
  details: BackendOrderDetailsResponse,
  comments: BackendComment[] = [],
): Order {
  const customProduct = mapOrderCustomProduct(details.order);
  const selectedProduct = mapOrderSelectedProduct(details.order);

  return {
    ...baseOrderFromBackend(details.order),
    customProducts: customProduct ? [customProduct] : undefined,
    selectedProducts: selectedProduct ? [selectedProduct] : undefined,
    activityFeed: mergeActivityFeed(comments, details.activityLogs),
  };
}
