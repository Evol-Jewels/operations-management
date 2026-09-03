"use client";

import { CheckCircle2, ChevronLeft, CircleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { RequireInternalAuth } from "@/components/auth/RequireInternalAuth";
import {
  readDraft,
  removeDraft,
  sanitizeReferences,
  writeDraft,
} from "@/components/enquiries/form-draft-storage";
import {
  CustomerDetailsStep,
  type CustomerDraft,
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
  DEFAULT_COLOR_STONE_NATURE,
  generateRequirementId,
  hasRequirementContent,
  mediaFromReference,
  revokeReferenceUrls,
} from "@/components/requirements/requirement-form-utils";
import { Button } from "@/components/ui/button";
import { validatePhone } from "@/components/ui/phone-input";
import { useCreateEnquiry } from "@/hooks/useEnquiries";
import { captureProductEvent } from "@/lib/analytics";
import { authClient } from "@/lib/auth-client";
import { uploadEnquiryImage, uploadEnquiryRecording } from "@/lib/enquiriesApi";
import {
  deleteEnquiryMedia,
  getEnquiryMedia,
} from "@/lib/storage/enquiry-media";
import type {
  BackendEnquiryMedia,
  CreateEnquiryItemInput,
} from "@/types/enquiry-api";

const NEW_ENQUIRY_V2_DRAFT_KEY = "evol:new-enquiry-v2:draft:v1";

interface NewEnquiryDraft {
  step: EnquiryCreateStep;
  customer: CustomerDraft;
  requirements: RequirementDraft[];
  requirementDraft: RequirementDraft;
  editingRequirementId: string | null;
  isRequirementFormOpen: boolean;
}

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
  const [editingRequirementId, setEditingRequirementId] = useState<
    string | null
  >(null);
  const [isRequirementFormOpen, setIsRequirementFormOpen] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [draftHydrated, setDraftHydrated] = useState(false);
  const cleanupDraftReferencesRef = useRef(requirementDraft.references);
  const cleanupRequirementsRef = useRef(requirements);
  cleanupDraftReferencesRef.current = requirementDraft.references;
  cleanupRequirementsRef.current = requirements;

  useEffect(() => {
    let active = true;

    async function hydrateDraft() {
      const draft = readDraft<NewEnquiryDraft>(NEW_ENQUIRY_V2_DRAFT_KEY);
      if (draft) {
        const [restoredRequirements, restoredRequirementDraft] =
          await Promise.all([
            Promise.all(draft.requirements.map(restoreRequirementMedia)),
            restoreRequirementMedia(draft.requirementDraft),
          ]);
        if (!active) return;
        setStep(draft.step);
        setCustomer(draft.customer);
        setRequirements(restoredRequirements);
        setRequirementDraft(restoredRequirementDraft);
        setEditingRequirementId(draft.editingRequirementId);
        setIsRequirementFormOpen(draft.isRequirementFormOpen);
      }
      if (active) setDraftHydrated(true);
    }

    void hydrateDraft();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!draftHydrated || submitted) return;

    writeDraft(NEW_ENQUIRY_V2_DRAFT_KEY, {
      step,
      customer,
      requirements: requirements.map(sanitizeRequirementDraft),
      requirementDraft: sanitizeRequirementDraft(requirementDraft),
      editingRequirementId,
      isRequirementFormOpen,
    } satisfies NewEnquiryDraft);
  }, [
    customer,
    draftHydrated,
    editingRequirementId,
    isRequirementFormOpen,
    requirementDraft,
    requirements,
    step,
    submitted,
  ]);

  useEffect(() => {
    return () => {
      revokeReferenceUrls(cleanupDraftReferencesRef.current);
      for (const requirement of cleanupRequirementsRef.current) {
        revokeReferenceUrls(requirement.references);
      }
    };
  }, []);

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
    if (!value.category.trim())
      nextErrors.requirement = "Select a product category";
    if (!value.metalType.trim()) nextErrors.requirement = "Select a metal type";
    if (value.colorStones.some(hasColorStoneDetailsWithoutType)) {
      nextErrors.requirement = "Select a color stone type";
    }
    return nextErrors;
  }

  function goToRequirements() {
    const nextErrors = validateCustomer();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) {
      setStep("requirements");
      setIsRequirementFormOpen(requirements.length === 0);
    }
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
    setIsRequirementFormOpen(false);
    setErrors({});
  }

  function addNewRequirement() {
    setRequirementDraft(createEmptyRequirement());
    setEditingRequirementId(null);
    setErrors({});
    setIsRequirementFormOpen(true);
  }

  function editRequirement(id: string) {
    const requirement = requirements.find((item) => item.id === id);
    if (!requirement) return;
    setRequirementDraft(requirement);
    setEditingRequirementId(id);
    setIsRequirementFormOpen(true);
    setErrors({});
  }

  function removeRequirement(id: string) {
    setRequirements((prev) => {
      const removed = prev.find((item) => item.id === id);
      if (removed) discardLocalReferences(removed.references);
      return prev.filter((item) => item.id !== id);
    });
  }

  async function referenceToMedia(
    reference: RequirementDraft["references"][number],
  ): Promise<BackendEnquiryMedia | null> {
    if (reference.type === "image" && reference.file) {
      return uploadEnquiryImage(reference.file);
    }
    if (
      (reference.type === "video" || reference.type === "audio") &&
      reference.file
    ) {
      try {
        const uploaded = await uploadEnquiryRecording(
          reference.file,
          reference.type,
        );
        return {
          ...uploaded,
          durationSeconds:
            reference.durationSeconds ?? uploaded.durationSeconds,
        };
      } catch (error) {
        const reason =
          error instanceof Error
            ? error.message
            : "The server did not accept the recording.";
        throw new Error(
          `${reference.type === "video" ? "Video" : "Audio"} “${reference.name}” could not be uploaded. ${reason}`,
        );
      }
    }
    return mediaFromReference(reference);
  }

  async function buildItem(requirement: RequirementDraft) {
    const media = (
      await Promise.all(requirement.references.map(referenceToMedia))
    ).filter((item): item is BackendEnquiryMedia => Boolean(item));

    return {
      type: "CUSTOM",
      referenceProductCode: cleanText(requirement.referenceProductCode),
      category: cleanText(requirement.category),
      metalType: cleanText(requirement.metalType),
      metalPurity: cleanText(requirement.metalPurity),
      metalWeight: cleanText(requirement.metalWeight),
      diamonds: requirement.diamonds.map(cleanDiamond).filter(hasValues),
      colorStones: requirement.colorStones
        .map(cleanColorStone)
        .filter(hasStoneType),
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

      captureProductEvent("enquiry_created", {
        requirement_count: items.length,
        has_requirement_media: items.some((item) => item.media.length > 0),
      });

      setSubmitted(true);
      removeDraft(NEW_ENQUIRY_V2_DRAFT_KEY);
      await clearStoredMedia(requirements);
      setTimeout(
        () => router.push(`/enquiries/${created.enquiry.refCode}`),
        900,
      );
    } catch (error) {
      captureProductEvent("enquiry_creation_failed", {
        requirement_count: requirements.length,
      });
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
          isNextDisabled={!customer.phone.trim() || !customer.name.trim()}
          onChange={setCustomer}
          onPhoneValidityChange={setIsPhoneValid}
          onNext={goToRequirements}
        />
      ) : (
        <RequirementStepPanel
          errors={errors}
          isFormOpen={isRequirementFormOpen || requirements.length === 0}
          isSubmitting={isSubmitting}
          requirementDraft={requirementDraft}
          requirements={requirements}
          editingRequirementId={editingRequirementId}
          onBack={() => {
            if (isRequirementFormOpen && requirements.length > 0) {
              discardLocalReferences(requirementDraft.references);
              setRequirementDraft(createEmptyRequirement());
              setEditingRequirementId(null);
              setErrors({});
              setIsRequirementFormOpen(false);
              return;
            }
            setStep("customer");
          }}
          onAddRequirement={addRequirement}
          onAddNewRequirement={addNewRequirement}
          onChangeRequirement={setRequirementDraft}
          onCreate={handleSubmit}
          onEdit={editRequirement}
          onRemove={removeRequirement}
        />
      )}
    </div>
  );
}

