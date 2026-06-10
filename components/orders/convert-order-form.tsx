"use client";

import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Pencil,
  Plus,
  ScanLine,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BarcodeScanDialog } from "@/components/calculator/BarcodeScanDialog";
import { mapCatalogueDetailsToEnquiryProduct } from "@/components/enquiries/catalogue-product-mapping";
import {
  CATEGORIES,
  createEmptyNewProduct,
  METAL_PURITIES,
  METAL_TYPES,
  type NewProduct,
  POLISH_OPTIONS,
  type Product,
  type ProductAddMode,
  type ProductReference,
  STONE_CUTS,
  STONE_QUALITIES,
} from "@/components/enquiries/enquiry-form-types";
import {
  formatFileSize,
  formatMetalTypeLabel,
  generateId,
  getReferenceIcon,
  isValidReferenceLink,
  normalizeReferenceLink,
  ProductThumbnail,
  revokeObjectUrls,
} from "@/components/enquiries/enquiry-form-utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useEnquiryDetails } from "@/hooks/useEnquiries";
import { authClient } from "@/lib/auth-client";
import { normalizeDecodedId } from "@/lib/barcodeScanner";
import {
  fetchCatalogueProductDetails,
  searchCatalogueProductByCode,
} from "@/lib/catalogApi";
import { createOrder } from "@/lib/ordersApi";
import { cn, formatCurrency } from "@/lib/utils";
import type { BackendEnquiryMedia } from "@/types/enquiry-api";
import type {
  CreateOrderInput,
  CreateOrderProductInput,
} from "@/types/order-api";
import {
  addDaysDateString,
  customProductStones,
  referenceToOrderMedia,
} from "./order-form-utils";

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
  category?: string;
  metalType?: string;
  metalPurity?: string;
  imageUrl?: string;
  basePrice?: number;
  // Custom product fields
  polish?: string;
  stoneDescription?: string;
  stoneCut?: string;
  stoneQuality?: string;
  stoneCaratEstimate?: string;
  references?: ProductReference[];
  notes?: string;
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
    name: product.category
      ? `${product.category} - ${formatMetalTypeLabel(product.metalType)} ${product.metalPurity}`
      : `${formatMetalTypeLabel(product.metalType)} ${product.metalPurity}`,
    category: product.category,
    metalType: product.metalType,
    metalPurity: product.metalPurity,
    polish: product.polish,
    stoneDescription: product.stoneDescription,
    stoneCut: product.stoneCut,
    stoneQuality: product.stoneQuality,
    stoneCaratEstimate: product.stoneCaratEstimate,
    references: product.references,
    notes: product.notes,
    vendor: "",
    cadApprovalRequired: false,
    estimatedDelivery: addDaysDateString(createdAt, 17),
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ConvertOrderForm({ enquiryId }: { enquiryId: string }) {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const createdAtRef = useRef(new Date());
  const {
    data: enquiryDetails,
    isLoading,
    isError,
  } = useEnquiryDetails(enquiryId);

  const [currentStep, setCurrentStep] = useState(0);
  const [animDir, setAnimDir] = useState<"forward" | "backward">("forward");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");

  // Form state
  const [form, setForm] = useState<ConvertFormData>({
    items: [],
    customerName: "",
    customerPhone: "",
    customerAddress: "",
  });

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
  const steps = ["products", "customer"];
  const safeStep = Math.min(currentStep, steps.length - 1);
  const stepId = steps[safeStep];
  const progress = ((safeStep + 1) / steps.length) * 100;
  const isFirstStep = safeStep === 0;
  const isLastStep = safeStep === steps.length - 1;
  const hasItems = form.items.length > 0;

  // Pre-fill enquiry data
  useEffect(() => {
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
        orderItems.push({
          id: item.id,
          source: "enquiry-custom",
          name: item.productCode || "Custom product",
          category: "Custom",
          metalType: item.metalType || undefined,
          metalPurity: item.metalPurity || undefined,
          stoneDescription: stoneDesc,
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
  }, [enquiryDetails]);

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

  function removeItem(itemId: string) {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== itemId),
    }));
  }

  function addCatalogueProduct(product: Product) {
    const newItem = createOrderItemFromNewProduct(
      product,
      createdAtRef.current,
    );
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
    setProductSearch("");
    setSearchResults([]);
    setProductLookupError("");
    setNotFoundCode("");
  }

  async function lookupCatalogueProduct(rawCode: string) {
    const code = normalizeDecodedId(rawCode);
    if (!code) return;

    setProductSearch(code);
    setProductLookupError("");
    setNotFoundCode("");
    setSearchResults([]);
    setProductLookupLoading(true);

    try {
      const searchItem = await searchCatalogueProductByCode(code);
      if (!searchItem) {
        setNotFoundCode(code);
        return;
      }

      const details = await fetchCatalogueProductDetails(searchItem.slug);
      setSearchResults([mapCatalogueDetailsToEnquiryProduct(details)]);
    } catch (error) {
      setProductLookupError(
        error instanceof Error ? error.message : "Catalogue search failed",
      );
    } finally {
      setProductLookupLoading(false);
    }
  }

  function addNewCustomProduct() {
    if (!newProductDraft.metalType) return;
    const product = { ...newProductDraft, id: generateId() };
    const newItem = createOrderItemFromNewCustom(product, createdAtRef.current);
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
    setNewProductDraft(createEmptyNewProduct());
    setReferenceLinkInput("");
    setReferenceError("");
    setProductAddMode("choose");
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
    if (stepId === "products") {
      if (form.items.length === 0) {
        nextErrors.items = "Add at least one product";
      }
      if (form.items.some((item) => !item.estimatedDelivery)) {
        nextErrors.estimatedDelivery =
          "Estimated delivery date is required for every product";
      }
    }
    if (stepId === "customer") {
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
      setAnimDir("forward");
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

  function mapItemToOrderProduct(item: OrderItem): CreateOrderProductInput {
    const media: BackendEnquiryMedia[] = item.imageUrl
      ? [{ type: "IMAGE", url: item.imageUrl }]
      : (item.references ?? [])
          .map(referenceToOrderMedia)
          .filter((mediaItem): mediaItem is BackendEnquiryMedia =>
            Boolean(mediaItem),
          );

    return {
      id: item.id,
      source:
        item.source === "enquiry-existing" || item.source === "new-existing"
          ? "EXISTING"
          : "CUSTOM",
      sourceEnquiryItemId: item.source.startsWith("enquiry-")
        ? item.id
        : undefined,
      productCode: item.productCode,
      name: item.name,
      category: item.category,
      metalType: item.metalType,
      metalPurity: item.metalPurity,
      notes: item.notes,
      media,
      stones:
        item.source === "new-custom"
          ? customProductStones({
              ...createEmptyNewProduct(),
              id: item.id,
              metalType: item.metalType ?? "",
              metalPurity: item.metalPurity ?? "",
              stoneDescription: item.stoneDescription ?? "",
              stoneCaratEstimate: item.stoneCaratEstimate ?? "",
            })
          : item.stoneDescription
            ? [{ stoneType: item.stoneDescription }]
            : [],
      vendorName: item.vendor.trim() || undefined,
      cadApprovalRequired: item.cadApprovalRequired,
      estimatedDeliveryDate: item.estimatedDelivery,
    };
  }

  function buildPayload(): CreateOrderInput {
    const createdBy = session?.user?.id;
    if (!createdBy) throw new Error("Unable to determine creator.");

    return {
      sourceEnquiryId: enquiryId,
      customer: {
        name: form.customerName.trim(),
        phoneNumber: form.customerPhone.trim(),
        notes: enquiryDetails?.enquiry.notes ?? undefined,
        address: form.customerAddress.trim(),
      },
      products: form.items.map(mapItemToOrderProduct),
      createdBy,
    };
  }

  async function handleSubmit() {
    const nextErrors = {
      ...validateStep(),
      ...(form.items.length === 0 ? { items: "Add at least one product" } : {}),
      ...(form.items.some((item) => !item.estimatedDelivery)
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
      await createOrder(buildPayload());
      setSubmitted(true);
      setTimeout(() => {
        router.push("/orders-and-enquiries");
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

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading enquiry...</p>
      </div>
    );
  }

  if (isError || !enquiryDetails) {
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
            Redirecting you back to enquiries...
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
          Back to enquiry
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
        {stepId === "products" && (
          <ProductsStep
            form={form}
            productAddMode={productAddMode}
            setProductAddMode={setProductAddMode}
            productSearch={productSearch}
            setProductSearch={setProductSearch}
            searchResults={searchResults}
            searchInputRef={searchInputRef}
            productLookupLoading={productLookupLoading}
            productLookupError={productLookupError}
            notFoundCode={notFoundCode}
            isScannerOpen={isScannerOpen}
            setIsScannerOpen={setIsScannerOpen}
            newProductDraft={newProductDraft}
            setNewProductDraft={setNewProductDraft}
            referenceLinkInput={referenceLinkInput}
            setReferenceLinkInput={setReferenceLinkInput}
            referenceError={referenceError}
            setReferenceError={setReferenceError}
            errors={errors}
            submitError={submitError}
            updateItem={updateItem}
            updateItemCadApproval={updateItemCadApproval}
            removeItem={removeItem}
            addCatalogueProduct={addCatalogueProduct}
            lookupCatalogueProduct={lookupCatalogueProduct}
            addNewCustomProduct={addNewCustomProduct}
            cancelNewCustomProduct={cancelNewCustomProduct}
            addReferenceLink={addReferenceLink}
            addReferenceFiles={addReferenceFiles}
            removeDraftReference={removeDraftReference}
          />
        )}

        {stepId === "customer" && (
          <CustomerStep form={form} setForm={setForm} errors={errors} />
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
          {isLastStep && (
            <Button
              type="button"
              size="sm"
              onClick={handleSubmit}
              disabled={isSubmitting || !hasItems}
              className="pointer-events-auto ml-auto gap-2 px-5 shadow-md"
            >
              {isSubmitting ? "Creating..." : "Create Order"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Products Step ──────────────────────────────────────────────────────────

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
  addCatalogueProduct,
  lookupCatalogueProduct,
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
  addCatalogueProduct: (product: Product) => void;
  lookupCatalogueProduct: (code: string) => void;
  addNewCustomProduct: () => void;
  cancelNewCustomProduct: () => void;
  addReferenceLink: () => void;
  addReferenceFiles: (files: FileList | null) => void;
  removeDraftReference: (id: string) => void;
}) {
  return (
    <div className="mx-auto w-full space-y-6">
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
      {productAddMode === "choose" && (
        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/80">
            Add products
          </p>
          <div className="grid gap-3 lg:grid-cols-2">
            <CatalogueQuickEntry
              productSearch={productSearch}
              setProductSearch={setProductSearch}
              searchResults={searchResults}
              searchInputRef={searchInputRef}
              isLoading={productLookupLoading}
              error={productLookupError}
              notFoundCode={notFoundCode}
              isScannerOpen={isScannerOpen}
              setIsScannerOpen={setIsScannerOpen}
              lookupCatalogueProduct={lookupCatalogueProduct}
              addProduct={addCatalogueProduct}
            />
            <ProductModeButton
              icon={<Pencil className="h-4 w-4 text-primary" />}
              title="Add custom product"
              description="Describe the product requirement"
              onClick={() => setProductAddMode("custom")}
            />
          </div>
        </div>
      )}

      {productAddMode === "custom" && (
        <CustomProductForm
          draft={newProductDraft}
          setDraft={setNewProductDraft}
          referenceLinkInput={referenceLinkInput}
          setReferenceLinkInput={setReferenceLinkInput}
          referenceError={referenceError}
          setReferenceError={setReferenceError}
          addReferenceLink={addReferenceLink}
          addReferenceFiles={addReferenceFiles}
          removeDraftReference={removeDraftReference}
          addNewProduct={addNewCustomProduct}
          onCancel={cancelNewCustomProduct}
        />
      )}
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
  const isExisting = item.source === "enquiry-existing";

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          {item.imageUrl ? (
            // biome-ignore lint/performance/noImgElement: local object URLs and remote catalogue images
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

function CatalogueQuickEntry({
  productSearch,
  setProductSearch,
  searchResults,
  searchInputRef,
  isLoading,
  error,
  notFoundCode,
  isScannerOpen,
  setIsScannerOpen,
  lookupCatalogueProduct,
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
  lookupCatalogueProduct: (code: string) => void;
  addProduct: (product: Product) => void;
}) {
  return (
    <div className="space-y-4 rounded-xl border-2 border-border w-full bg-card flex flex-col justify-center items-center text-center px-4 py-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
        <Search className="h-4 w-4 text-primary" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">Find in catalogue</p>
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
        <div className="flex min-w-0 flex-1 gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              placeholder="Search catalogue..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === "Enter") lookupCatalogueProduct(productSearch);
              }}
              className="h-10 pl-10 uppercase"
            />
          </div>
          <Button
            type="button"
            onClick={() => lookupCatalogueProduct(productSearch)}
            disabled={!productSearch.trim() || isLoading}
            className="h-10 w-10 px-0"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      <BarcodeScanDialog
        open={isScannerOpen}
        onOpenChange={setIsScannerOpen}
        onDecoded={(code) => lookupCatalogueProduct(code)}
      />
      {isLoading && (
        <p className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          Searching catalogue...
        </p>
      )}
      {error && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}
      {notFoundCode && !error && (
        <p className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          No catalogue product found for{" "}
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

function CustomProductForm({
  draft,
  setDraft,
  referenceLinkInput,
  setReferenceLinkInput,
  referenceError,
  setReferenceError,
  addReferenceLink,
  addReferenceFiles,
  removeDraftReference,
  addNewProduct,
  onCancel,
}: {
  draft: NewProduct;
  setDraft: React.Dispatch<React.SetStateAction<NewProduct>>;
  referenceLinkInput: string;
  setReferenceLinkInput: (value: string) => void;
  referenceError: string;
  setReferenceError: (value: string) => void;
  addReferenceLink: () => void;
  addReferenceFiles: (files: FileList | null) => void;
  removeDraftReference: (id: string) => void;
  addNewProduct: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
        </button>
        <p className="text-xs font-medium text-muted-foreground">
          Describe a custom product
        </p>
      </div>
      <div className="space-y-4 rounded-xl border border-border bg-card p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Category"
            value={draft.category}
            options={CATEGORIES}
            optional
            placeholder="Select category"
            onChange={(category) => setDraft((prev) => ({ ...prev, category }))}
          />
          <SelectField
            label="Metal type"
            value={draft.metalType}
            options={METAL_TYPES}
            required
            placeholder="Select metal"
            onChange={(metalType) =>
              setDraft((prev) => ({ ...prev, metalType }))
            }
          />
          <SelectField
            label="Metal purity"
            value={draft.metalPurity}
            options={METAL_PURITIES}
            optional
            placeholder="Select purity"
            onChange={(metalPurity) =>
              setDraft((prev) => ({ ...prev, metalPurity }))
            }
          />
          <SelectField
            label="Polish / finish"
            value={draft.polish}
            options={POLISH_OPTIONS}
            optional
            placeholder="Select polish"
            onChange={(polish) => setDraft((prev) => ({ ...prev, polish }))}
          />
        </div>

        <FormField
          label="Stone description"
          htmlFor="stoneDescription"
          optional
        >
          <Input
            id="stoneDescription"
            placeholder="e.g. Natural Diamonds, Blue Sapphire"
            value={draft.stoneDescription}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                stoneDescription: e.target.value,
              }))
            }
            className="h-9 w-full"
          />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-3">
          <SelectField
            label="Stone cut"
            value={draft.stoneCut}
            options={STONE_CUTS}
            optional
            placeholder="Select cut"
            onChange={(stoneCut) => setDraft((prev) => ({ ...prev, stoneCut }))}
          />
          <SelectField
            label="Stone quality"
            value={draft.stoneQuality}
            options={STONE_QUALITIES}
            optional
            placeholder="Select quality"
            onChange={(stoneQuality) =>
              setDraft((prev) => ({ ...prev, stoneQuality }))
            }
          />
          <FormField label="Carat estimate" optional>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.50"
              value={draft.stoneCaratEstimate}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  stoneCaratEstimate: e.target.value,
                }))
              }
              className="h-9 w-full"
            />
          </FormField>
        </div>

        <FormField label="References" optional>
          <div className="space-y-3 rounded-lg border border-dashed border-border/70 bg-muted/20 p-3">
            <div className="flex flex-wrap gap-2">
              <Input
                placeholder="Paste a link"
                value={referenceLinkInput}
                onChange={(e) => {
                  setReferenceLinkInput(e.target.value);
                  if (referenceError) setReferenceError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addReferenceLink();
                  }
                }}
                className="h-9 min-w-[180px] flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addReferenceLink}
              >
                Add
              </Button>
              <label className="flex cursor-pointer items-center gap-1.5 rounded-md border bg-background px-2.5 py-1.5 text-xs font-medium transition-colors hover:border-primary/40">
                <span className="text-muted-foreground">Upload</span>
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    addReferenceFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>

            {draft.references.length > 0 && (
              <div className="grid gap-2 sm:grid-cols-2">
                {draft.references.map((ref) => (
                  <div
                    key={ref.id}
                    className="flex min-w-0 items-center gap-2 rounded-lg border bg-background px-3 py-2"
                  >
                    {ref.type === "image" ? (
                      // biome-ignore lint/performance/noImgElement: local object URLs cannot be optimized
                      <img
                        src={ref.url}
                        alt={ref.name}
                        className="h-8 w-8 shrink-0 rounded object-cover"
                      />
                    ) : ref.type === "video" ? (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-muted">
                        <span className="text-xs">Video</span>
                      </div>
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-center gap-1.5 text-xs font-medium">
                        {getReferenceIcon(ref.type)}
                        <span className="truncate">
                          {ref.type === "link" ? ref.url : ref.name}
                        </span>
                      </div>
                      {ref.size && (
                        <p className="text-[10px] text-muted-foreground">
                          {formatFileSize(ref.size)}
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => removeDraftReference(ref.id)}
                      className="shrink-0 text-muted-foreground/60 hover:text-destructive"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {referenceError && (
              <p className="text-[11px] text-destructive">{referenceError}</p>
            )}
          </div>
        </FormField>

        <FormField label="Notes" optional>
          <Textarea
            placeholder="Design preferences, special requests..."
            value={draft.notes}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, notes: e.target.value }))
            }
            className="min-h-[72px] w-full resize-none"
          />
        </FormField>
      </div>

      <div className="flex gap-2 pt-1">
        <Button
          type="button"
          size="sm"
          onClick={addNewProduct}
          disabled={!draft.metalType}
          className="gap-2 px-5"
        >
          <Plus className="h-3.5 w-3.5" />
          Add product
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  placeholder,
  onChange,
  optional,
  required,
}: {
  label: string;
  value: string;
  options: readonly string[];
  placeholder: string;
  onChange: (value: string) => void;
  optional?: boolean;
  required?: boolean;
}) {
  return (
    <FormField label={label} optional={optional} required={required}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9 w-full text-sm">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormField>
  );
}
