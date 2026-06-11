import { normalizePerson } from "@/lib/people";
import type {
  ActivityLogType,
  BackendActivityLog,
  BackendComment,
} from "@/types/activity-api";
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

const HIDDEN_ACTIVITY_LOG_TYPES: ActivityLogType[] = [
  "COMMENT_ADDED",
  "COMMENT_UPDATED",
  "COMMENT_DELETED",
];

function mapActivityLogTypeToEntryType(
  type: ActivityLogType,
): ActivityEntry["type"] {
  if (type === "ENQUIRY_CREATED" || type === "ORDER_CREATED") {
    return "order_created";
  }
  if (type === "STATUS_CHANGED") return "stage_change";
  if (type === "ESTIMATION_ADDED" || type === "ESTIMATION_UPDATED") {
    return "estimation_added";
  }
  return "note";
}

export function mapBackendCommentToActivityEntry(
  comment: BackendComment,
): ActivityEntry {
  return {
    id: comment.id,
    orderId: String(comment.sourceCode),
    postedBy: normalizePerson(comment.createdBy),
    actorRole: "sales",
    timestamp: comment.createdAt,
    type: "note",
    note: comment.content,
  };
}

export function mapBackendActivityLogToActivityEntry(
  log: BackendActivityLog,
): ActivityEntry {
  return {
    id: log.id,
    orderId: String(log.sourceCode),
    postedBy: normalizePerson(log.createdBy),
    actorRole: "sales",
    timestamp: log.createdAt,
    type: mapActivityLogTypeToEntryType(log.type),
    note: log.message || undefined,
  };
}

export function mergeActivityFeed(
  comments: BackendComment[] = [],
  activityLogs: BackendActivityLog[] = [],
): ActivityEntry[] {
  const visibleLogs = activityLogs.filter(
    (log) => !HIDDEN_ACTIVITY_LOG_TYPES.includes(log.type),
  );

  return [
    ...comments.map(mapBackendCommentToActivityEntry),
    ...visibleLogs.map(mapBackendActivityLogToActivityEntry),
  ];
}

function baseOrderFromBackend(
  enquiry: BackendEnquiryDetails["enquiry"] | BackendEnquiryListItem,
): Order {
  const createdBy = normalizePerson(
    enquiry.createdBy,
    enquiry.salesPerson?.name || "Unknown user",
  );

  return {
    id: enquiry.id,
    type: "enquiry",
    refCode: enquiry.refCode,
    customerName: enquiry.name,
    customerPhone: enquiry.phoneNumber,
    customerNotes: enquiry.notes ?? undefined,
    budget: enquiry.budget ? Number(enquiry.budget) : undefined,
    salespersonName: enquiry.salesPerson.name,
    createdBy,
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
  comments: BackendComment[] = [],
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
    activityFeed: mergeActivityFeed(comments, details.activityLogs),
  };
}
