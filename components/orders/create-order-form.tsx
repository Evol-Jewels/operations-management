"use client";

import { CheckCircle2, ChevronDown, ChevronUp, Pencil } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  NameStep,
  PhoneStep,
} from "@/components/enquiries/customer-enquiry-steps";
import {
  type CustomerDetails,
  createEmptyNewProduct,
  EMPTY_CUSTOMER,
  type EnquiryFormData,
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
import {
  CREATE_ORDER_DRAFT_KEY,
  readDraft,
  removeDraft,
  sanitizeEnquiryFormData,
  sanitizeNewProduct,
  writeDraft,
} from "@/components/enquiries/form-draft-storage";
import { ProductInterestStep } from "@/components/enquiries/product-interest-step";
import { StepNumber } from "@/components/enquiries/typeform-controls";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { validatePhone } from "@/components/ui/phone-input";
import { Textarea } from "@/components/ui/textarea";
import { useCreateOrders } from "@/hooks/useOrders";
import { authClient } from "@/lib/auth-client";
import { normalizeDecodedId } from "@/lib/barcodeScanner";
import { fetchInventoryProducts } from "@/lib/inventoryApi";
import { mapInventoryProductToEnquiryProduct } from "@/lib/inventoryProductMapping";
import { cn } from "@/lib/utils";
import type { CreateOrdersInput } from "@/types/order-api";
import { addDaysDateString, customProductDetails } from "./order-form-utils";

type OrderStepId =
  | "phone"
  | "name"
  | "products"
  | "vendor-estimation"
  | "notes-address";

interface OrderProductMeta {
  vendorName: string;
  cadApprovalRequired: boolean;
  estimatedDeliveryDate: string;
}

interface CreateOrderFormData extends EnquiryFormData {
  productMeta: Record<string, OrderProductMeta>;
}

const ORDER_STEPS: OrderStepId[] = [
  "phone",
  "name",
  "products",
  "vendor-estimation",
  "notes-address",
];

function createDefaultMeta(createdAt: Date): OrderProductMeta {
  return {
    vendorName: "",
    cadApprovalRequired: false,
    estimatedDeliveryDate: addDaysDateString(createdAt, 17),
  };
}

export function CreateOrderForm() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session } = authClient.useSession();
  const createOrdersMutation = useCreateOrders();
  const createdAtRef = useRef(new Date());
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [currentStep, setCurrentStep] = useState(0);
  const [animDir, setAnimDir] = useState<"forward" | "backward">("forward");
  const [form, setForm] = useState<CreateOrderFormData>({
    customer: { ...EMPTY_CUSTOMER },
    selectedProducts: [],
    newProducts: [],
    productMeta: {},
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isPhoneValid, setIsPhoneValid] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [productLookupLoading, setProductLookupLoading] = useState(false);
  const [productLookupError, setProductLookupError] = useState("");
  const [notFoundCode, setNotFoundCode] = useState("");
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [productAddMode, setProductAddMode] =
    useState<ProductAddMode>("choose");
  const [newProductDraft, setNewProductDraft] = useState<NewProduct>(
    createEmptyNewProduct,
  );
  const [editingNewProductId, setEditingNewProductId] = useState<string | null>(
    null,
  );
  const [referenceLinkInput, setReferenceLinkInput] = useState("");
  const [referenceError, setReferenceError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftHydrated, setDraftHydrated] = useState(false);

  const safeStep = Math.min(currentStep, ORDER_STEPS.length - 1);
  const stepId = ORDER_STEPS[safeStep];
  const progress = ((safeStep + 1) / ORDER_STEPS.length) * 100;
  const isFirstStep = safeStep === 0;
  const isLastStep = safeStep === ORDER_STEPS.length - 1;
  const showStepNextButton =
    stepId === "products" || stepId === "vendor-estimation";
  const hasProducts =
    form.selectedProducts.length > 0 || form.newProducts.length > 0;
  const canSubmitCustomProduct = (draft: NewProduct) =>
    Boolean(draft.category && draft.metalType && draft.metalNetWeight);

  useEffect(() => {
    if (draftHydrated) return;

    const draft = readDraft<{
      currentStep?: number;
      form?: CreateOrderFormData;
      productAddMode?: ProductAddMode;
      newProductDraft?: NewProduct;
      referenceLinkInput?: string;
      editingNewProductId?: string | null;
    }>(CREATE_ORDER_DRAFT_KEY);

    if (draft?.form) {
      setForm({
        ...draft.form,
        ...sanitizeEnquiryFormData(draft.form),
        productMeta: draft.form.productMeta ?? {},
      });
    }
    if (draft?.productAddMode) setProductAddMode(draft.productAddMode);
    if (draft?.newProductDraft) {
      setNewProductDraft(sanitizeNewProduct(draft.newProductDraft));
    }
    if (typeof draft?.referenceLinkInput === "string") {
      setReferenceLinkInput(draft.referenceLinkInput);
    }
    if (typeof draft?.editingNewProductId !== "undefined") {
      setEditingNewProductId(draft.editingNewProductId);
    }

    const queryStep = searchParams.get("step");
    const queryStepIndex = queryStep
      ? ORDER_STEPS.indexOf(queryStep as OrderStepId)
      : -1;
    const storedStep =
      typeof draft?.currentStep === "number" ? draft.currentStep : 0;
    setCurrentStep(
      queryStepIndex >= 0
        ? queryStepIndex
        : Math.min(Math.max(storedStep, 0), ORDER_STEPS.length - 1),
    );

    setDraftHydrated(true);
  }, [draftHydrated, searchParams]);

  useEffect(() => {
    if (!draftHydrated || submitted) return;

    writeDraft(CREATE_ORDER_DRAFT_KEY, {
      currentStep: safeStep,
      form: {
        ...sanitizeEnquiryFormData(form),
        productMeta: form.productMeta,
      },
      productAddMode,
      newProductDraft: sanitizeNewProduct(newProductDraft),
      referenceLinkInput,
      editingNewProductId,
    });
  }, [
    safeStep,
    form,
    productAddMode,
    newProductDraft,
    referenceLinkInput,
    editingNewProductId,
    submitted,
    draftHydrated,
  ]);

  useEffect(() => {
    if (!draftHydrated) return;

    const nextParams = new URLSearchParams(searchParams.toString());
    if (nextParams.get("step") === stepId) return;
    nextParams.set("step", stepId);
    const query = nextParams.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }, [draftHydrated, pathname, router, searchParams, stepId]);

  useEffect(() => {
    return () => {
      revokeObjectUrls(newProductDraft.references);
      for (const product of form.newProducts)
        revokeObjectUrls(product.references);
    };
  }, [newProductDraft.references, form.newProducts]);

  function updateCustomer(patch: Partial<CustomerDetails>) {
    setForm((prev) => ({
      ...prev,
      customer: { ...prev.customer, ...patch },
    }));
  }

  function updateProductMeta(
    productId: string,
    patch: Partial<OrderProductMeta>,
  ) {
    setForm((prev) => ({
      ...prev,
      productMeta: {
        ...prev.productMeta,
        [productId]: {
          ...(prev.productMeta[productId] ??
            createDefaultMeta(createdAtRef.current)),
          ...patch,
        },
      },
    }));
  }

  function updateCadApproval(productId: string, cadApprovalRequired: boolean) {
    updateProductMeta(productId, {
      cadApprovalRequired,
      estimatedDeliveryDate: addDaysDateString(
        createdAtRef.current,
        cadApprovalRequired ? 20 : 17,
      ),
    });
  }

  function validateCurrentStep(
    targetStep: OrderStepId = stepId,
  ): Record<string, string> {
    const nextErrors: Record<string, string> = {};

    if (targetStep === "phone") {
      const phoneError = validatePhone(form.customer.phone);
      if (phoneError || !isPhoneValid) {
        nextErrors.phone = phoneError || "Enter a valid phone number";
      }
    }

    if (targetStep === "name" && !form.customer.name.trim()) {
      nextErrors.name = "Name is required";
    }

    if (targetStep === "products" && !hasProducts) {
      nextErrors.products = "Add at least one product";
    }

    if (
      targetStep === "products" &&
      form.selectedProducts.some((product) => !product.productCode.trim())
    ) {
      nextErrors.products = "Every inventory product needs a product code";
    }

    if (
      targetStep === "products" &&
      form.newProducts.some(
        (product) =>
          !product.category.trim() ||
          !product.metalType.trim() ||
          !product.metalNetWeight.trim(),
      )
    ) {
      nextErrors.products =
        "Custom products need category, metal type, and net weight";
    }

    if (targetStep === "vendor-estimation") {
      const allProducts = [...form.selectedProducts, ...form.newProducts];
      if (
        allProducts.some(
          (product) => !form.productMeta[product.id]?.estimatedDeliveryDate,
        )
      ) {
        nextErrors.estimatedDelivery =
          "Estimated delivery date is required for every product";
      }
    }

    if (targetStep === "notes-address" && !form.customer.address.trim()) {
      nextErrors.address = "Address is required";
    }

    return nextErrors;
  }

  function advanceStep() {
    setErrors({});
    setAnimDir("forward");
    setCurrentStep((prev) => prev + 1);
  }

  function handlePhoneLookup() {
    const phoneError = validatePhone(form.customer.phone);
    if (phoneError || !isPhoneValid) {
      setErrors({ phone: phoneError || "Enter a valid phone number" });
      return;
    }

    setForm((prev) => ({
      ...prev,
      customer: {
        ...prev.customer,
        isExisting: false,
        category: prev.customer.category || "Middle",
      },
    }));
    advanceStep();
  }

  function goNext() {
    if (stepId === "phone") {
      handlePhoneLookup();
      return;
    }

    const nextErrors = validateCurrentStep();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    if (!isLastStep) advanceStep();
  }

  function goBack() {
    if (isFirstStep) return;
    setErrors({});
    setAnimDir("backward");
    setCurrentStep((prev) => prev - 1);
  }

  function addProduct(product: Product) {
    if (form.selectedProducts.find((item) => item.id === product.id)) return;
    setForm((prev) => ({
      ...prev,
      selectedProducts: [...prev.selectedProducts, product],
      productMeta: {
        ...prev.productMeta,
        [product.id]: createDefaultMeta(createdAtRef.current),
      },
    }));
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

  function removeSelectedProduct(productId: string) {
    setForm((prev) => {
      const { [productId]: _removed, ...productMeta } = prev.productMeta;
      return {
        ...prev,
        selectedProducts: prev.selectedProducts.filter(
          (product) => product.id !== productId,
        ),
        productMeta,
      };
    });
  }

  function addNewProduct() {
    if (
      !newProductDraft.category ||
      !newProductDraft.metalType ||
      !newProductDraft.metalNetWeight
    ) {
      return;
    }
    const product = {
      ...newProductDraft,
      id: editingNewProductId ?? generateId(),
    };
    setForm((prev) => ({
      ...prev,
      newProducts: [...prev.newProducts, product],
      productMeta: {
        ...prev.productMeta,
        [product.id]:
          prev.productMeta[product.id] ??
          createDefaultMeta(createdAtRef.current),
      },
    }));
    setNewProductDraft(createEmptyNewProduct());
    setEditingNewProductId(null);
    setReferenceLinkInput("");
    setReferenceError("");
  }

  function cancelNewProduct() {
    if (editingNewProductId) {
      setForm((prev) => ({
        ...prev,
        newProducts: [
          ...prev.newProducts,
          { ...newProductDraft, id: editingNewProductId },
        ],
      }));
    } else {
      revokeObjectUrls(newProductDraft.references);
    }
    setNewProductDraft(createEmptyNewProduct());
    setEditingNewProductId(null);
    setReferenceLinkInput("");
    setReferenceError("");
  }

  function editNewProduct(id: string) {
    const product = form.newProducts.find((item) => item.id === id);
    if (!product) return;

    setForm((prev) => ({
      ...prev,
      newProducts: prev.newProducts.filter((item) => item.id !== id),
    }));
    setNewProductDraft(product);
    setEditingNewProductId(id);
    setReferenceLinkInput("");
    setReferenceError("");
    setProductAddMode("custom");
  }

  function removeNewProduct(id: string) {
    setForm((prev) => {
      const productToRemove = prev.newProducts.find(
        (product) => product.id === id,
      );
      if (productToRemove) revokeObjectUrls(productToRemove.references);
      const { [id]: _removed, ...productMeta } = prev.productMeta;
      return {
        ...prev,
        newProducts: prev.newProducts.filter((product) => product.id !== id),
        productMeta,
      };
    });
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
        { id: generateId(), type: "link", url: normalized, name: normalized },
      ],
    }));
    setReferenceLinkInput("");
    setReferenceError("");
  }

  function addReferenceFiles(files: FileList | null) {
    if (!files?.length) return;

    const nextReferences: ProductReference[] = [];
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

      nextReferences.push({
        id: generateId(),
        type,
        url: URL.createObjectURL(file),
        name: file.name,
        mimeType: file.type,
        size: file.size,
        file,
      });
    }

    if (!nextReferences.length) return;
    setNewProductDraft((prev) => ({
      ...prev,
      references: [...prev.references, ...nextReferences],
    }));
    setReferenceError("");
  }

  function removeDraftReference(referenceId: string) {
    setNewProductDraft((prev) => {
      const reference = prev.references.find((item) => item.id === referenceId);
      if (reference && reference.type !== "link")
        URL.revokeObjectURL(reference.url);
      return {
        ...prev,
        references: prev.references.filter((item) => item.id !== referenceId),
      };
    });
  }

  function buildPayload(): CreateOrdersInput {
    const selectedProducts: CreateOrdersInput["orders"] =
      form.selectedProducts.map((product) => {
        const meta = form.productMeta[product.id];
        return {
          productType: "EXISTING",
          productCode: product.productCode,
          notes: product.description || form.customer.notes.trim() || undefined,
          vendor: meta.vendorName.trim() || undefined,
          isCadRequired: meta.cadApprovalRequired,
          estimatedDeliveryDate: meta.estimatedDeliveryDate,
        };
      });

    const customProducts: CreateOrdersInput["orders"] = form.newProducts.map(
      (product) => {
        const meta = form.productMeta[product.id];
        return {
          productType: "CUSTOM",
          customProduct: customProductDetails(product),
          notes: [
            product.polish ? `Polish: ${product.polish}` : null,
            product.stoneCut ? `Stone cut: ${product.stoneCut}` : null,
            product.stoneQuality
              ? `Stone quality: ${product.stoneQuality}`
              : null,
            product.notes || null,
          ]
            .filter(Boolean)
            .join("\n"),
          vendor: meta.vendorName.trim() || undefined,
          isCadRequired: meta.cadApprovalRequired,
          estimatedDeliveryDate: meta.estimatedDeliveryDate,
        };
      },
    );

    const createdBy = session?.user?.id;
    if (!createdBy) throw new Error("Unable to determine creator.");

    return {
      name: form.customer.name.trim(),
      phoneNumber: form.customer.phone.trim(),
      customerAddress: form.customer.address.trim() || undefined,
      salesPerson: createdBy,
      orders: [...selectedProducts, ...customProducts],
    };
  }

  async function handleSubmit() {
    const finalChecks: OrderStepId[] = [
      "phone",
      "name",
      "products",
      "vendor-estimation",
      "notes-address",
    ];
    const nextErrors: Record<string, string> = {};
    for (const item of finalChecks) {
      Object.assign(nextErrors, validateCurrentStep(item));
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const response = await createOrdersMutation.mutateAsync(buildPayload());
      removeDraft(CREATE_ORDER_DRAFT_KEY);
      setSubmitted(true);
      setTimeout(() => {
        const refCode = response.refCodes?.length === 1 && response.refCodes[0];
        router.push(
          refCode ? `/orders/${refCode}` : "/orders-and-enquiries?type=order",
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
            {form.customer.name}&apos;s order has been created.
          </p>
        </div>
      </div>
    );
  }

  const sharedStepProps = {
    customer: form.customer,
    errors,
    stepNumber: safeStep + 1,
    totalSteps: ORDER_STEPS.length,
    updateCustomer,
    goNext,
    setIsPhoneValid,
    phoneSubtitle: "Record customer phone number for order updates",
    nameSubtitle: "Full name as they'd like to be addressed",
  };

  return (
    <div
      className={cn(
        "mx-auto pb-28",
        stepId === "products" || stepId === "vendor-estimation"
          ? "max-w-3xl"
          : "max-w-2xl",
      )}
    >
      <div className="mb-2">
        <div className="h-[2px] w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div
        key={`step-${safeStep}-${stepId}`}
        className={cn(
          "flex min-h-[68vh] flex-col justify-center px-1",
          stepId === "products" || stepId === "vendor-estimation"
            ? "items-stretch"
            : "items-center",
          "animate-in fade-in-0 duration-300",
          animDir === "forward"
            ? "slide-in-from-bottom-3"
            : "slide-in-from-top-3",
        )}
      >
        {stepId === "phone" && <PhoneStep {...sharedStepProps} />}
        {stepId === "name" && <NameStep {...sharedStepProps} />}
        {stepId === "products" && (
          <ProductInterestStep
            stepNumber={safeStep + 1}
            totalSteps={ORDER_STEPS.length}
            subtitle="Add existing products or custom product for the order"
            selectedProducts={form.selectedProducts}
            newProducts={form.newProducts}
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
            addProduct={addProduct}
            searchInventoryProducts={searchInventoryProducts}
            removeSelectedProduct={removeSelectedProduct}
            addNewProduct={addNewProduct}
            cancelNewProduct={cancelNewProduct}
            editNewProduct={editNewProduct}
            removeNewProduct={removeNewProduct}
            addReferenceLink={addReferenceLink}
            addReferenceFiles={addReferenceFiles}
            removeDraftReference={removeDraftReference}
            customProductSubmitLabel={
              editingNewProductId ? "Update product" : "Add product"
            }
            canSubmitCustomProduct={canSubmitCustomProduct}
          />
        )}
        {stepId === "vendor-estimation" && (
          <VendorEstimationStep
            stepNumber={safeStep + 1}
            totalSteps={ORDER_STEPS.length}
            selectedProducts={form.selectedProducts}
            newProducts={form.newProducts}
            productMeta={form.productMeta}
            errors={errors}
            updateProductMeta={updateProductMeta}
            updateCadApproval={updateCadApproval}
          />
        )}
        {stepId === "notes-address" && (
          <OrderNotesAddressStep
            customer={form.customer}
            errors={errors}
            stepNumber={safeStep + 1}
            totalSteps={ORDER_STEPS.length}
            updateCustomer={updateCustomer}
          />
        )}
      </div>

      <div className="pointer-events-none fixed right-0 bottom-6 left-0 z-40 md:left-[var(--sidebar-width)] group-data-[collapsible=icon]/sidebar-wrapper:md:left-[var(--sidebar-width-icon)]">
        <div
          className={cn(
            "mx-auto flex items-center gap-2 px-4",
            stepId === "products" || stepId === "vendor-estimation"
              ? "max-w-3xl"
              : "max-w-2xl",
          )}
        >
          <div className="pointer-events-auto flex items-center gap-1 rounded-lg border border-border bg-card shadow-md">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={goBack}
              disabled={isFirstStep || isSubmitting}
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
          {showStepNextButton && (
            <Button
              type="button"
              size="sm"
              onClick={goNext}
              disabled={isSubmitting}
              className="pointer-events-auto ml-auto gap-2 px-5 shadow-md"
            >
              Next
              <ChevronDown className="h-4 w-4" />
            </Button>
          )}
          {isLastStep && (
            <Button
              type="button"
              size="sm"
              onClick={handleSubmit}
              disabled={isSubmitting || !hasProducts}
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

function VendorEstimationStep({
  stepNumber,
  totalSteps,
  selectedProducts,
  newProducts,
  productMeta,
  errors,
  updateProductMeta,
  updateCadApproval,
}: {
  stepNumber: number;
  totalSteps: number;
  selectedProducts: Product[];
  newProducts: NewProduct[];
  productMeta: Record<string, OrderProductMeta>;
  errors: Record<string, string>;
  updateProductMeta: (
    productId: string,
    patch: Partial<OrderProductMeta>,
  ) => void;
  updateCadApproval: (productId: string, cadApprovalRequired: boolean) => void;
}) {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 pt-8">
      <div className="text-center">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          <StepNumber n={stepNumber} total={totalSteps} />
          Vendor and estimation
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Set production details for each product
        </p>
      </div>

      <div className="space-y-3">
        {selectedProducts.map((product) => (
          <ProductMetaCard
            key={product.id}
            id={product.id}
            title={product.name}
            subtitle={[
              product.productCode,
              formatMetalTypeLabel(product.metalType),
              product.metalPurity,
            ]
              .filter(Boolean)
              .join(" · ")}
            thumbnail={<ProductThumbnail product={product} size="sm" />}
            meta={productMeta[product.id]}
            updateProductMeta={updateProductMeta}
            updateCadApproval={updateCadApproval}
          />
        ))}
        {newProducts.map((product) => (
          <ProductMetaCard
            key={product.id}
            id={product.id}
            title={
              [
                product.category || "Custom",
                formatMetalTypeLabel(product.metalType),
                product.metalPurity,
              ]
                .filter(Boolean)
                .join(" · ") || "Custom product"
            }
            subtitle={
              [product.polish, product.stoneDescription, product.stoneCut]
                .filter(Boolean)
                .join(" · ") || "Custom design"
            }
            thumbnail={
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            }
            meta={productMeta[product.id]}
            updateProductMeta={updateProductMeta}
            updateCadApproval={updateCadApproval}
          />
        ))}
      </div>

      {errors.estimatedDelivery && (
        <p className="text-sm text-destructive">{errors.estimatedDelivery}</p>
      )}
    </div>
  );
}

function ProductMetaCard({
  id,
  title,
  subtitle,
  thumbnail,
  meta,
  updateProductMeta,
  updateCadApproval,
}: {
  id: string;
  title: string;
  subtitle: string;
  thumbnail: React.ReactNode;
  meta?: OrderProductMeta;
  updateProductMeta: (
    productId: string,
    patch: Partial<OrderProductMeta>,
  ) => void;
  updateCadApproval: (productId: string, cadApprovalRequired: boolean) => void;
}) {
  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          {thumbnail}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {title}
            </p>
            <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 rounded-md border border-border bg-muted/20 px-3 py-2 text-sm transition-colors hover:bg-muted/30">
          <Checkbox
            checked={meta?.cadApprovalRequired ?? false}
            onCheckedChange={(checked) =>
              updateCadApproval(id, checked === true)
            }
            aria-label="CAD required before order"
          />
          <span className="font-medium text-foreground">
            CAD required before order
          </span>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
        <FormField label="Vendor" optional>
          <Input
            placeholder="e.g. ABC Jewellers"
            value={meta?.vendorName ?? ""}
            onChange={(event) =>
              updateProductMeta(id, { vendorName: event.target.value })
            }
            className="h-10 w-full"
          />
        </FormField>
        <FormField label="Estimated delivery date" required>
          <Input
            type="date"
            value={meta?.estimatedDeliveryDate ?? ""}
            onChange={(event) =>
              updateProductMeta(id, {
                estimatedDeliveryDate: event.target.value,
              })
            }
            className="h-10 w-full"
          />
        </FormField>
      </div>
    </div>
  );
}

function OrderNotesAddressStep({
  customer,
  errors,
  stepNumber,
  totalSteps,
  updateCustomer,
}: {
  customer: CustomerDetails;
  errors: Record<string, string>;
  stepNumber: number;
  totalSteps: number;
  updateCustomer: (patch: Partial<CustomerDetails>) => void;
}) {
  return (
    <div className="w-full max-w-md space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          <StepNumber n={stepNumber} total={totalSteps} />
          Notes and address
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Add delivery details before creating the order
        </p>
      </div>
      <div className="max-w-sm space-y-4">
        <FormField label="Notes" optional>
          <Textarea
            id="notes"
            placeholder="Customer preferences or order notes..."
            value={customer.notes}
            onChange={(event) => updateCustomer({ notes: event.target.value })}
            rows={3}
            className="resize-none text-sm"
          />
        </FormField>
        <FormField label="Address" required>
          <Textarea
            id="address"
            placeholder="Enter full delivery address..."
            value={customer.address}
            onChange={(event) =>
              updateCustomer({ address: event.target.value })
            }
            rows={2}
            className="resize-none text-sm"
            autoFocus
          />
          {errors.address && (
            <p className="text-[11px] text-destructive">{errors.address}</p>
          )}
        </FormField>
      </div>
    </div>
  );
}
