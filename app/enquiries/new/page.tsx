"use client";

import { CheckCircle2, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { RequireInternalAuth } from "@/components/auth/RequireInternalAuth";
import {
  type CustomerDraft,
  CustomerDetailsStep,
} from "@/components/enquiries-v2/CustomerDetailsStep";
import {
  EnquiryCreateHeader,
  type EnquiryCreateStep,
} from "@/components/enquiries-v2/EnquiryCreateHeader";
import { CustomProductForm } from "@/components/requirements/CustomProductForm";
import { RequirementSummaryList } from "@/components/requirements/RequirementSummaryList";
import type { RequirementDraft } from "@/components/requirements/requirement-form-types";
import {
  cleanColorStone,
  cleanDiamond,
  cleanText,
  createEmptyRequirement,
  generateRequirementId,
  hasRequirementContent,
  mediaFromReference,
  revokeReferenceUrls,
} from "@/components/requirements/requirement-form-utils";
import { Button } from "@/components/ui/button";
import { validatePhone } from "@/components/ui/phone-input";
import { authClient } from "@/lib/auth-client";
import { uploadEnquiryImage } from "@/lib/enquiriesApi";
import { useCreateEnquiry } from "@/hooks/useEnquiries";
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
        <EnquiryCreateForm />
      </Suspense>
    </RequireInternalAuth>
  );
}