function RequirementStepPanel({
  errors,
  isFormOpen,
  isSubmitting,
  requirementDraft,
  requirements,
  editingRequirementId,
  onBack,
  onAddRequirement,
  onAddNewRequirement,
  onChangeRequirement,
  onCreate,
  onEdit,
  onRemove,
}: {
  errors: Record<string, string>;
  isFormOpen: boolean;
  isSubmitting: boolean;
  requirementDraft: RequirementDraft;
  requirements: RequirementDraft[];
  editingRequirementId: string | null;
  onBack: () => void;
  onAddRequirement: () => void;
  onAddNewRequirement: () => void;
  onChangeRequirement: (value: RequirementDraft) => void;
  onCreate: () => void;
  onEdit: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const isRequirementActionDisabled =
    isFormOpen &&
    (!requirementDraft.category.trim() || !requirementDraft.metalType.trim());

  return (
    <div className="mx-auto flex h-[calc(100vh-13rem)] min-h-[34rem] max-w-3xl flex-col rounded-lg border border-border">
      <div className="border-b border-border p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          Step 2 of 2
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
          What is the customer interested in?
        </h1>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        {isFormOpen ? (
          <div className="space-y-3">
            <CustomProductForm
              value={requirementDraft}
              onChange={onChangeRequirement}
              onSubmit={onAddRequirement}
              submitLabel={
                editingRequirementId ? "Update requirement" : "Add requirement"
              }
              showActions={false}
              className="border-0 bg-transparent p-0 shadow-none sm:p-0"
            />
            {errors.requirement ? (
              <p className="text-sm text-destructive">{errors.requirement}</p>
            ) : null}
          </div>
        ) : (
          <div className="mx-auto max-w-xl space-y-5 py-4">
            <RequirementSummaryList
              requirements={requirements}
              onAdd={onAddNewRequirement}
              onEdit={onEdit}
              onRemove={onRemove}
            />
            {errors.submit ? (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
              >
                <CircleAlert className="mt-0.5 size-4 shrink-0" />
                <div>
                  <p className="font-medium">Couldn&apos;t save the enquiry</p>
                  <p className="mt-0.5 text-xs leading-5">{errors.submit}</p>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 border-t border-border p-5">
        <Button type="button" variant="outline" onClick={onBack}>
          <ChevronLeft className="size-4" />
          Back
        </Button>
        <Button
          type="button"
          onClick={isFormOpen ? onAddRequirement : onCreate}
          disabled={
            isRequirementActionDisabled ||
            (!isFormOpen && (isSubmitting || requirements.length === 0))
          }
          className="ml-auto"
        >
          {isFormOpen
            ? editingRequirementId
              ? "Update requirement"
              : "Add requirement"
            : isSubmitting
              ? "Saving..."
              : "Create enquiry"}
        </Button>
      </div>
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

function hasStoneType(item: { stoneType?: string }) {
  return Boolean(item.stoneType?.trim());
}

function hasColorStoneDetailsWithoutType(
  stone: RequirementDraft["colorStones"][number],
) {
  if (stone.stoneType?.trim()) return false;

  return Boolean(
    (stone.nature && stone.nature !== DEFAULT_COLOR_STONE_NATURE) ||
      stone.origin?.trim() ||
      stone.treatment?.trim() ||
      stone.weight?.trim() ||
      stone.notes?.trim(),
  );
}

function sanitizeRequirementDraft(
  requirement: RequirementDraft,
): RequirementDraft {
  return {
    ...requirement,
    references: sanitizeReferences(requirement.references),
  };
}

async function restoreRequirementMedia(
  requirement: RequirementDraft,
): Promise<RequirementDraft> {
  const references = await Promise.all(
    requirement.references.map(async (reference) => {
      if (!reference.mediaId) return reference.url ? reference : null;

      try {
        const stored = await getEnquiryMedia(reference.mediaId);
        if (!stored) return reference.url ? reference : null;
        const file = new File([stored.blob], stored.name, {
          type: stored.mimeType,
          lastModified: Date.parse(stored.createdAt),
        });
        return {
          ...reference,
          name: stored.name,
          mimeType: stored.mimeType,
          size: stored.size,
          url: URL.createObjectURL(stored.blob),
          file,
        };
      } catch {
        return reference.url ? reference : null;
      }
    }),
  );

  return {
    ...requirement,
    references: references.filter(
      (reference): reference is NonNullable<typeof reference> =>
        Boolean(reference),
    ),
  };
}

function discardLocalReferences(references: RequirementDraft["references"]) {
  revokeReferenceUrls(references);
  for (const reference of references) {
    if (reference.mediaId) void deleteEnquiryMedia(reference.mediaId);
  }
}

async function clearStoredMedia(requirements: RequirementDraft[]) {
  const mediaIds = requirements.flatMap((requirement) =>
    requirement.references.flatMap((reference) =>
      reference.mediaId ? [reference.mediaId] : [],
    ),
  );
  await Promise.allSettled(mediaIds.map(deleteEnquiryMedia));
}
