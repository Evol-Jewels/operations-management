"use client";

import {
  OptionTextField,
  SectionShell,
} from "@/components/requirements/RequirementFields";
import {
  GOLD_PURITIES,
  METAL_COLOURS,
  PRODUCT_CATEGORIES,
} from "@/components/requirements/requirement-options";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { RepairDraft } from "@/lib/repairs";

export function RepairProductFields({
  draft,
  onChange,
  errors,
}: {
  draft: RepairDraft;
  onChange: (values: Partial<RepairDraft>) => void;
  errors: Partial<Record<keyof RepairDraft, string>>;
}) {
  return (
    <>
      <SectionShell eyebrow="Product" title="Product and metal details">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <OptionTextField
              label="Product category"
              value={draft.category}
              options={PRODUCT_CATEGORIES}
              required
              onChange={(category) => onChange({ category })}
            />
            {errors.category && (
              <p className="mt-1 text-[11px] text-destructive">
                {errors.category}
              </p>
            )}
          </div>
          {(
            [
              ["grossWeight", "Gross weight (g)"],
              ["netWeight", "Net weight (g)"],
            ] as const
          ).map(([key, label]) => (
            <FormField
              key={key}
              label={label}
              htmlFor={key}
              required
              error={errors[key]}
            >
              <Input
                id={key}
                type="number"
                min="0"
                step="0.001"
                value={draft[key]}
                onChange={(event) => onChange({ [key]: event.target.value })}
                aria-invalid={Boolean(errors[key])}
                className="h-9"
                placeholder="0.00"
              />
            </FormField>
          ))}
          <div>
            <OptionTextField
              label="Purity"
              value={draft.purity}
              options={GOLD_PURITIES}
              required
              onChange={(purity) => onChange({ purity })}
            />
            {errors.purity && (
              <p className="mt-1 text-[11px] text-destructive">
                {errors.purity}
              </p>
            )}
          </div>
          <div>
            <OptionTextField
              label="Metal color"
              value={draft.metalColor}
              options={METAL_COLOURS}
              required
              onChange={(metalColor) => onChange({ metalColor })}
            />
            {errors.metalColor && (
              <p className="mt-1 text-[11px] text-destructive">
                {errors.metalColor}
              </p>
            )}
          </div>
          <FormField
            label="Product remarks"
            htmlFor="productRemarks"
            optional
            className="sm:col-span-2"
          >
            <Textarea
              id="productRemarks"
              value={draft.productRemarks}
              onChange={(event) =>
                onChange({ productRemarks: event.target.value })
              }
              placeholder="Product description, condition, or identifying details"
              className="min-h-20 resize-none"
              maxLength={2000}
            />
          </FormField>
        </div>
      </SectionShell>
      <SectionShell eyebrow="Diamonds" title="Diamond details">
        <div className="rounded-lg border border-border bg-muted/15 p-3">
          <div className="grid gap-4 sm:grid-cols-2">
            {(
              [
                ["diamondCarats", "Diamond wt (in cts)"],
                ["diamondPieces", "Pieces"],
              ] as const
            ).map(([key, label]) => (
              <FormField
                key={key}
                label={label}
                htmlFor={key}
                optional
                error={errors[key]}
              >
                <Input
                  id={key}
                  type="number"
                  min="0"
                  step={key === "diamondPieces" ? "1" : "0.001"}
                  value={draft[key]}
                  onChange={(event) => onChange({ [key]: event.target.value })}
                  aria-invalid={Boolean(errors[key])}
                  className="h-9"
                  placeholder={key === "diamondPieces" ? "12" : "0.00"}
                />
              </FormField>
            ))}
          </div>
        </div>
      </SectionShell>
      <SectionShell eyebrow="Repair" title="Repair work required">
        <FormField
          label="Repair remarks"
          htmlFor="repairRemarks"
          required
          error={errors.repairRemarks}
        >
          <Textarea
            id="repairRemarks"
            value={draft.repairRemarks}
            onChange={(event) =>
              onChange({ repairRemarks: event.target.value })
            }
            placeholder="Describe what needs to be repaired"
            className="min-h-24 resize-none"
            maxLength={4000}
            aria-invalid={Boolean(errors.repairRemarks)}
          />
        </FormField>
      </SectionShell>
    </>
  );
}
