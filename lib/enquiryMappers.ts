import type {
  ActivityEntry,
  EnquiryCustomProduct,
  EnquiryReference,
  EnquirySelectedProduct,
  JewelleryCategory,
  MetalPurity,
  MetalType,
  Order,
  ProductEstimation,
  Stage,
} from "@/types";
import type {
  BackendEnquiryDetails,
  BackendEnquiryEventRow,
  BackendEnquiryItemRow,
  BackendEnquiryListItem,
  BackendEnquiryStatus,
  BackendEstimationRow,
} from "@/types/enquiry-api";

function normalizeMetalType(value?: string | null): MetalType {
  const normalized = (value || "Gold").trim();
  if (
    ["Gold", "Silver", "Platinum", "Rose Gold", "White Gold"].includes(
      normalized,
    )
  ) {
    return normalized as MetalType;
  }
  return "Gold";
}

function normalizeMetalPurity(value?: string | null): MetalPurity {
  const normalized = (value || "Other").trim();
  if (["14K", "18K", "22K", "24K", "Other"].includes(normalized)) {
    return normalized as MetalPurity;
  }
  return "Other";
}

function backendStatusToStage(status: BackendEnquiryStatus): Stage {
  if (status === "ESTIMATE_SENT" || status === "QUOTE_SENT") {
    return "Estimation";
  }
  if (status === "ORDER_PLACED") return "Order Confirmed";
  return "Enquiry";
}

function firstImage(media: BackendEnquiryItemRow["media"]) {
  return media.find((item) => item.type === "IMAGE")?.url;
}

function mapReferences(
  media: BackendEnquiryItemRow["media"],
): EnquiryReference[] {
  return media.map((item, index) => ({
    id: `${item.type.toLowerCase()}-${index}-${item.url}`,
    type: item.type.toLowerCase() as EnquiryReference["type"],
    name: item.url,
    url: item.url,
  }));
}

export function mapBackendEstimationToProductEstimation(
  estimation: BackendEstimationRow,
): ProductEstimation {
  return {
    id: estimation.id,
    productId: estimation.enquiryItemId,
    metalWeight: Number(estimation.netWeight ?? 0),
    purity: normalizeMetalPurity(estimation.metalPurity),
    stoneDetails: estimation.stones.map((stone, index) => ({
      id: `${estimation.id}-stone-${index}`,
      type: stone.stoneType,
      netWeight: Number(stone.weight ?? 0),
      pieces: 1,
    })),
    finalAmount: Number(estimation.makingCost ?? 0),
    createdAt: estimation.createdAt,
  };
}

function mapBackendItemToSelectedProduct(
  item: BackendEnquiryItemRow,
): EnquirySelectedProduct {
  const title = item.productCode || "Existing product";

  return {
    id: item.id,
    productCode: item.productCode || "Unknown",
    name: title,
    category: "Other",
    metalType: normalizeMetalType(item.metalType),
    metalPurity: normalizeMetalPurity(item.metalPurity),
    description: item.notes ?? undefined,
    imageUrl: firstImage(item.media),
    status: item.status,
  };
}

function mapBackendItemToCustomProduct(
  item: BackendEnquiryItemRow,
): EnquiryCustomProduct {
  return {
    id: item.id,
    category: "Custom",
    metalType: item.metalType ?? "",
    metalPurity: item.metalPurity ?? "",
    polish: "",
    stoneDescription: item.stones.map((stone) => stone.stoneType).join(", "),
    stoneCut: "",
    stoneQuality: "",
    stoneCaratEstimate: item.stones[0]?.weight
      ? Number(item.stones[0].weight)
      : undefined,
    references: mapReferences(item.media),
    status: item.status,
  };
}

export function mapBackendEventToActivityEntry(
  event: BackendEnquiryEventRow,
): ActivityEntry {
  const type: ActivityEntry["type"] =
    event.type === "ENQUIRY_CREATED"
      ? "order_created"
      : event.type === "ESTIMATION_ADDED" || event.type === "ESTIMATION_UPDATED"
        ? "estimation_added"
        : "note";

  return {
    id: event.id,
    orderId: event.enquiryId,
    postedBy: event.createdBy,
    actorRole: "sales",
    timestamp: event.createdAt,
    type,
    note: event.message ?? undefined,
  };
}

function baseOrderFromBackend(
  enquiry: BackendEnquiryDetails["enquiry"] | BackendEnquiryListItem,
): Order {
  return {
    id: enquiry.id,
    type: "enquiry",
    shareableToken: enquiry.id,
    customerName: enquiry.name,
    customerPhone: enquiry.phoneNumber,
    customerNotes: enquiry.notes ?? undefined,
    budget: enquiry.budget ? Number(enquiry.budget) : undefined,
    salespersonName: enquiry.poc,
    category: "Other" as JewelleryCategory,
    metalType: "Gold",
    metalPurity: "Other",
    certification: "None",
    cadDesignRequired: false,
    currentStage: backendStatusToStage(enquiry.status),
    createdAt: enquiry.createdAt,
    lastUpdatedAt: enquiry.updatedAt,
    activityFeed: [],
    status: enquiry.status === "CLOSED" ? "closed" : "open",
  };
}

export function mapBackendEnquiryListItemToOrder(
  enquiry: BackendEnquiryListItem,
): Order {
  return baseOrderFromBackend(enquiry);
}

export function mapBackendEnquiryDetailsToOrder(
  details: BackendEnquiryDetails,
): Order {
  const selectedProducts: EnquirySelectedProduct[] = [];
  const customProducts: EnquiryCustomProduct[] = [];
  const productEstimations: ProductEstimation[] = [];

  for (const item of details.items) {
    const latestEstimation = item.estimations?.[0];

    if (item.type === "EXISTING") {
      const product = mapBackendItemToSelectedProduct(item);
      if (latestEstimation && product.status === "PENDING") {
        product.status = "ESTIMATED";
      }
      selectedProducts.push(product);
    } else {
      const product = mapBackendItemToCustomProduct(item);
      if (latestEstimation && product.status === "PENDING") {
        product.status = "ESTIMATED";
      }
      customProducts.push(product);
    }

    if (latestEstimation) {
      productEstimations.push(
        mapBackendEstimationToProductEstimation(latestEstimation),
      );
    }
  }

  return {
    ...baseOrderFromBackend(details.enquiry),
    selectedProducts,
    customProducts,
    estimations: productEstimations,
    activityFeed: details.events.map(mapBackendEventToActivityEntry),
  };
}