function EnquiryCreateForm() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const createEnquiryMutation = useCreateEnquiry();
  const [step, setStep] = useState<EnquiryCreateStep>("customer");
  const [customer, setCustomer] = useState<CustomerDraft>({
    phone: "",
    name: "",
  });
  const [isPhoneValid, setIsPhoneValid] = useState(false);
  const [requirements, setRequirements] = useState<RequirementDraft[]>([]);
  const [requirementDraft, setRequirementDraft] = useState<RequirementDraft>(
    createEmptyRequirement,
  );
  const [editingRequirementId, setEditingRequirementId] = useState<string | null>(
    null,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    return () => {
      revokeReferenceUrls(requirementDraft.references);
      for (const requirement of requirements) {
        revokeReferenceUrls(requirement.references);
      }
    };
  }, [requirementDraft.references, requirements]);

  function validateCustomer() {
    const nextErrors: Record<string, string> = {};
    const phoneError = validatePhone(customer.phone);
    if (phoneError || !isPhoneValid) {
      nextErrors.phone = phoneError || "Enter a valid phone number";
    }
    if (!customer.name.trim()) nextErrors.name = "Customer name is required";
    return nextErrors;
  }

  function validateRequirement(value: RequirementDraft) {
    const nextErrors: Record<string, string> = {};
    if (!value.category.trim()) nextErrors.requirement = "Select a product category";
    if (!value.metalType.trim()) nextErrors.requirement = "Select a metal type";
    return nextErrors;
  }

  function goToRequirements() {
    const nextErrors = validateCustomer();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) setStep("requirements");
  }

  function addRequirement() {
    const nextErrors = validateRequirement(requirementDraft);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const requirement = {
      ...requirementDraft,
      id: editingRequirementId ?? generateRequirementId(),
    };

    setRequirements((prev) => {
      if (!editingRequirementId) return [...prev, requirement];
      return prev.map((item) =>
        item.id === editingRequirementId ? requirement : item,
      );
    });
    setRequirementDraft(createEmptyRequirement());
    setEditingRequirementId(null);
    setErrors({});
  }

  function editRequirement(id: string) {
    const requirement = requirements.find((item) => item.id === id);
    if (!requirement) return;
    setRequirementDraft(requirement);
    setEditingRequirementId(id);
    setRequirements((prev) => prev.filter((item) => item.id !== id));
    setErrors({});
  }

  function removeRequirement(id: string) {
    setRequirements((prev) => {
      const removed = prev.find((item) => item.id === id);
      if (removed) revokeReferenceUrls(removed.references);
      return prev.filter((item) => item.id !== id);
    });
  }

  async function referenceToMedia(
    reference: RequirementDraft["references"][number],
  ): Promise<BackendEnquiryMedia | null> {
    if (reference.type === "image" && reference.file) {
      return uploadEnquiryImage(reference.file);
    }
    return mediaFromReference(reference);
  }

  async function buildItem(requirement: RequirementDraft) {
    const media = (
      await Promise.all(requirement.references.map(referenceToMedia))
    ).filter((item): item is BackendEnquiryMedia => Boolean(item));

    return {
      type: "CUSTOM",
      category: cleanText(requirement.category),
      metalType: cleanText(requirement.metalType),
      metalPurity: cleanText(requirement.metalPurity),
      metalWeight: cleanText(requirement.metalWeight),
      diamonds: requirement.diamonds.map(cleanDiamond).filter(hasValues),
      colorStones: requirement.colorStones.map(cleanColorStone).filter(hasValues),
      details: {
        orderType: cleanText(requirement.details.orderType),
        subcategory: cleanText(requirement.details.subcategory),
        productSize: cleanText(requirement.details.productSize),
        polish: cleanText(requirement.details.polish),
        certification: cleanText(requirement.details.certification),
        metalColor: cleanText(requirement.details.metalColor),
        settingType: cleanText(requirement.details.settingType),
        findingType: cleanText(requirement.details.findingType),
        budgetRange: cleanText(requirement.details.budgetRange),
        deliveryDate: cleanText(requirement.details.deliveryDate),
        specialNotes: cleanText(requirement.notes),
      },
      media,
      notes: cleanText(requirement.notes),
      status: "PENDING",
    } satisfies CreateEnquiryItemInput;
  }

  async function handleSubmit() {
    const nextErrors: Record<string, string> = {};
    if (requirements.length === 0) {
      nextErrors.requirement = "Add at least one custom requirement";
    }
    if (hasRequirementContent(requirementDraft)) {
      nextErrors.requirement = editingRequirementId
        ? "Update the open requirement before saving"
        : "Add the open requirement before saving";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      const salesPerson = session?.user?.id;
      if (!salesPerson) {
        throw new Error("Unable to determine assigned salesperson.");
      }

      const items = await Promise.all(requirements.map(buildItem));
      const created = await createEnquiryMutation.mutateAsync({
        name: customer.name.trim(),
        phoneNumber: customer.phone.trim(),
        status: "NEW",
        salesPerson,
        items,
      });

      setSubmitted(true);
      setTimeout(() => router.push(`/enquiries/${created.enquiry.refCode}`), 900);
    } catch (error) {
      setErrors({
        submit:
          error instanceof Error
            ? error.message
            : "Unable to save the enquiry. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return <SuccessState customerName={customer.name} />;
  }

  return (
    <div className="mx-auto w-full max-w-5xl pb-24">
      <EnquiryCreateHeader step={step} />

      {step === "customer" ? (
        <CustomerDetailsStep
          customer={customer}
          errors={errors}
          onChange={setCustomer}
          onPhoneValidityChange={setIsPhoneValid}
          onNext={goToRequirements}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-4">
            <CustomProductForm
              value={requirementDraft}
              onChange={setRequirementDraft}
              onSubmit={addRequirement}
              submitLabel={
                editingRequirementId ? "Update requirement" : "Add requirement"
              }
            />
            {errors.requirement ? (
              <p className="text-sm text-destructive">{errors.requirement}</p>
            ) : null}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <RequirementSummaryList
              requirements={requirements}
              onEdit={editRequirement}
              onRemove={removeRequirement}
            />
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-sm font-semibold text-foreground">
                Ready to create?
              </p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Images upload on save. Add every open requirement before
                creating the enquiry.
              </p>
              {errors.submit ? (
                <p className="mt-3 text-xs text-destructive">{errors.submit}</p>
              ) : null}
              <div className="mt-4 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setStep("customer")}
                >
                  <ChevronLeft className="size-4" />
                  Customer
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSubmit}
                  disabled={isSubmitting || requirements.length === 0}
                  className="ml-auto"
                >
                  {isSubmitting ? "Saving..." : "Create enquiry"}
                </Button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function SuccessState({ customerName }: { customerName: string }) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center justify-center gap-4 py-28 text-center">
      <div className="flex size-14 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10">
        <CheckCircle2 className="size-7 text-emerald-600" />
      </div>
      <div>
        <h1 className="text-lg font-semibold text-foreground">
          Enquiry captured
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {customerName}&apos;s enquiry has been added. Redirecting you back...
        </p>
      </div>
    </div>
  );
}

function hasValues(item: Record<string, unknown>) {
  return Object.entries(item).some(
    ([key, value]) => key !== "id" && String(value ?? "").trim(),
  );
}
