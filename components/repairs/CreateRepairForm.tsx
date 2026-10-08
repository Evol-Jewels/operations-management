"use client";

import { ArrowLeft, Loader2, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { ProductReference } from "@/components/enquiries/enquiry-form-types";
import { SectionShell } from "@/components/requirements/RequirementFields";
import { RequirementReferencesSection } from "@/components/requirements/RequirementReferencesSection";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import {
  EMPTY_REPAIR,
  prepareRepairMedia,
  type RepairDraft,
  validateRepair,
  validateRepairVendor,
} from "@/lib/repairs";
import { createRepair } from "@/lib/repairsApi";
import { RepairCustomerStep } from "./RepairCustomerStep";
import { RepairProductFields } from "./RepairProductFields";
import { RepairVendorFields } from "./RepairVendorFields";

export function CreateRepairForm() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [draft, setDraft] = useState<RepairDraft>(EMPTY_REPAIR);
  const [references, setReferences] = useState<ProductReference[]>([]);
  const referencesRef = useRef(references);
  const [errors, setErrors] = useState<
    Partial<Record<keyof RepairDraft, string>>
  >({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  useEffect(() => {
    referencesRef.current = references;
  }, [references]);
  useEffect(
    () => () => {
      for (const reference of referencesRef.current)
        if (reference.url.startsWith("blob:"))
          URL.revokeObjectURL(reference.url);
    },
    [],
  );
  const update = (values: Partial<RepairDraft>) => {
    setDraft((current) => ({ ...current, ...values }));
    setErrors((current) => {
      const next = { ...current };
      for (const key of Object.keys(values) as (keyof RepairDraft)[])
        delete next[key];
      return next;
    });
  };
  const nextStep = () => {
    const { customerName, customerPhone } = validateRepair(draft);
    setErrors({ customerName, customerPhone });
    if (customerName || customerPhone) return;
    setStep(2);
    window.scrollTo({ top: 0 });
  };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (step === 1) {
      nextStep();
      return;
    }
    const nextErrors = validateRepair(draft);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      toast.error("Complete the required repair details.");
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      const repair = await createRepair(draft);
      toast.success("Repair created");
      router.push(`/repairs/${repair.id}`);
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Could not save this repair.",
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="mx-auto max-w-3xl pb-28">
      <div className="mb-2 h-[2px] overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${step * 50}%` }}
        />
      </div>
      <div className="mb-4">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 gap-1.5 text-muted-foreground"
          disabled={saving}
          onClick={() =>
            step === 2
              ? setStep(1)
              : router.push("/orders-workspace?type=repair")
          }
        >
          <ArrowLeft className="size-3.5" />
          {step === 2 ? "Back" : "Back to repairs"}
        </Button>
      </div>
      <form noValidate onSubmit={(event) => void submit(event)}>
        <fieldset disabled={saving}>
          {step === 1 ? (
            <RepairCustomerStep
              draft={draft}
              errors={errors}
              onChange={update}
              onNext={nextStep}
            />
          ) : (
            <div className="space-y-5 px-1">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  New repair · Step 2 of 2
                </p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight">
                  Repair details
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  {draft.productType === "Customer"
                    ? draft.customerName
                    : "Stock repair"}
                </p>
              </div>
              <div className="space-y-5 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
                <RequirementReferencesSection
                  productCode={draft.barcode}
                  references={references}
                  localOnly
                  onProductChange={(barcode) => update({ barcode })}
                  productField={
                    <FormField
                      label="Barcode"
                      htmlFor="repair-barcode"
                      optional
                    >
                      <Input
                        id="repair-barcode"
                        value={draft.barcode}
                        onChange={(event) =>
                          update({ barcode: event.target.value })
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Enter") event.preventDefault();
                        }}
                        placeholder="Enter product barcode"
                        autoComplete="off"
                        maxLength={255}
                        className="h-10"
                      />
                    </FormField>
                  }
                  onReferencesChange={(next) => {
                    setReferences(next);
                    update(prepareRepairMedia(next));
                  }}
                />
                <RepairProductFields
                  draft={draft}
                  onChange={update}
                  errors={errors}
                />
                <SectionShell
                  eyebrow="Vendor"
                  title="Vendor and delivery details"
                >
                  <RepairVendorFields
                    value={draft.vendor}
                    onChange={(vendor) => update({ vendor })}
                    errors={
                      errors.vendor
                        ? validateRepairVendor(draft.vendor, false)
                        : undefined
                    }
                  />
                </SectionShell>
              </div>
            </div>
          )}
        </fieldset>
        {saveError && (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {saveError}
          </p>
        )}
        {step === 2 && (
          <div className="pointer-events-none fixed right-0 bottom-6 left-0 z-40 md:left-[var(--sidebar-width)] group-data-[collapsible=icon]/sidebar-wrapper:md:left-[var(--sidebar-width-icon)]">
            <div className="mx-auto flex max-w-3xl justify-end gap-2 px-4">
              <Button
                asChild
                variant="outline"
                disabled={saving}
                className="pointer-events-auto bg-card shadow-md"
              >
                <Link href="/orders-workspace?type=repair">Cancel</Link>
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="pointer-events-auto gap-2 px-5 shadow-md"
              >
                {saving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Plus className="size-4" />
                )}
                {saving ? "Saving…" : "Create repair"}
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
