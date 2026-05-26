"use client";

import { CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { RequireInternalAuth } from "@/components/auth/RequireInternalAuth";
import { mapCatalogueDetailsToEnquiryProduct } from "@/components/enquiries/catalogue-product-mapping";
import {
  NameStep,
  NotesStep,
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
  type StepId,
} from "@/components/enquiries/enquiry-form-types";
import {
  generateId,
  getSteps,
  isValidReferenceLink,
  normalizeReferenceLink,
  revokeObjectUrls,
} from "@/components/enquiries/enquiry-form-utils";
import { ProductInterestStep } from "@/components/enquiries/product-interest-step";
import { Button } from "@/components/ui/button";
import { validatePhone } from "@/components/ui/phone-input";
import { useCreateEnquiry } from "@/hooks/useEnquiries";
import { authClient } from "@/lib/auth-client";
import { normalizeDecodedId } from "@/lib/barcodeScanner";
import {
  fetchCatalogueProductDetails,
  searchCatalogueProductByCode,
} from "@/lib/catalogApi";
import { cn } from "@/lib/utils";
import type {
  BackendEnquiryMedia,
  CreateEnquiryItemInput,
} from "@/types/enquiry-api";

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
  const createEnquiryMutation = useCreateEnquiry();

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
  const [productLookupLoading, setProductLookupLoading] = useState(false);
  const [productLookupError, setProductLookupError] = useState("");
  const [notFoundCode, setNotFoundCode] = useState("");
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [productAddMode, setProductAddMode] =
    useState<ProductAddMode>("choose");
  const [newProductDraft, setNewProductDraft] = useState<NewProduct>(
    createEmptyNewProduct,
  );
  const [referenceLinkInput, setReferenceLinkInput] = useState("");
  const [referenceError, setReferenceError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const steps = getSteps();
  const safeStep = Math.min(currentStep, steps.length - 1);
  const stepId = steps[safeStep];
  const progress = ((safeStep + 1) / steps.length) * 100;
  const isFirstStep = safeStep === 0;
  const isLastStep = safeStep === steps.length - 1;
  const hasProducts =
    form.selectedProducts.length > 0 || form.newProducts.length > 0;

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

    setForm((prev) => ({
      ...prev,
      customer: {
        ...prev.customer,
        isExisting: false,
        name: "",
        city: "",
        address: "",
        email: "",
        category: "Middle",
        notes: "",
      },
    }));
    advanceStep();
  }

  function referenceToMedia(
    reference: ProductReference,
  ): BackendEnquiryMedia | null {
    if (reference.type === "link") {
      return { type: "LINK", url: reference.url };
    }
    if (reference.url.startsWith("http")) {
      return {
        type: reference.type === "image" ? "IMAGE" : "VIDEO",
        url: reference.url,
      };
    }
    return null;
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
      const primarySelectedProduct = form.selectedProducts[0];
      const poc = session?.user?.id;
      if (!poc) throw new Error("Unable to determine assigned salesperson.");

      const summaryBits = [
        primarySelectedProduct
          ? `Interested in ${primarySelectedProduct.name} (${primarySelectedProduct.productCode}).`
          : null,
        form.newProducts.length > 0
          ? `${form.newProducts.length} custom product requirement${
              form.newProducts.length > 1 ? "s" : ""
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

      const selectedItems: CreateEnquiryItemInput[] = form.selectedProducts.map(
        (product) => ({
          type: "EXISTING",
          productCode: product.productCode,
          metalType: product.metalType,
          metalPurity: product.metalPurity,
          notes: product.description,
          status: "PENDING",
          media: product.imageUrl
            ? [{ type: "IMAGE", url: product.imageUrl }]
            : [],
        }),
      );

      const customItems: CreateEnquiryItemInput[] = form.newProducts.map(
        (product) => ({
          type: "CUSTOM",
          metalType: product.metalType,
          metalPurity: product.metalPurity || undefined,
          notes: [
            product.category ? `Category: ${product.category}` : null,
            product.polish ? `Polish: ${product.polish}` : null,
            product.stoneCut ? `Stone cut: ${product.stoneCut}` : null,
            product.stoneQuality
              ? `Stone quality: ${product.stoneQuality}`
              : null,
            product.notes || null,
          ]
            .filter(Boolean)
            .join("\n"),
          stones: product.stoneDescription
            ? [
                {
                  stoneType: product.stoneDescription,
                  weight: product.stoneCaratEstimate || undefined,
                },
              ]
            : [],
          media: product.references
            .map(referenceToMedia)
            .filter((item): item is BackendEnquiryMedia => Boolean(item)),
          status: "PENDING",
        }),
      );

      const created = await createEnquiryMutation.mutateAsync({
        name: form.customer.name.trim(),
        phoneNumber: form.customer.phone.trim(),
        notes: [summaryBits.join(" "), customerLocation || null]
          .filter(Boolean)
          .join("\n"),
        status: "NEW",
        poc,
        items: [...selectedItems, ...customItems],
      });

      setSubmitted(true);
      setTimeout(() => router.push(`/enquiries/${created.enquiry.refCode}`), 1200);
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
    setIsPhoneValid,
  };

  return (
    <div
      className={cn(
        "mx-auto pb-28",
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
          stepId === "products" ? "items-stretch" : "items-center",
          "animate-in fade-in-0 duration-300",
          animDir === "forward"
            ? "slide-in-from-bottom-3"
            : "slide-in-from-top-3",
        )}
      >
        {stepId === "phone" && <PhoneStep {...sharedStepProps} />}
        {stepId === "name" && <NameStep {...sharedStepProps} />}
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
            lookupCatalogueProduct={lookupCatalogueProduct}
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

      <div className="pointer-events-none fixed right-0 bottom-6 left-0 z-40 md:left-[var(--sidebar-width)] group-data-[collapsible=icon]/sidebar-wrapper:md:left-[var(--sidebar-width-icon)]">
        <div
          className={cn(
            "mx-auto flex items-center gap-2 px-4",
            stepId === "products" ? "max-w-3xl" : "max-w-2xl",
          )}
        >
          <div className="pointer-events-auto flex items-center gap-1 rounded-lg border border-border bg-card shadow-md">
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
              disabled={isSubmitting || !hasProducts}
              className="pointer-events-auto ml-auto gap-2 px-5 shadow-md"
            >
              {isSubmitting ? "Saving..." : "Save Enquiry"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
