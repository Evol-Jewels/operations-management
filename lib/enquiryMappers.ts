import { normalizePerson } from "@/lib/people";
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
} from "@/types";
import type {
  ActivityLogType,
  BackendActivityLog,
  BackendComment,
} from "@/types/activity-api";
import type {
  BackendEnquiryDetails,
  BackendEnquiryItemRow,
  BackendEnquiryListItem,
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
    finalAmount: 0,
    makingCost: Number(estimation.makingCost ?? 0),
    createdAt: estimation.createdAt,
    vendorName: estimation.vendorName ?? undefined,
    notes: estimation.notes ?? undefined,
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
  const stones = item.stones.map((stone, index) => ({
    id: `${item.id}-stone-${index}`,
    stoneType: stone.stoneType,
    weight: stone.weight ? Number(stone.weight) : undefined,
  }));

  return {
    id: item.id,
    category: "Custom",
    metalType: item.metalType ?? "",
    metalPurity: item.metalPurity ?? "",
    polish: "",
    stones,
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
  if (type === "ITEM_ADDED") return "item_added";
  if (type === "ESTIMATION_ADDED" || type === "ESTIMATION_UPDATED") {
    return "estimation_added";
  }
  return "system_note";
}

export function mapBackendCommentToActivityEntry(
  comment: BackendComment,
): ActivityEntry {
  return {
    id: comment.id,
    orderId: String(comment.sourceCode),
    postedBy: normalizePerson(comment.createdBy),
    timestamp: comment.createdAt,
    type: "comment",
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

  const merged = [
    ...comments.map(mapBackendCommentToActivityEntry),
    ...visibleLogs.map(mapBackendActivityLogToActivityEntry),
  ];

  return merged.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
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
    currentStage: "Enquiry",
    createdAt: enquiry.createdAt,
    lastUpdatedAt: enquiry.updatedAt,
    activityFeed: [],
    enquiryStatus: enquiry.status,
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
      selectedProducts.push(mapBackendItemToSelectedProduct(item));
    } else {
      customProducts.push(mapBackendItemToCustomProduct(item));
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
