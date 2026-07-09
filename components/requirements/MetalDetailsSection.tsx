"use client";

import type { RequirementDraft } from "./requirement-form-types";
import {
  CERTIFICATIONS,
  METAL_COLOURS,
  METAL_PURITIES,
  METAL_TYPES,
  POLISH_OPTIONS,
} from "./requirement-options";
import { NotesField, OptionTextField, SectionShell, TextField } from "./RequirementFields";

export function MetalDetailsSection({
  value,
  onChange,
}: {
  value: RequirementDraft;
  onChange: (value: RequirementDraft) => void;
}) {
  const updateDetails = (patch: Partial<RequirementDraft["details"]>) =>
    onChange({ ...value, details: { ...value.details, ...patch } });

  return (
    <SectionShell eyebrow="Metal" title="Metal, polish and requirement notes">
      <div className="grid gap-4 sm:grid-cols-2">
        <OptionTextField
          label="Metal type"
          value={value.metalType}
          options={METAL_TYPES}
          onChange={(metalType) => onChange({ ...value, metalType })}
          required
        />
        <OptionTextField
          label="Metal color"
          value={value.details.metalColor}
          options={METAL_COLOURS}
          onChange={(metalColor) => updateDetails({ metalColor })}
        />
        <TextField
          label="Gold weight (in gms)"
          value={value.metalWeight}
          placeholder="5.80, approx..."
          onChange={(metalWeight) => onChange({ ...value, metalWeight })}
        />
        <OptionTextField
          label="Metal KT / purity"
          value={value.metalPurity}
          options={METAL_PURITIES}
          onChange={(metalPurity) => onChange({ ...value, metalPurity })}
        />
        <OptionTextField
          label="Polish"
          value={value.details.polish}
          options={POLISH_OPTIONS}
          onChange={(polish) => updateDetails({ polish })}
        />
        <OptionTextField
          label="Certification"
          value={value.details.certification}
          options={CERTIFICATIONS}
          onChange={(certification) => updateDetails({ certification })}
        />
        <NotesField
          label="Special notes"
          value={value.notes}
          placeholder="Specific design preference, constraints, timeline, estimate notes..."
          onChange={(notes) =>
            onChange({
              ...value,
              notes,
              details: { ...value.details, specialNotes: notes },
            })
          }
        />
      </div>
    </SectionShell>
  );
}
