"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Pencil,
  Plus,
  ScanLine,
  Search,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BarcodeScanDialog } from "@/components/calculator/BarcodeScanDialog";
import { CustomProductForm as LegacyCustomProductForm } from "@/components/enquiries/custom-product-form";
import { CustomProductForm as V2CustomProductForm } from "@/components/requirements/CustomProductForm";
import type { RequirementDraft } from "@/components/requirements/requirement-form-types";
import { createEmptyRequirement, generateRequirementId } from "@/components/requirements/requirement-form-utils";
import {
  createEmptyNewProduct,
  hasValidCustomProductRequirement,
  type NewProduct,
  type Product,
  type ProductAddMode,
  type ProductReference,
} from "@/components/enquiries/enquiry-form-types";
import {
  formatMetalTypeLabel,
  generateId,
  isValidReferenceLink,
  normalizeReferenceLink,
  ProductThumbnail,
  revokeObjectUrls,
} from "@/components/enquiries/enquiry-form-utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { enquiryKeys, useEnquiryDetails } from "@/hooks/useEnquiries";
import { useCreateOrders } from "@/hooks/useOrders";
import { authClient } from "@/lib/auth-client";
import { uploadEnquiryImage } from "@/lib/enquiriesApi";
import { normalizeDecodedId } from "@/lib/barcodeScanner";
import { fetchInventoryProducts } from "@/lib/inventoryApi";
import { mapInventoryProductToEnquiryProduct } from "@/lib/inventoryProductMapping";
import { cn, formatCurrency } from "@/lib/utils";
import type { CreateOrdersInput, CustomProductRequirementSpecification } from "@/types/order-api";
import { addDaysDateString, mapCategoryToBackend, mapMetalColorToBackend } from "./order-form-utils";

// ─── Types ──────────────────────────────────────────────────────────────────

type OrderItemSource =
  | "enquiry-existing"
  | "enquiry-custom"
  | "new-existing"
  | "new-custom";

interface OrderItem {
  id: string;
  source: OrderItemSource;
  name: string;
  productCode?: string;
  referenceProductCode?: string;
  category?: string;
  metalType?: string;
  metalPurity?: string;
  metalNetWeight?: string;
  metalGrossWeight?: string;
  metalColor?: string;
  size?: string;
  stones?: NewProduct["stones"];
  stoneDescription?: string;
  stoneCaratEstimate?: string;
  imageUrl?: string;
  basePrice?: number;
  // Custom product fields
  references?: ProductReference[];
  notes?: string;
  polish?: string;
  stoneCut?: string;
  stoneQuality?: string;
  interestLevel?: string;
  requirement?: RequirementDraft;
  // Order fields
  vendor: string;
  cadApprovalRequired: boolean;
  estimatedDelivery: string;
}

