"use client";

import { CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { RequireInternalAuth } from "@/components/auth/RequireInternalAuth";
import {
  CategoryStep,
  CityStep,
  EmailStep,
  EnquiryTypeStep,
  NameStep,
  NotesStep,
  PhoneStep,
  VisitDetailsStep,
} from "@/components/enquiries/customer-enquiry-steps";
import {
  type CustomerDetails,
  createEmptyNewProduct,
  EMPTY_CUSTOMER,
  type EnquiryFormData,
  type EnquiryMode,
  type NewProduct,
  type ProductAddMode,
  type ProductReference,
  type StepId,
} from "@/components/enquiries/enquiry-form-types";
import {
  formatVisitDateTime,
  generateEnquiryId,
  generateId,
  getEnquiryModeLabel,
  getSteps,
  getTodayDateString,
  isValidReferenceLink,
  normalizeReferenceLink,
  revokeObjectUrls,
  slugify,
} from "@/components/enquiries/enquiry-form-utils";
import { ProductInterestStep } from "@/components/enquiries/product-interest-step";
import { Button } from "@/components/ui/button";
import { validatePhone } from "@/components/ui/phone-input";
import { authClient } from "@/lib/auth-client";
import { getCustomerByPhone } from "@/lib/mock-customers";
import { type Product, searchProducts } from "@/lib/mock-products";
import { saveEnquiryMedia } from "@/lib/storage/enquiry-media";
import { useOrdersStore } from "@/lib/stores/orders-store";
import { cn } from "@/lib/utils";
import type {
  CustomerCategory,
  EnquiryReference,
  JewelleryCategory,
  MetalPurity,
  MetalType,
  Order,
} from "@/types";

export default function NewEnquiryPage() {
  return (
    <RequireInternalAuth>
      <Suspense
        fallback={
          <div className="flex min-h-[40vh] items-center justify-center">
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        }
      >
        <EnquiryForm />
      </Suspense>
    </RequireInternalAuth>
  );
}

function EnquiryForm() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const addEnquiry = useOrdersStore((state) => state.addEnquiry);

  const [currentStep, setCurrentStep] = useState(0);
  const [animDir, setAnimDir] = useState<"forward" | "backward">("forward");
  const [form, setForm] = useState<EnquiryFormData>({
    customer: { ...EMPTY_CUSTOMER },
    selectedProducts: [],
    newProducts: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isPhoneValid, setIsPhoneValid] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [productAddMode, setProductAddMode] =
    useState<ProductAddMode>("choose");
  const [newProductDraft, setNewProductDraft] = useState<NewProduct>(
    createEmptyNewProduct,
  );
  const [referenceLinkInput, setReferenceLinkInput] = useState("");
  const [referenceError, setReferenceError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const salespersonName = session?.user?.name || "Sales Team";
  const searchInputRef = useRef<HTMLInputElement>(null);
  const maxSelectableDate = getTodayDateString();
  const steps = getSteps(form.customer.enquiryMode);
  const safeStep = Math.min(currentStep, steps.length - 1);
  const stepId = steps[safeStep];
  const progress = ((safeStep + 1) / steps.length) * 100;
  const isFirstStep = safeStep === 0;
  const isLastStep = safeStep === steps.length - 1;

  useEffect(() => {
    setSearchResults(productSearch.trim() ? searchProducts(productSearch) : []);
  }, [productSearch]);

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

  function validateCurrentStep(
    targetStep: StepId = stepId,
  ): Record<string, string> {
    const nextErrors: Record<string, string> = {};

    switch (targetStep) {
      case "phone": {
        const phoneError = validatePhone(form.customer.phone);
        if (phoneError || !isPhoneValid) {
          nextErrors.phone = phoneError || "Enter a valid phone number";
        }
        break;
      }
      case "name":
        if (!form.customer.name.trim()) nextErrors.name = "Name is required";
        break;
      case "enquiry-type":
        if (!form.customer.enquiryMode)
          nextErrors.enquiryMode = "Select an enquiry type";
        break;
      case "visit-details":
        if (!form.customer.visitCity.trim())
          nextErrors.visitCity = "Select a store location";
        if (!form.customer.visitTime)
          nextErrors.visitTime = "Select a date and time";
        break;
      case "products":
        if (
          form.selectedProducts.length === 0 &&
          form.newProducts.length === 0
        ) {
          nextErrors.products = "Add at least one product";
        }
        break;
      default:
        break;
    }

    return nextErrors;
  }

  function advanceStep() {
    setErrors({});
    setAnimDir("forward");
    setCurrentStep((prev) => prev + 1);
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

  function handlePhoneLookup() {
    const phoneError = validatePhone(form.customer.phone);
    if (phoneError || !isPhoneValid) {
      setErrors({ phone: phoneError || "Enter a valid phone number" });
      return;
    }

    const customer = getCustomerByPhone(form.customer.phone);
    setForm((prev) => ({
      ...prev,
      customer: customer
        ? {
            ...prev.customer,
            isExisting: true,
            name: customer.name,
            city: customer.location || "",
            address: "",
            email: customer.email || "",
            category: customer.category,
            notes: customer.notes || "",
          }
        : {
            ...prev.customer,
            isExisting: false,
            name: "",
            city: "",
            address: "",
            email: "",
            category: "Middle",
            notes: "",
            enquiryMode: "",
            visitCity: "",
            visitTime: "",
          },
    }));
    advanceStep();
  }

  const selectEnquiryMode = useCallback((mode: EnquiryMode) => {
    setForm((prev) => ({
      ...prev,
      customer: {
        ...prev.customer,
        enquiryMode: mode,
        ...(mode === "online" ? { visitCity: "", visitTime: "" } : {}),
      },
    }));
    setTimeout(() => {
      setErrors({});
      setAnimDir("forward");
      setCurrentStep((prev) => prev + 1);
    }, 150);
  }, []);

  const selectCategory = useCallback((category: CustomerCategory) => {
    setForm((prev) => ({
      ...prev,
      customer: { ...prev.customer, category },
    }));
    setTimeout(() => {
      setErrors({});
      setAnimDir("forward");
      setCurrentStep((prev) => prev + 1);
    }, 150);
  }, []);

  useEffect(() => {
    if (submitted) return;

    function handleKeyShortcut(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const key = event.key.toUpperCase();

      if (stepId === "enquiry-type") {
        if (key === "A") {
          event.preventDefault();
          selectEnquiryMode("store_visit");
        }
        if (key === "B") {
          event.preventDefault();
          selectEnquiryMode("online");
        }
      }

      if (stepId === "category") {
        const categories: CustomerCategory[] = ["VIP", "Middle", "Lower"];
        const index = ["A", "B", "C"].indexOf(key);
        if (index !== -1) {
          event.preventDefault();
          selectCategory(categories[index]);
        }
      }
    }

    window.addEventListener("keydown", handleKeyShortcut);
    return () => window.removeEventListener("keydown", handleKeyShortcut);
  }, [stepId, submitted, selectCategory, selectEnquiryMode]);

  async function persistReference(
    reference: ProductReference,
    enquiryId: string,
    productId: string,
  ): Promise<EnquiryReference> {
    if (reference.type === "link") {
      return {
        id: reference.id,
        type: reference.type,
        name: reference.name,
        url: reference.url,
      };
    }

    if (!reference.file)
      throw new Error(`Missing file data for ${reference.name}`);

    const savedMedia = await saveEnquiryMedia({
      enquiryId,
      productId,
      file: reference.file,
      type: reference.type,
    });

    return {
      id: reference.id,
      type: reference.type,
      name: reference.name,
      mediaId: savedMedia.id,
      mimeType: savedMedia.mimeType,
      size: savedMedia.size,
    };
  }

  async function handleSubmit() {
    const nextErrors = validateCurrentStep("products");
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const enquiryId = generateEnquiryId();
      const createdAt = new Date().toISOString();
      const primarySelectedProduct = form.selectedProducts[0];
      const primaryCustomProduct = form.newProducts[0];
      const customProducts = await Promise.all(
        form.newProducts.map(async (product) => ({
          id: product.id,
          category: product.category || "Other",
          metalType: product.metalType,
          metalPurity: product.metalPurity || "Other",
          polish: product.polish,
          stoneDescription: product.stoneDescription,
          stoneCut: product.stoneCut,
          stoneQuality: product.stoneQuality,
          stoneCaratEstimate: product.stoneCaratEstimate
            ? Number(product.stoneCaratEstimate)
            : undefined,
          references: await Promise.all(
            product.references.map((reference) =>
              persistReference(reference, enquiryId, product.id),
            ),
          ),
        })),
      );

      const summaryBits = [
        form.customer.enquiryMode
          ? `Enquiry type: ${getEnquiryModeLabel(form.customer.enquiryMode)}.`
          : null,
        form.customer.enquiryMode === "store_visit"
          ? `Store visit scheduled for ${form.customer.visitCity.trim()} on ${formatVisitDateTime(
              form.customer.visitTime,
            )}.`
          : null,
        primarySelectedProduct
          ? `Interested in ${primarySelectedProduct.name} (${primarySelectedProduct.productCode}).`
          : null,
        customProducts.length > 0
          ? `${customProducts.length} custom product requirement${
              customProducts.length > 1 ? "s" : ""
            } added.`
          : null,
        form.customer.notes.trim()
          ? `Customer notes: ${form.customer.notes.trim()}`
          : null,
      ].filter(Boolean);

      const customerLocation = [
        form.customer.city.trim(),
        form.customer.address.trim(),
      ]
        .filter(Boolean)
        .join(", ");

      const enquiryRecord: Order = {
        id: enquiryId,
        type: "enquiry",
        shareableToken: `enq-${slugify(form.customer.name)}-${Date.now()}`,
        customerName: form.customer.name.trim(),
        customerPhone: form.customer.phone.trim() || undefined,
        customerEmail: form.customer.email.trim() || undefined,
        customerDob: form.customer.dob || undefined,
        customerLocation: customerLocation || undefined,
        customerCategory: form.customer.category,
        customerNotes: form.customer.notes.trim() || undefined,
        salespersonName,
        category:
          primarySelectedProduct?.category ??
          (primaryCustomProduct?.category as JewelleryCategory | undefined) ??
          "Other",
        metalType:
          primarySelectedProduct?.metalType ??
          (primaryCustomProduct?.metalType as MetalType | undefined) ??
          "Gold",
        metalPurity:
          primarySelectedProduct?.metalPurity ??
          (primaryCustomProduct?.metalPurity as MetalPurity | undefined) ??
          "Other",
        polish: primaryCustomProduct?.polish || undefined,
        stoneDescription:
          primaryCustomProduct?.stoneDescription ||
          primarySelectedProduct?.description ||
          undefined,
        stoneCut: primaryCustomProduct?.stoneCut || undefined,
        stoneQuality: primaryCustomProduct?.stoneQuality || undefined,
        stoneCaratEstimate: primaryCustomProduct?.stoneCaratEstimate
          ? Number(primaryCustomProduct.stoneCaratEstimate)
          : undefined,
        certification: "None",
        cadDesignRequired: false,
        currentStage: "Enquiry",
        createdAt,
        lastUpdatedAt: createdAt,
        activityFeed: [
          {
            id: `act-${Date.now()}-enquiry-created`,
            orderId: enquiryId,
            postedBy: salespersonName,
            actorRole: "sales",
            timestamp: createdAt,
            type: "order_created",
            note: summaryBits.join(" "),
          },
        ],
        selectedProducts: form.selectedProducts.map((product) => ({
          ...product,
        })),
        customProducts,
      };

      addEnquiry(enquiryRecord);
      setSubmitted(true);
      setTimeout(() => router.push("/"), 2200);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Unable to save the enquiry. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function addProduct(product: Product) {
    if (!form.selectedProducts.find((item) => item.id === product.id)) {
      setForm((prev) => ({
        ...prev,
        selectedProducts: [...prev.selectedProducts, product],
      }));
    }
    setProductSearch("");
    setSearchResults([]);
  }

  function removeSelectedProduct(productId: string) {
    setForm((prev) => ({
      ...prev,
      selectedProducts: prev.selectedProducts.filter(
        (product) => product.id !== productId,
      ),
    }));
  }

  function addNewProduct() {
    if (!newProductDraft.metalType) return;
    setForm((prev) => ({
      ...prev,
      newProducts: [
        ...prev.newProducts,
        { ...newProductDraft, id: generateId() },
      ],
    }));
    setNewProductDraft(createEmptyNewProduct());
    setReferenceLinkInput("");
    setReferenceError("");
  }

  function cancelNewProduct() {
    revokeObjectUrls(newProductDraft.references);
    setNewProductDraft(createEmptyNewProduct());
    setReferenceLinkInput("");
    setReferenceError("");
  }

  function removeNewProduct(id: string) {
    setForm((prev) => {
      const productToRemove = prev.newProducts.find(
        (product) => product.id === id,
      );
      if (productToRemove) revokeObjectUrls(productToRemove.references);
      return {
        ...prev,
        newProducts: prev.newProducts.filter((product) => product.id !== id),
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

  if (submitted) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center justify-center gap-4 py-28 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30">
          <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-foreground">
            Enquiry captured
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {form.customer.name}&apos;s enquiry has been added to the tracker.
            Redirecting you back...
          </p>
        </div>
      </div>
    );
  }

  const sharedStepProps = {
    customer: form.customer,
    errors,
    stepNumber: safeStep + 1,
    updateCustomer,
    goNext,
    selectEnquiryMode,
    selectCategory,
    setIsPhoneValid,
    maxSelectableDate,
  };

  return (
    <div
      className={cn(
        "mx-auto pb-24",
        stepId === "products" ? "max-w-3xl" : "max-w-2xl",
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
          stepId === "products" ? "items-stretch" : "items-start",
          "animate-in fade-in-0 duration-300",
          animDir === "forward"
            ? "slide-in-from-bottom-3"
            : "slide-in-from-top-3",
        )}
      >
        {stepId === "phone" && <PhoneStep {...sharedStepProps} />}
        {stepId === "name" && <NameStep {...sharedStepProps} />}
        {stepId === "enquiry-type" && <EnquiryTypeStep {...sharedStepProps} />}
        {stepId === "visit-details" && (
          <VisitDetailsStep {...sharedStepProps} />
        )}
        {stepId === "category" && <CategoryStep {...sharedStepProps} />}
        {stepId === "email" && <EmailStep {...sharedStepProps} />}
        {stepId === "city" && <CityStep {...sharedStepProps} />}
        {stepId === "notes" && <NotesStep {...sharedStepProps} />}
        {stepId === "products" && (
          <ProductInterestStep
            stepNumber={safeStep + 1}
            selectedProducts={form.selectedProducts}
            newProducts={form.newProducts}
            productAddMode={productAddMode}
            setProductAddMode={setProductAddMode}
            productSearch={productSearch}
            setProductSearch={setProductSearch}
            searchResults={searchResults}
            searchInputRef={searchInputRef}
            newProductDraft={newProductDraft}
            setNewProductDraft={setNewProductDraft}
            referenceLinkInput={referenceLinkInput}
            setReferenceLinkInput={setReferenceLinkInput}
            referenceError={referenceError}
            setReferenceError={setReferenceError}
            errors={errors}
            submitError={submitError}
            addProduct={addProduct}
            removeSelectedProduct={removeSelectedProduct}
            addNewProduct={addNewProduct}
            cancelNewProduct={cancelNewProduct}
            removeNewProduct={removeNewProduct}
            addReferenceLink={addReferenceLink}
            addReferenceFiles={addReferenceFiles}
            removeDraftReference={removeDraftReference}
          />
        )}
      </div>

      <div className="fixed bottom-0 right-0 z-40 flex items-center gap-1 p-4 sm:p-6">
        <div className="flex items-center gap-1 rounded-lg border border-border bg-card shadow-md">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={goBack}
            disabled={isFirstStep}
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
            disabled={isLastStep}
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
            disabled={isSubmitting}
            className="ml-2 gap-2 px-5 shadow-md"
          >
            {isSubmitting ? "Saving..." : "Save Enquiry"}
          </Button>
        )}
      </div>
    </div>
  );
}
