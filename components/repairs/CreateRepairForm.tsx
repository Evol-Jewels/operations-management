"use client";

import { ArrowLeft, ChevronRight, Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { ProductReference } from "@/components/enquiries/enquiry-form-types";
import {
  CreateFlowLayout,
  CreateFlowProgress,
  FLOW_PRIMARY_ACTION,
  FLOW_SECONDARY_ACTION,
} from "@/components/orders/create-flow-layout";
import { SectionShell } from "@/components/requirements/RequirementFields";
import { RequirementReferencesSection } from "@/components/requirements/RequirementReferencesSection";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { useVendorAccess } from "@/hooks/useVendors";
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
  const canManageVendor = useVendorAccess();
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
    document.getElementById("app-content")?.scrollTo({ top: 0 });
  };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (step === 1) {
      nextStep();
      return;
    }
    const payload = canManageVendor ? draft : { ...draft, vendor: undefined };
    const nextErrors = validateRepair(payload);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      toast.error("Complete the required repair details.");
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      const repair = await createRepair(payload);
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
    <form noValidate onSubmit={(event) => void submit(event)}>
      <CreateFlowLayout
        actions={
          step === 1 ? (
            <Button type="submit" className={FLOW_PRIMARY_ACTION}>
              Add repair details
              <ChevronRight className="size-4" />
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => setStep(1)}
                className={FLOW_SECONDARY_ACTION}
              >
                <ArrowLeft className="size-4" />
                Back
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className={FLOW_PRIMARY_ACTION}
              >
                {saving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Plus className="size-4" />
                )}
                {saving ? "Saving…" : "Create repair"}
              </Button>
            </>
          )
        }
      >
        <div className="mb-5 space-y-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="-ml-2 gap-1.5 text-muted-foreground"
            disabled={saving}
            onClick={() => router.push("/orders-workspace?type=repair")}
          >
            <ArrowLeft className="size-3.5" />
            Back to repairs
          </Button>
          <CreateFlowProgress
            step={step}
            total={2}
            label={step === 1 ? "Customer" : "Repair details"}
          />
          <div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              {step === 1 ? "New repair" : "Repair details"}
            </h1>
            {step === 2 && (
              <p className="mt-1 text-sm text-muted-foreground">
                {draft.productType === "Customer"
                  ? draft.customerName
                  : "Stock repair"}
              </p>
            )}
          </div>
        </div>
        <fieldset disabled={saving}>
          {step === 1 ? (
            <RepairCustomerStep
              draft={draft}
              errors={errors}
              onChange={update}
            />
          ) : (
            <div className="space-y-5 sm:rounded-xl sm:border sm:border-border sm:bg-card sm:p-5 sm:shadow-sm">
              <RequirementReferencesSection
                productCode={draft.barcode}
                references={references}
                localOnly
                onProductChange={(barcode) => update({ barcode })}
                productField={
                  <FormField label="Barcode" htmlFor="repair-barcode" optional>
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
              {canManageVendor && (
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
              )}
            </div>
          )}
        </fieldset>
        {saveError && (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {saveError}
          </p>
        )}
      </CreateFlowLayout>
    </form>
  );
}