interface ConvertFormData {
  items: OrderItem[];
  customerName: string;
  customerPhone: string;
  customerAddress: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function createOrderItemFromNewProduct(
  product: Product,
  createdAt: Date,
): OrderItem {
  return {
    id: generateId(),
    source: "new-existing",
    name: product.name,
    productCode: product.productCode,
    category: product.category,
    metalType: product.metalType,
    metalPurity: product.metalPurity,
    imageUrl: product.imageUrl,
    basePrice: product.basePrice,
    vendor: "",
    cadApprovalRequired: false,
    estimatedDelivery: addDaysDateString(createdAt, 17),
  };
}

function createOrderItemFromNewCustom(
  product: NewProduct,
  createdAt: Date,
): OrderItem {
  return {
    id: product.id || generateId(),
    source: "new-custom",
    referenceProductCode: product.referenceProductCode || undefined,
    name: product.category
      ? `${product.category} - ${formatMetalTypeLabel(product.metalType)} ${product.metalPurity}`
      : `${formatMetalTypeLabel(product.metalType)} ${product.metalPurity}`,
    category: product.category,
    metalType: product.metalType,
    metalPurity: product.metalPurity,
    metalNetWeight: product.metalNetWeight,
    metalGrossWeight: product.metalGrossWeight,
    metalColor: product.metalColor,
    size: product.size,
    polish: product.polish,
    stones: product.stones,
    references: product.references,
    notes: product.notes,
    stoneDescription: product.stoneDescription,
    stoneCut: product.stoneCut,
    stoneQuality: product.stoneQuality,
    stoneCaratEstimate: product.stoneCaratEstimate,
    interestLevel: product.interestLevel,
    vendor: "",
    cadApprovalRequired: false,
    estimatedDelivery: addDaysDateString(createdAt, 17),
  };
}

function createDirectOrderItem(createdAt: Date): OrderItem {
  const id = generateId();
  const requirement = { ...createEmptyRequirement(), id };

  return {
    id,
    source: "new-custom",
    name: "Custom product",
    requirement,
    category: requirement.category,
    metalType: requirement.metalType,
    metalPurity: requirement.metalPurity,
    metalNetWeight: requirement.metalWeight,
    vendor: "",
    cadApprovalRequired: false,
    estimatedDelivery: addDaysDateString(createdAt, 17),
  };
}

function orderItemToCustomRequirement(item: OrderItem): NewProduct {
  return {
    ...createEmptyNewProduct(),
    id: item.id,
    referenceProductCode: item.referenceProductCode ?? "",
    category: item.category ?? "",
    metalType: item.metalType ?? "",
    metalPurity: item.metalPurity ?? "",
    metalNetWeight: item.metalNetWeight ?? "",
    metalGrossWeight: item.metalGrossWeight ?? "",
    metalColor: item.metalColor ?? "",
    size: item.size ?? "",
    polish: item.polish ?? "",
    stones: item.stones ?? createEmptyNewProduct().stones,
    stoneDescription: item.stoneDescription ?? "",
    stoneCut: item.stoneCut ?? "",
    stoneQuality: item.stoneQuality ?? "",
    stoneCaratEstimate: item.stoneCaratEstimate ?? "",
    references: item.references ?? [],
    notes: item.notes ?? "",
    interestLevel: item.interestLevel ?? "",
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ConvertOrderForm({
  enquiryId,
  mode = "convert",
}: {
  enquiryId?: string;
  mode?: "convert" | "create";
}) {
  const isConversion = mode === "convert";
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const createOrdersMutation = useCreateOrders();
  const createdAtRef = useRef(new Date());
  const directItemRef = useRef<OrderItem | null>(
    isConversion ? null : createDirectOrderItem(createdAtRef.current),
  );
  const {
    data: enquiryDetails,
    isLoading,
    isError,
  } = useEnquiryDetails(enquiryId ?? "");

  const [currentStep, setCurrentStep] = useState(0);
  const [animDir, setAnimDir] = useState<"forward" | "backward">("forward");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");

  // Form state
  const [form, setForm] = useState<ConvertFormData>(() => {
    const item = directItemRef.current;
    return {
      items: item ? [item] : [],
      customerName: "",
      customerPhone: "",
      customerAddress: "",
    };
  });
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>(() =>
    directItemRef.current ? [directItemRef.current.id] : [],
  );
  const [activeRequirementId, setActiveRequirementId] = useState<string | null>(
    null,
  );
  const [confirmedRequirementIds, setConfirmedRequirementIds] = useState<
    string[]
  >([]);
  const [customReferenceLinkInput, setCustomReferenceLinkInput] = useState("");
  const [customReferenceError, setCustomReferenceError] = useState("");

  // Product search state
  const [productSearch, setProductSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [productLookupLoading, setProductLookupLoading] = useState(false);
  const [productLookupError, setProductLookupError] = useState("");
  const [notFoundCode, setNotFoundCode] = useState("");
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [productAddMode, setProductAddMode] =
    useState<ProductAddMode>("choose");

  // Custom product draft
  const [newProductDraft, setNewProductDraft] = useState<NewProduct>(
    createEmptyNewProduct(),
  );
  const [referenceLinkInput, setReferenceLinkInput] = useState("");
  const [referenceError, setReferenceError] = useState("");

  const searchInputRef = useRef<HTMLInputElement>(null);
  const steps = isConversion
    ? ["requirements", "details", "customer", "review"]
    : ["requirements", "customer", "review"];
  const safeStep = Math.min(currentStep, steps.length - 1);
  const stepId = steps[safeStep];
  const progress = ((safeStep + 1) / steps.length) * 100;
  const isFirstStep = safeStep === 0;
  const isLastStep = safeStep === steps.length - 1;
  const selectedItems = form.items.filter((item) =>
    selectedItemIds.includes(item.id),
  );
  const hasItems = selectedItems.length > 0;
  const selectedCustomItems = selectedItems.filter(
    (item) => item.source === "enquiry-custom" || item.source === "new-custom",
  );
  const activeCustomItem = selectedCustomItems.find(
    (item) => item.id === activeRequirementId,
  ) ?? (!isConversion ? selectedCustomItems[0] : undefined);
  const hasNextCustomRequirement = selectedCustomItems.some(
    (item) => !confirmedRequirementIds.includes(item.id),
  );

  useEffect(() => {
    window.requestAnimationFrame(() => {
      document
        .getElementById("app-content")
        ?.scrollTo({ top: 0, behavior: "auto" });
      window.scrollTo({ top: 0, behavior: "auto" });
    });
  }, [safeStep, activeRequirementId]);

  // Pre-fill only conversion orders. Direct orders begin with an empty list.
  useEffect(() => {
    if (!isConversion) return;
    if (!enquiryDetails) return;

    const orderItems: OrderItem[] = [];
    const defaultEstimatedDelivery = addDaysDateString(
      createdAtRef.current,
      17,
    );

    for (const item of enquiryDetails.items) {
      if (item.type === "EXISTING") {
        orderItems.push({
          id: item.id,
          source: "enquiry-existing",
          name: item.productCode || "Existing product",
          productCode: item.productCode || undefined,
          metalType: item.metalType || undefined,
          metalPurity: item.metalPurity || undefined,
          imageUrl: item.media.find((m) => m.type === "IMAGE")?.url,
          vendor: "",
          cadApprovalRequired: false,
          estimatedDelivery: defaultEstimatedDelivery,
        });
      } else {
        const stoneDesc = item.stones.map((s) => s.stoneType).join(", ");
        const requirement: RequirementDraft = {
          id: item.id,
          referenceProductCode: item.referenceProductCode || "",
          category: item.category || "",
          metalType: item.metalType || "",
          metalPurity: item.metalPurity || "",
          metalWeight: item.metalWeight || "",
          diamonds: item.diamonds.map((diamond, index) => ({
            ...diamond,
            id: diamond.id || `${item.id}-diamond-${index}`,
          })),
          colorStones: item.colorStones.map((stone, index) => ({
            ...stone,
            id: stone.id || `${item.id}-colour-stone-${index}`,
          })),
          details: { ...item.details },
          references: item.media.map((media, index) => ({
            id: `${item.id}-reference-${index}`,
            type:
              media.type === "LINK"
                ? "link"
                : media.type === "VIDEO"
                  ? "video"
                  : "image",
            url: media.url,
            name: media.name || `Reference ${index + 1}`,
            mimeType: media.mimeType,
            size: media.size,
          })),
          notes: item.notes || "",
        };
        orderItems.push({
          id: item.id,
          source: "enquiry-custom",
          name: item.category || "Custom product",
          category: item.category || "Custom",
          referenceProductCode: item.referenceProductCode || undefined,
          metalType: item.metalType || undefined,
          metalPurity: item.metalPurity || undefined,
          metalNetWeight: item.metalWeight || undefined,
          metalColor: item.details.metalColor || undefined,
          size: item.details.productSize || undefined,
          stones: item.stones.map((stone, index) => ({
            id: `${item.id}-stone-${index}`,
            stoneType: stone.stoneType,
            pieces: "1",
            weight: stone.weight || "",
          })),
          stoneDescription: stoneDesc,
          stoneCaratEstimate: item.stones[0]?.weight || "",
          references: requirement.references,
          notes: item.notes || stoneDesc || undefined,
          requirement,
          vendor: "",
          cadApprovalRequired: false,
          estimatedDelivery: defaultEstimatedDelivery,
        });
      }
    }

    setForm({
      items: orderItems,
      customerName: enquiryDetails.enquiry.name || "",
      customerPhone: enquiryDetails.enquiry.phoneNumber || "",
      customerAddress: "",
    });
    setSelectedItemIds(orderItems.map((item) => item.id));
  }, [enquiryDetails, isConversion]);

  // Cleanup object URLs
  useEffect(() => {
    return () => {
      revokeObjectUrls(newProductDraft.references);
    };
  }, [newProductDraft.references]);

  function updateItem(
    itemId: string,
    patch: Partial<
      Pick<OrderItem, "vendor" | "estimatedDelivery" | "cadApprovalRequired">
    >,
  ) {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === itemId ? { ...item, ...patch } : item,
      ),
    }));
  }

  function updateItemCadApproval(itemId: string, cadApprovalRequired: boolean) {
    updateItem(itemId, {
      cadApprovalRequired,
      estimatedDelivery: addDaysDateString(
        createdAtRef.current,
        cadApprovalRequired ? 20 : 17,
      ),
    });
  }

  function itemToCustomRequirement(item: OrderItem): NewProduct {
    return {
      ...createEmptyNewProduct(),
      id: item.id,
      referenceProductCode: item.referenceProductCode ?? "",
      category: item.category ?? "",
      metalType: item.metalType ?? "",
      metalPurity: item.metalPurity ?? "",
      metalNetWeight: item.metalNetWeight ?? "",
      metalGrossWeight: item.metalGrossWeight ?? "",
      metalColor: item.metalColor ?? "",
      size: item.size ?? "",
      polish: item.polish ?? "",
      stones: item.stones ?? createEmptyNewProduct().stones,
      stoneDescription: item.stoneDescription ?? "",
      stoneCut: item.stoneCut ?? "",
      stoneQuality: item.stoneQuality ?? "",
      stoneCaratEstimate: item.stoneCaratEstimate ?? "",
      references: item.references ?? [],
      notes: item.notes ?? "",
      interestLevel: item.interestLevel ?? "",
    };
  }

  function updateCustomRequirement(itemId: string, draft: NewProduct) {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              name:
                draft.category ||
                `${formatMetalTypeLabel(draft.metalType)} ${draft.metalPurity}`.trim() ||
                "Custom product",
              category: draft.category,
              referenceProductCode: draft.referenceProductCode || undefined,
              metalType: draft.metalType,
              metalPurity: draft.metalPurity,
              metalNetWeight: draft.metalNetWeight,
              metalGrossWeight: draft.metalGrossWeight,
              metalColor: draft.metalColor,
              size: draft.size,
              polish: draft.polish,
              stones: draft.stones,
              stoneDescription: draft.stoneDescription,
              stoneCut: draft.stoneCut,
              stoneQuality: draft.stoneQuality,
              stoneCaratEstimate: draft.stoneCaratEstimate,
              references: draft.references,
              notes: draft.notes,
              interestLevel: draft.interestLevel,
            }
          : item,
      ),
    }));
  }

  function updateCustomRequirementDraft(
    itemId: string,
    updater: React.SetStateAction<NewProduct>,
  ) {
    const item = form.items.find((candidate) => candidate.id === itemId);
    if (!item) return;
    const current = orderItemToCustomRequirement(item);
    updateCustomRequirement(
      itemId,
      typeof updater === "function" ? updater(current) : updater,
    );
  }

  function addCustomReferenceLink(itemId: string) {
    const normalized = normalizeReferenceLink(customReferenceLinkInput);
    if (!normalized) return;
    if (!isValidReferenceLink(normalized)) {
      setCustomReferenceError("Enter a valid product or inspiration link");
      return;
    }
    updateCustomRequirementDraft(itemId, (draft) => ({
      ...draft,
      references: [
        ...draft.references,
        { id: generateId(), type: "link", url: normalized, name: normalized },
      ],
    }));
    setCustomReferenceLinkInput("");
    setCustomReferenceError("");
  }

  function addCustomReferenceFiles(itemId: string, files: FileList | null) {
    if (!files?.length) return;
    const references: ProductReference[] = [];
    for (const file of Array.from(files)) {
      const type = file.type.startsWith("image/")
        ? "image"
        : file.type.startsWith("video/")
          ? "video"
          : null;
      if (!type) {
        setCustomReferenceError("Only image and video files are supported");
        continue;
      }
      references.push({
        id: generateId(),
        type,
        url: URL.createObjectURL(file),
        name: file.name,
        mimeType: file.type,
        size: file.size,
        file,
      });
    }
    if (!references.length) return;
    updateCustomRequirementDraft(itemId, (draft) => ({
      ...draft,
      references: [...draft.references, ...references],
    }));
    setCustomReferenceError("");
  }

  function removeCustomReference(itemId: string, referenceId: string) {
    updateCustomRequirementDraft(itemId, (draft) => {
      const reference = draft.references.find((item) => item.id === referenceId);
      if (reference && reference.type !== "link") URL.revokeObjectURL(reference.url);
      return {
        ...draft,
        references: draft.references.filter((item) => item.id !== referenceId),
      };
    });
  }

  function removeItem(itemId: string) {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== itemId),
    }));
  }

  function addInventoryProduct(product: Product) {
    const newItem = createOrderItemFromNewProduct(
      product,
      createdAtRef.current,
    );
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
    setSelectedItemIds((prev) => [...new Set([...prev, newItem.id])]);
    setProductSearch("");
    setSearchResults([]);
    setProductLookupError("");
    setNotFoundCode("");
  }

  async function searchInventoryProducts(rawCode: string) {
    const code = normalizeDecodedId(rawCode);
    if (!code) return;

    setProductSearch(code);
    setProductLookupError("");
    setNotFoundCode("");
    setSearchResults([]);
    setProductLookupLoading(true);

    try {
      const products = await fetchInventoryProducts({ code, limit: 5 });
      if (products.data.length === 0) {
        setNotFoundCode(code);
        return;
      }

      setSearchResults(products.data.map(mapInventoryProductToEnquiryProduct));
    } catch (error) {
      setProductLookupError(
        error instanceof Error ? error.message : "Inventory search failed",
      );
    } finally {
      setProductLookupLoading(false);
    }
  }

  function addNewCustomProduct() {
    const id = generateId();
    const requirement = { ...createEmptyRequirement(), id };
    const newItem: OrderItem = {
      id,
      source: "new-custom",
      name: "Custom product",
      requirement,
      category: requirement.category,
      metalType: requirement.metalType,
      metalPurity: requirement.metalPurity,
      metalNetWeight: requirement.metalWeight,
      vendor: "",
      cadApprovalRequired: false,
      estimatedDelivery: addDaysDateString(createdAtRef.current, 17),
    };
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
    setSelectedItemIds((prev) => [...new Set([...prev, id])]);
    setActiveRequirementId(id);
    setConfirmedRequirementIds([]);
    setCurrentStep(1);
  }

  function cancelNewCustomProduct() {
    revokeObjectUrls(newProductDraft.references);
    setNewProductDraft(createEmptyNewProduct());
    setReferenceLinkInput("");
    setReferenceError("");
    setProductAddMode("choose");
  }

  function addReferenceLink() {
    const normalized = normalizeReferenceLink(referenceLinkInput);
    if (!normalized) return;
    if (!isValidReferenceLink(normalized)) {
      setReferenceError("Enter a valid product or inspiration link");
      return;
    }
    setNewProductDraft((prev) => ({
      ...prev,
      references: [
        ...prev.references,
        {
          id: generateId(),
          type: "link",
          url: normalized,
          name: normalized,
        },
      ],
    }));
    setReferenceLinkInput("");
    setReferenceError("");
  }

  function addReferenceFiles(files: FileList | null) {
    if (!files?.length) return;
    const nextRefs: ProductReference[] = [];
    for (const file of Array.from(files)) {
      const type = file.type.startsWith("image/")
        ? "image"
        : file.type.startsWith("video/")
          ? "video"
          : null;
      if (!type) {
        setReferenceError("Only image and video files are supported");
        continue;
      }
      nextRefs.push({
        id: generateId(),
        type,
        url: URL.createObjectURL(file),
        name: file.name,
        mimeType: file.type,
        size: file.size,
        file,
      });
    }
    if (!nextRefs.length) return;
    setNewProductDraft((prev) => ({
      ...prev,
      references: [...prev.references, ...nextRefs],
    }));
    setReferenceError("");
  }

  function removeDraftReference(referenceId: string) {
    setNewProductDraft((prev) => {
      const ref = prev.references.find((r) => r.id === referenceId);
      if (ref && ref.type !== "link") URL.revokeObjectURL(ref.url);
      return {
        ...prev,
        references: prev.references.filter((r) => r.id !== referenceId),
      };
    });
  }

  function validateStep(): Record<string, string> {
    const nextErrors: Record<string, string> = {};
    if (stepId === "requirements") {
      if (selectedItemIds.length === 0) {
        nextErrors.items = isConversion
          ? "Select at least one converted requirement"
          : "Add at least one product";
      }
      if (
        selectedItems.some(
          (item) =>
            (item.source === "enquiry-existing" ||
              item.source === "new-existing") &&
            !item.productCode?.trim(),
        )
      ) {
        nextErrors.items = "Every existing product needs a product code";
      }
      if (selectedItems.some((item) => !item.estimatedDelivery)) {
        nextErrors.estimatedDelivery =
          "Estimated delivery date is required for every product";
      }
    }
    if (stepId === "details" || !isConversion) {
      if (
        activeCustomItem &&
        (!activeCustomItem.requirement?.category.trim() ||
          !activeCustomItem.requirement.metalType.trim() ||
          !activeCustomItem.requirement.metalWeight.trim())
      ) {
        nextErrors.requirements =
          "Each custom requirement needs a category, metal type, and metal weight";
      }
    }
    if (stepId === "customer" || stepId === "review") {
      if (!form.customerName.trim()) {
        nextErrors.customerName = "Name is required";
      }
      if (!form.customerPhone.trim()) {
        nextErrors.customerPhone = "Phone is required";
      }
      if (!form.customerAddress.trim()) {
        nextErrors.customerAddress = "Address is required";
      }
    }
    return nextErrors;
  }

  function goNext() {
    setErrors({});
    const nextErrors = validateStep();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    if (!isLastStep) {
      if (stepId === "details" && activeCustomItem) {
        const confirmedIds = new Set([
          ...confirmedRequirementIds,
          activeCustomItem.id,
        ]);
        const nextRequirement = selectedCustomItems.find(
          (item) => !confirmedIds.has(item.id),
        );

        setConfirmedRequirementIds([...confirmedIds]);
        if (nextRequirement) {
          setActiveRequirementId(nextRequirement.id);
          return;
        }
      }
      setAnimDir("forward");
      if (stepId === "requirements" && isConversion) {
        setActiveRequirementId(selectedCustomItems[0]?.id ?? null);
        setConfirmedRequirementIds([]);
        setCustomReferenceLinkInput("");
        setCustomReferenceError("");
      }
      setCurrentStep((prev) => prev + 1);
    }
  }

  function goBack() {
    if (isFirstStep) {
      router.back();
      return;
    }
    setErrors({});
    setAnimDir("backward");
    setCurrentStep((prev) => prev - 1);
  }

  async function mapItemToOrderProduct(
    item: OrderItem,
  ): Promise<CreateOrdersInput["orders"][number]> {
    if (item.source === "enquiry-existing" || item.source === "new-existing") {
      return {
        productType: "EXISTING",
        ...(isConversion ? { sourceEnquiryItemId: item.id } : {}),
        productCode: item.productCode ?? "",
        notes: item.notes,
        isCadRequired: item.cadApprovalRequired,
        estimatedDeliveryDate: item.estimatedDelivery,
        vendor: item.vendor.trim() || undefined,
      };
    }

    const requirement = item.requirement;
    if (!requirement) throw new Error("Custom requirement details are missing.");
    const references = await Promise.all(
      requirement.references.map(async (reference) => {
        if (reference.type === "image" && reference.file) {
          return uploadEnquiryImage(reference.file);
        }
        if (reference.url.startsWith("blob:")) {
          throw new Error("Upload the reference before converting this order.");
        }
        return {
          type: reference.type.toUpperCase() as "IMAGE" | "VIDEO" | "LINK",
          url: reference.url,
          name: reference.name,
          mimeType: reference.mimeType,
          size: reference.size,
        };
      }),
    );
    const specification: CustomProductRequirementSpecification = {
      references,
      diamonds: requirement.diamonds.map(({ id: _id, ...diamond }) => diamond),
      colorStones: requirement.colorStones.map(({ id: _id, ...stone }) => stone),
      details: { ...requirement.details },
      notes: requirement.notes || undefined,
    };
    const productSize = Number(requirement.details.productSize);
    const stoneRows = [
      ...requirement.diamonds.map((diamond) => ({
        stoneType: `Diamond - ${diamond.type || "Unspecified"}`,
        approxPieces: Number(diamond.pieces) || 1,
        netWeight: diamond.weight || undefined,
      })),
      ...requirement.colorStones
        .filter((stone) => stone.stoneType?.trim())
        .map((stone) => ({
          stoneType: stone.stoneType?.trim() || "Colour stone",
          approxPieces: Number(stone.pieces) || 1,
          netWeight: stone.weight || undefined,
        })),
    ];

    return {
      productType: "CUSTOM",
      ...(isConversion ? { sourceEnquiryItemId: item.id } : {}),
      customProduct: {
        category: mapCategoryToBackend(requirement.category),
        referenceProductCode: requirement.referenceProductCode || undefined,
        metalType: requirement.metalType,
        metalPurity: requirement.metalPurity || undefined,
        metalColor: mapMetalColorToBackend(requirement.details.metalColor || ""),
        size: Number.isInteger(productSize) ? productSize : undefined,
        metalNetWeight: requirement.metalWeight,
        stones: stoneRows,
      },
      requirementSpecification: specification,
      notes: requirement.notes || undefined,
      isCadRequired: item.cadApprovalRequired,
      estimatedDeliveryDate: item.estimatedDelivery,
      vendor: item.vendor.trim() || undefined,
    };
  }

  async function buildPayload(): Promise<CreateOrdersInput> {
    const createdBy = session?.user?.id;
    if (!createdBy) throw new Error("Unable to determine creator.");
    if (isConversion && !enquiryDetails?.enquiry.refCode) {
      throw new Error("Unable to determine source enquiry.");
    }

    return {
      ...(isConversion ? { sourceEnquiry: enquiryDetails!.enquiry.refCode } : {}),
      name: form.customerName.trim(),
      phoneNumber: form.customerPhone.trim(),
      customerAddress: form.customerAddress.trim() || undefined,
      salesPerson: createdBy,
      orders: await Promise.all(selectedItems.map(mapItemToOrderProduct)),
    };
  }

  async function handleSubmit() {
    const nextErrors = {
      ...validateStep(),
      ...(selectedItems.length === 0
        ? { items: isConversion ? "Select at least one converted requirement" : "Add at least one product" }
        : {}),
      ...(selectedItems.some((item) => !item.estimatedDelivery)
        ? {
            estimatedDelivery:
              "Estimated delivery date is required for every product",
          }
        : {}),
    };
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      if (isConversion && !enquiryDetails) {
        throw new Error("Unable to load source enquiry.");
      }
      const sourceRefCode = enquiryDetails?.enquiry.refCode;
      const response = await createOrdersMutation.mutateAsync(await buildPayload());
      if (isConversion && enquiryId && sourceRefCode) {
        void queryClient.invalidateQueries({ queryKey: enquiryKeys.detail(enquiryId) });
        void queryClient.invalidateQueries({ queryKey: enquiryKeys.detailByRefCode(sourceRefCode) });
      }
      setSubmitted(true);
      setTimeout(() => {
        const refCode = response.refCodes?.length === 1 && response.refCodes[0];
        router.push(
          refCode ? `/orders/${refCode}` : "/orders-workspace?type=order",
        );
      }, 1200);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Unable to create the order. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isConversion && isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading enquiry...</p>
      </div>
    );
  }

  if (isConversion && (isError || !enquiryDetails)) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Unable to load enquiry details. Please go back and try again.
        </p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center justify-center gap-4 py-28 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 dark:border-emerald-500/20 dark:bg-emerald-500/10">
          <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-foreground">
            Order created
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Redirecting you to the order workspace...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl pb-28">
      {/* Progress bar */}
      <div className="mb-2">
        <div className="h-[2px] w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Back button */}
      <div className="mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="-ml-2 gap-1.5 text-muted-foreground"
        >
          <ArrowLeft className="size-3.5" />
          {isConversion ? "Back to enquiry" : "Back to orders"}
        </Button>
      </div>

      {/* Step content */}
      <div
        key={`step-${safeStep}-${stepId}`}
        className={cn(
          "flex min-h-[68vh] flex-col justify-center px-1",
          "animate-in fade-in-0 duration-300",
          animDir === "forward"
            ? "slide-in-from-bottom-3"
            : "slide-in-from-top-3",
        )}
      >
        {stepId === "requirements" && (
          isConversion ? <RequirementConfirmationStep
            form={form}
            selectedItemIds={selectedItemIds}
            setSelectedItemIds={setSelectedItemIds}
            errors={errors}
            submitError={submitError}
            updateItem={updateItem}
            updateItemCadApproval={updateItemCadApproval}
          /> : <RequirementDetailsStep
            items={selectedItems}
            isConversion={false}
            activeRequirementId={activeRequirementId}
            setActiveRequirementId={setActiveRequirementId}
            updateRequirement={(itemId, requirement) =>
              setForm((prev) => ({
                ...prev,
                items: prev.items.map((item) =>
                  item.id === itemId
                    ? {
                        ...item,
                        name: requirement.category || "Custom product",
                        category: requirement.category,
                        metalType: requirement.metalType,
                        metalPurity: requirement.metalPurity,
                        metalNetWeight: requirement.metalWeight,
                        notes: requirement.notes,
                        requirement,
                      }
                    : item,
                ),
              }))
            }
            errors={errors}
          />
        )}

        {stepId === "customer" && (
          <CustomerStep form={form} setForm={setForm} errors={errors} />
        )}

        {stepId === "details" && (
          <RequirementDetailsStep
            items={selectedItems}
            isConversion={isConversion}
            activeRequirementId={activeRequirementId}
            setActiveRequirementId={setActiveRequirementId}
            updateRequirement={(itemId, requirement) =>
              setForm((prev) => ({
                ...prev,
                items: prev.items.map((item) =>
                  item.id === itemId
                    ? {
                        ...item,
                        name: requirement.category || "Custom product",
                        category: requirement.category,
                        metalType: requirement.metalType,
                        metalPurity: requirement.metalPurity,
                        metalNetWeight: requirement.metalWeight,
                        notes: requirement.notes,
                        requirement,
                      }
                    : item,
                ),
              }))
            }
            errors={errors}
          />
        )}

        {stepId === "review" && (
          <ReviewStep
            form={form}
            items={selectedItems}
            canEditSelection={!isConversion || form.items.length > 1}
            submitError={submitError}
            errors={errors}
            onEditRequirements={() => {
              setAnimDir("backward");
              setCurrentStep(0);
            }}
            onEditDetails={(itemId) => {
              setActiveRequirementId(itemId);
              setConfirmedRequirementIds([]);
              setAnimDir("backward");
              setCurrentStep(isConversion ? 1 : 0);
            }}
            onEditCustomer={() => {
              setAnimDir("backward");
              setCurrentStep(isConversion ? 2 : 1);
            }}
          />
        )}
      </div>

      {/* Floating bottom nav */}
      <div className="pointer-events-none fixed right-0 bottom-6 left-0 z-40 md:left-[var(--sidebar-width)] group-data-[collapsible=icon]/sidebar-wrapper:md:left-[var(--sidebar-width-icon)]">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-4">
          <div className="pointer-events-auto flex items-center gap-1 rounded-lg border border-border bg-card shadow-md">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={goBack}
              disabled={isSubmitting}
              className="rounded-r-none text-muted-foreground"
              aria-label="Previous step"
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <div className="h-5 w-px bg-border" />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={goNext}
              disabled={isLastStep || isSubmitting}
              className="rounded-l-none text-muted-foreground"
              aria-label="Next step"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
          {!isLastStep && (
            <Button
              type="button"
              size="sm"
              onClick={goNext}
              disabled={isSubmitting || !hasItems}
              className="pointer-events-auto ml-auto gap-2 px-5 shadow-md"
            >
              {stepId === "details" && hasNextCustomRequirement
                ? "Save & Next requirement"
                : "Save & Next"}
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}
          {isLastStep && (
            <Button
              type="button"
              size="sm"
              onClick={handleSubmit}
              disabled={isSubmitting || !hasItems}
              className="pointer-events-auto ml-auto gap-2 px-5 shadow-md"
            >
              {isSubmitting ? (isConversion ? "Converting..." : "Creating...") : (isConversion ? "Confirm & Convert" : "Create order")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Products Step ──────────────────────────────────────────────────────────

function RequirementConfirmationStep({
  form,
  selectedItemIds,
  setSelectedItemIds,
  errors,
  submitError,
  updateItem,
  updateItemCadApproval,
}: {
  form: ConvertFormData;
  selectedItemIds: string[];
  setSelectedItemIds: React.Dispatch<React.SetStateAction<string[]>>;
  errors: Record<string, string>;
  submitError: string;
  updateItem: (
    id: string,
    patch: Partial<
      Pick<OrderItem, "vendor" | "estimatedDelivery" | "cadApprovalRequired">
    >,
  ) => void;
  updateItemCadApproval: (itemId: string, cadApprovalRequired: boolean) => void;
}) {
  const isSingleRequirement = form.items.length === 1;
  const areAllRequirementsSelected =
    form.items.length > 0 && selectedItemIds.length === form.items.length;

  function toggleItem(itemId: string, checked: boolean) {
    if (isSingleRequirement) return;
    setSelectedItemIds((prev) =>
      checked
        ? [...new Set([...prev, itemId])]
        : prev.filter((id) => id !== itemId),
    );
  }

  function toggleAllRequirements() {
    setSelectedItemIds(
      areAllRequirementsSelected ? [] : form.items.map((item) => item.id),
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Confirm converted requirements
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Select final requirements and add delivery date and CAD details.
          </p>
        </div>
        {!isSingleRequirement && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={toggleAllRequirements}
            className="shrink-0"
          >
            {areAllRequirementsSelected ? "Clear all" : "Select all"}
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {form.items.map((item, index) => {
          const isSelected = selectedItemIds.includes(item.id);

          return (
            <RequirementConversionCard
              key={item.id}
              item={item}
              index={index}
              isSelected={isSelected}
              isSelectionLocked={isSingleRequirement}
              onSelectionChange={(checked) => toggleItem(item.id, checked)}
              updateItem={updateItem}
              updateItemCadApproval={updateItemCadApproval}
            />
          );
        })}
      </div>

      {errors.items && (
        <p className="text-sm text-destructive">{errors.items}</p>
      )}
      {errors.estimatedDelivery && (
        <p className="text-sm text-destructive">{errors.estimatedDelivery}</p>
      )}
      {submitError && <p className="text-sm text-destructive">{submitError}</p>}
    </div>
  );
}

function RequirementDetailsStep({
  items,
  isConversion,
  activeRequirementId,
  setActiveRequirementId,
  updateRequirement,
  errors,
}: {
  items: OrderItem[];
  isConversion: boolean;
  activeRequirementId: string | null;
  setActiveRequirementId: (id: string) => void;
  updateRequirement: (itemId: string, requirement: RequirementDraft) => void;
  errors: Record<string, string>;
}) {
  const customItems = items.filter(
    (item) => item.source === "enquiry-custom" || item.source === "new-custom",
  );
  const activeItem =
    customItems.find((item) => item.id === activeRequirementId) ?? customItems[0];

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Edit requirement details
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Confirm the custom details for every selected requirement.
        </p>
      </div>

      {customItems.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {customItems.map((item, index) => (
            <Button
              key={item.id}
              type="button"
              variant={activeItem?.id === item.id ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveRequirementId(item.id)}
              className="shrink-0"
            >
              Requirement {items.findIndex((candidate) => candidate.id === item.id) + 1}
              {item.category ? `: ${item.category}` : ` ${index + 1}`}
            </Button>
          ))}
        </div>
      )}

      {activeItem ? (
        <V2CustomProductForm
          value={activeItem.requirement ?? createEmptyRequirement()}
          onChange={(requirement) => updateRequirement(activeItem.id, requirement)}
          onSubmit={() => undefined}
          showActions={false}
          hideDeliveryDate
        />
      ) : (
        <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
          {isConversion
            ? "The selected requirements are existing inventory products. Their product codes stay linked to the original enquiry."
            : "This order currently contains existing inventory products. Their product codes will be preserved."}
        </div>
      )}

      {errors.requirements && (
        <p className="text-sm text-destructive">{errors.requirements}</p>
      )}
    </div>
  );
}

function RequirementConversionCard({
  item,
  index,
  isSelected = true,
  isSelectionLocked = false,
  onSelectionChange,
  updateItem,
  updateItemCadApproval,
}: {
  item: OrderItem;
  index: number;
  isSelected?: boolean;
  isSelectionLocked?: boolean;
  onSelectionChange?: (checked: boolean) => void;
  updateItem: (
    id: string,
    patch: Partial<
      Pick<OrderItem, "vendor" | "estimatedDelivery" | "cadApprovalRequired">
    >,
  ) => void;
  updateItemCadApproval: (itemId: string, cadApprovalRequired: boolean) => void;
}) {
  const deliveryOptions = [
    { label: "Standard", days: 17 },
    { label: "CAD", days: 20 },
    { label: "Extended", days: 30 },
  ];

  return (
    <div
      role={isSelectionLocked ? undefined : "checkbox"}
      aria-checked={isSelectionLocked ? undefined : isSelected}
      tabIndex={isSelectionLocked ? undefined : 0}
      onClick={() => {
        if (!isSelectionLocked) onSelectionChange?.(!isSelected);
      }}
      onKeyDown={(event) => {
        if (
          !isSelectionLocked &&
          (event.key === "Enter" || event.key === " ")
        ) {
          event.preventDefault();
          onSelectionChange?.(!isSelected);
        }
      }}
      className={cn(
        "space-y-4 rounded-lg border bg-card p-4 transition-opacity",
        !isSelectionLocked && "cursor-pointer",
        isSelected ? "border-primary/50" : "border-border opacity-45",
      )}
    >
      <div className="flex gap-3">
        {!isSelectionLocked && (
          <div onClick={(event) => event.stopPropagation()}>
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) =>
                onSelectionChange?.(checked === true)
              }
              aria-label={`Select requirement ${index + 1}`}
              className="mt-1"
            />
          </div>
        )}
        <RequirementSnapshot item={item} index={index} />
      </div>

      {isSelected && (
        <div
          className="grid gap-4 border-t border-border pt-4 md:grid-cols-[minmax(0,1fr)_220px]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-foreground">CAD approval</p>
            <label className="flex h-10 cursor-pointer items-center gap-2 rounded-md border border-border bg-muted/20 px-3 text-sm transition-colors hover:bg-muted/35">
              <Checkbox
                checked={item.cadApprovalRequired}
                onCheckedChange={(checked) =>
                  updateItemCadApproval(item.id, checked === true)
                }
              />
              <span className="font-medium text-foreground">
                Customer requires CAD
              </span>
            </label>
          </div>
          <FormField label="Estimated delivery date" required>
            <Input
              type="date"
              value={item.estimatedDelivery}
              onChange={(event) =>
                updateItem(item.id, { estimatedDelivery: event.target.value })
              }
              className="h-10 w-full"
            />
          </FormField>
          <div className="space-y-1.5 md:col-span-2">
            <p className="text-sm font-medium text-foreground">Delivery target</p>
            <div className="flex flex-wrap gap-2">
              {deliveryOptions.map((option) => {
                const date = addDaysDateString(new Date(), option.days);
                const isOptionSelected = item.estimatedDelivery === date;

                return (
                  <Button
                    key={option.days}
                    type="button"
                    variant={isOptionSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                      updateItem(item.id, { estimatedDelivery: date })
                    }
                    className="h-8 text-xs"
                  >
                    {option.label} ({option.days} days)
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
function RequirementSnapshot({
  item,
  index,
}: {
  item: OrderItem;
  index: number;
}) {
  const metal = [formatMetalTypeLabel(item.metalType || ""), item.metalPurity]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="min-w-0 flex-1 space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">
            Requirement {index + 1}: {item.name}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {item.source === "enquiry-existing" || item.source === "new-existing"
              ? "Existing product"
              : "Custom product"}
            {item.productCode ? ` · ${item.productCode}` : ""}
          </p>
        </div>
        {item.imageUrl ? (
          // biome-ignore lint/performance/noImgElement: enquiry media URL
          <img
            src={item.imageUrl}
            alt={item.name}
            className="h-12 w-12 shrink-0 rounded-md border border-border bg-muted object-cover"
          />
        ) : null}
      </div>

      <div className="grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-4">
        <RequirementFact label="Category" value={item.category} />
        <RequirementFact label="Metal" value={metal} />
        <RequirementFact label="Net weight" value={item.metalNetWeight} />
        <RequirementFact label="Size" value={item.size} />
      </div>

      {item.notes ? (
        <p className="whitespace-pre-wrap text-xs leading-5 text-muted-foreground">
          <span className="font-medium text-foreground">Notes:</span>{" "}
          {item.notes}
        </p>
      ) : null}
    </div>
  );
}

function RequirementFact({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  if (!value?.trim()) return null;

  return (
    <div className="rounded-md border border-border/70 bg-muted/20 px-2.5 py-2">
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 truncate font-medium text-foreground">{value}</p>
    </div>
  );
}

function ProductsStep({
  form,
  productAddMode,
  setProductAddMode,
  productSearch,
  setProductSearch,
  searchResults,
  searchInputRef,
  productLookupLoading,
  productLookupError,
  notFoundCode,
  isScannerOpen,
  setIsScannerOpen,
  newProductDraft,
  setNewProductDraft,
  referenceLinkInput,
  setReferenceLinkInput,
  referenceError,
  setReferenceError,
  errors,
  submitError,
  updateItem,
  updateItemCadApproval,
  removeItem,
  addInventoryProduct,
  searchInventoryProducts,
  addNewCustomProduct,
  cancelNewCustomProduct,
  addReferenceLink,
  addReferenceFiles,
  removeDraftReference,
}: {
  form: ConvertFormData;
  productAddMode: ProductAddMode;
  setProductAddMode: (mode: ProductAddMode) => void;
  productSearch: string;
  setProductSearch: (value: string) => void;
  searchResults: Product[];
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  productLookupLoading: boolean;
  productLookupError: string;
  notFoundCode: string;
  isScannerOpen: boolean;
  setIsScannerOpen: (open: boolean) => void;
  newProductDraft: NewProduct;
  setNewProductDraft: React.Dispatch<React.SetStateAction<NewProduct>>;
  referenceLinkInput: string;
  setReferenceLinkInput: (value: string) => void;
  referenceError: string;
  setReferenceError: (value: string) => void;
  errors: Record<string, string>;
  submitError: string;
  updateItem: (
    itemId: string,
    patch: Partial<
      Pick<OrderItem, "vendor" | "estimatedDelivery" | "cadApprovalRequired">
    >,
  ) => void;
  updateItemCadApproval: (itemId: string, cadApprovalRequired: boolean) => void;
  removeItem: (itemId: string) => void;
  addInventoryProduct: (product: Product) => void;
  searchInventoryProducts: (code: string) => void;
  addNewCustomProduct: () => void;
  cancelNewCustomProduct: () => void;
  addReferenceLink: () => void;
  addReferenceFiles: (files: FileList | null) => void;
  removeDraftReference: (id: string) => void;
}) {
  return (
    <div className="mx-auto w-full space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Build the order
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Add inventory products or capture a complete custom requirement.
        </p>
      </div>
      {/* Existing products */}
      {form.items.length > 0 && (
        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/80">
            Order products
          </p>
          <div className="space-y-3">
            {form.items.map((item) => (
              <OrderItemCard
                key={item.id}
                item={item}
                updateItem={updateItem}
                updateItemCadApproval={updateItemCadApproval}
                removeItem={removeItem}
              />
            ))}
          </div>
        </div>
      )}

      {errors.items && (
        <p className="text-sm text-destructive">{errors.items}</p>
      )}
      {errors.estimatedDelivery && (
        <p className="text-sm text-destructive">{errors.estimatedDelivery}</p>
      )}
      {submitError && <p className="text-sm text-destructive">{submitError}</p>}

      {/* Add new products */}
      <div className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/80">
          Add Other Products
        </p>
        <div className="grid gap-3 lg:grid-cols-2">
          <InventoryQuickEntry
            productSearch={productSearch}
            setProductSearch={setProductSearch}
            searchResults={searchResults}
            searchInputRef={searchInputRef}
            isLoading={productLookupLoading}
            error={productLookupError}
            notFoundCode={notFoundCode}
            isScannerOpen={isScannerOpen}
            setIsScannerOpen={setIsScannerOpen}
            searchInventoryProducts={searchInventoryProducts}
            addProduct={addInventoryProduct}
          />
          <ProductModeButton
            icon={<Pencil className="h-4 w-4 text-primary" />}
            title="Add custom product"
            description="Add complete product requirements"
            onClick={addNewCustomProduct}
          />
        </div>
      </div>
    </div>
  );
}

function OrderItemCard({
  item,
  updateItem,
  updateItemCadApproval,
  removeItem,
}: {
  item: OrderItem;
  updateItem: (
    id: string,
    patch: Partial<
      Pick<OrderItem, "vendor" | "estimatedDelivery" | "cadApprovalRequired">
    >,
  ) => void;
  updateItemCadApproval: (itemId: string, cadApprovalRequired: boolean) => void;
  removeItem: (id: string) => void;
}) {
  const isNew = item.source === "new-existing" || item.source === "new-custom";
  const deliveryOptions = [
    { label: "Standard", days: 17 },
    { label: "CAD", days: 20 },
    { label: "Extended", days: 30 },
  ];

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          {item.imageUrl ? (
            // biome-ignore lint/performance/noImgElement: local object URLs and remote inventory images
            <img
              src={item.imageUrl}
              alt={item.name}
              className="h-10 w-10 shrink-0 rounded-lg border border-border/60 bg-muted object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              {isNew && item.source === "new-custom" ? (
                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <span className="text-xs font-bold text-muted-foreground">
                  {item.productCode?.slice(0, 4) || item.name?.slice(0, 2)}
                </span>
              )}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{item.name}</p>
            <p className="text-xs text-muted-foreground">
              {item.productCode ? `${item.productCode} · ` : ""}
              {formatMetalTypeLabel(item.metalType || "")} {item.metalPurity}
              {item.basePrice ? ` · ${formatCurrency(item.basePrice)}` : ""}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 rounded-md border border-border bg-muted/20 px-3 py-2 text-sm transition-colors hover:bg-muted/30">
            <Checkbox
              checked={item.cadApprovalRequired}
              onCheckedChange={(checked) =>
                updateItemCadApproval(item.id, checked === true)
              }
              aria-label="CAD required before order"
            />
            <span className="font-medium text-foreground">
              CAD required before order
            </span>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => removeItem(item.id)}
            className="shrink-0 text-muted-foreground/60 hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
        <FormField label="Vendor" optional>
          <Input
            placeholder="e.g. ABC Jewellers"
            value={item.vendor}
            onChange={(e) => updateItem(item.id, { vendor: e.target.value })}
            className="h-10 w-full"
          />
        </FormField>
        <FormField label="Estimated delivery date" required>
          <Input
            type="date"
            value={item.estimatedDelivery}
            onChange={(e) =>
              updateItem(item.id, { estimatedDelivery: e.target.value })
            }
            className="h-10 w-full"
          />
        </FormField>
      </div>
      <div className="flex flex-wrap gap-2">
        {deliveryOptions.map((option) => {
          const date = addDaysDateString(new Date(), option.days);
          const isSelected = item.estimatedDelivery === date;

          return (
            <Button
              key={option.days}
              type="button"
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() =>
                updateItem(item.id, { estimatedDelivery: date })
              }
              className="h-8 text-xs"
            >
              {option.label} ({option.days} days)
            </Button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Customer Step ──────────────────────────────────────────────────────────

function CustomerStep({
  form,
  setForm,
  errors,
}: {
  form: ConvertFormData;
  setForm: React.Dispatch<React.SetStateAction<ConvertFormData>>;
  errors: Record<string, string>;
}) {
  return (
    <div className="mx-auto w-full max-w-lg space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Confirm customer details
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Review and add the delivery address
        </p>
      </div>

      <div className="space-y-4">
        <FormField label="Name" required>
          <Input
            value={form.customerName}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, customerName: e.target.value }))
            }
            className="h-11"
            placeholder="Customer name"
          />
          {errors.customerName && (
            <p className="text-[11px] text-destructive">
              {errors.customerName}
            </p>
          )}
        </FormField>

        <FormField label="Phone number" required>
          <Input
            value={form.customerPhone}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, customerPhone: e.target.value }))
            }
            className="h-11"
            placeholder="Phone number"
          />
          {errors.customerPhone && (
            <p className="text-[11px] text-destructive">
              {errors.customerPhone}
            </p>
          )}
        </FormField>

        <FormField label="Address" required>
          <Textarea
            value={form.customerAddress}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, customerAddress: e.target.value }))
            }
            placeholder="Enter full delivery address..."
            rows={3}
            className="resize-none"
          />
          {errors.customerAddress && (
            <p className="text-[11px] text-destructive">
              {errors.customerAddress}
            </p>
          )}
        </FormField>
      </div>
    </div>
  );
}

function ReviewStep({
  form,
  items,
  submitError,
  errors,
  canEditSelection,
  onEditRequirements,
  onEditDetails,
  onEditCustomer,
}: {
  form: ConvertFormData;
  items: OrderItem[];
  submitError: string;
  errors: Record<string, string>;
  canEditSelection: boolean;
  onEditRequirements: () => void;
  onEditDetails: (itemId: string) => void;
  onEditCustomer: () => void;
}) {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div className="text-center">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Confirm order details
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Review the fields that will be sent to the order API.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-foreground">Customer details</p>
          <Button type="button" variant="outline" size="sm" onClick={onEditCustomer} className="gap-1.5">
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <ReviewField label="Customer" value={form.customerName} />
          <ReviewField label="Phone" value={form.customerPhone} />
          <ReviewField label="Address" value={form.customerAddress} />
        </div>
      </div>

      <div className="space-y-3 rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-foreground">Requirements to convert</p>
          {canEditSelection && (
            <Button type="button" variant="outline" size="sm" onClick={onEditRequirements} className="gap-1.5">
              <Pencil className="h-3.5 w-3.5" />
              Selection
            </Button>
          )}
        </div>
        {items.map((item, index) => (
          <div
            key={item.id}
            className="space-y-3 rounded-md border border-border bg-muted/10 p-4"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {index + 1}. {item.name}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {item.source === "enquiry-existing" ||
                  item.source === "new-existing"
                    ? "Existing product"
                    : "Custom product"}
                  {item.productCode ? ` · ${item.productCode}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {item.source === "enquiry-custom" || item.source === "new-custom" ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onEditDetails(item.id)}
                    className="gap-1.5"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Details
                  </Button>
                ) : null}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <ReviewField
                label="Delivery date"
                value={item.estimatedDelivery}
              />
              <ReviewField
                label="Metal"
                value={
                  [formatMetalTypeLabel(item.metalType || ""), item.metalPurity]
                    .filter(Boolean)
                    .join(" ") || "Not set"
                }
              />
              <ReviewField
                label="Net weight"
                value={item.metalNetWeight || "Not set"}
              />
              <div className="flex items-end justify-start lg:justify-end">
                <span className="w-fit rounded-md border border-border bg-muted/30 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  {item.cadApprovalRequired ? "CAD required" : "No CAD required"}
                </span>
              </div>
            </div>
            {item.notes && (
              <ReviewField label="Notes" value={item.notes} multiline />
            )}
          </div>
        ))}
      </div>

      {Object.values(errors).length > 0 && (
        <p className="text-sm text-destructive">
          Resolve the highlighted fields before converting.
        </p>
      )}
      {submitError && <p className="text-sm text-destructive">{submitError}</p>}
    </div>
  );
}

function ReviewField({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-sm text-foreground",
          multiline ? "whitespace-pre-wrap" : "truncate",
        )}
      >
        {value || "Not set"}
      </p>
    </div>
  );
}

// ─── Reusable Product Components (from enquiry form) ───────────────────────

function ProductModeButton({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-full cursor-pointer flex-col items-center justify-center gap-2.5 rounded-xl border-2 border-border bg-card px-4 py-5 text-center transition-all hover:border-primary/30 hover:bg-muted/30"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
    </button>
  );
}

function InventoryQuickEntry({
  productSearch,
  setProductSearch,
  searchResults,
  searchInputRef,
  isLoading,
  error,
  notFoundCode,
  isScannerOpen,
  setIsScannerOpen,
  searchInventoryProducts,
  addProduct,
}: {
  productSearch: string;
  setProductSearch: (value: string) => void;
  searchResults: Product[];
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  isLoading: boolean;
  error: string;
  notFoundCode: string;
  isScannerOpen: boolean;
  setIsScannerOpen: (open: boolean) => void;
  searchInventoryProducts: (code: string) => void;
  addProduct: (product: Product) => void;
}) {
  const searchInventoryProductsRef = useRef(searchInventoryProducts);

  useEffect(() => {
    searchInventoryProductsRef.current = searchInventoryProducts;
  }, [searchInventoryProducts]);

  useEffect(() => {
    const code = productSearch.trim();
    if (!code) return;

    const timeoutId = window.setTimeout(() => {
      searchInventoryProductsRef.current(code);
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [productSearch]);

  return (
    <div className="space-y-4 rounded-xl border-2 border-border w-full bg-card flex flex-col justify-center items-center text-center px-4 py-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
        <Search className="h-4 w-4 text-primary" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">Find in inventory</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Search by code or scan a barcode
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsScannerOpen(true)}
          className="h-10 sm:w-28"
        >
          <ScanLine className="h-4 w-4" />
          Scan
        </Button>
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder="Search inventory..."
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === "Enter") searchInventoryProducts(productSearch);
            }}
            className="h-10 pl-10 uppercase"
          />
        </div>
      </div>
      <BarcodeScanDialog
        open={isScannerOpen}
        onOpenChange={setIsScannerOpen}
        onDecoded={(code) => searchInventoryProducts(code)}
      />
      {isLoading && (
        <p className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          Searching inventory...
        </p>
      )}
      {error && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}
      {notFoundCode && !error && (
        <p className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          No inventory product found for{" "}
          <span className="font-medium text-foreground">{notFoundCode}</span>.
        </p>
      )}
      {searchResults.length > 0 && (
        <div className="max-h-72 w-full overflow-y-auto rounded-xl border bg-card">
          {searchResults.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => addProduct(product)}
              className="flex w-full cursor-pointer items-center gap-3 px-3.5 py-3 text-left transition-colors hover:bg-muted/60"
            >
              <ProductThumbnail product={product} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{product.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {product.productCode} ·{" "}
                  {formatMetalTypeLabel(product.metalType)}{" "}
                  {product.metalPurity}
                </p>
              </div>
              {product.basePrice && (
                <span className="shrink-0 text-sm font-medium text-foreground">
                  {formatCurrency(product.basePrice)}
                </span>
              )}
              <Plus className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
