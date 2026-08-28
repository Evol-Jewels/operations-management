"use client";

import {
  NotesField,
  OptionTextField,
  SectionShell,
  TextField,
} from "./RequirementFields";
import type { RequirementDraft } from "./requirement-form-types";
import {
  CERTIFICATIONS,
  getMetalColours,
  getMetalPurities,
  METAL_TYPES,
  POLISH_OPTIONS,
} from "./requirement-options";

export function MetalDetailsSection({
  value,
  onChange,
}: {
  value: RequirementDraft;
  onChange: (value: RequirementDraft) => void;
}) {
  const updateDetails = (patch: Partial<RequirementDraft["details"]>) =>
    onChange({ ...value, details: { ...value.details, ...patch } });
  const metalColours = getMetalColours(value.metalType);
  const metalPurities = getMetalPurities(value.metalType);

  const updateMetalType = (metalType: string) => {
    const nextColours = getMetalColours(metalType);
    const nextPurities = getMetalPurities(metalType);
    const fixedMetalDetails = metalType === "Silver" || metalType === "Platinum";

    onChange({
      ...value,
      metalType,
      metalPurity: nextPurities.includes(value.metalPurity)
        ? value.metalPurity
        : fixedMetalDetails
          ? (nextPurities[0] ?? "")
          : "",
      details: {
        ...value.details,
        metalColor: nextColours.includes(value.details.metalColor ?? "")
          ? value.details.metalColor
          : fixedMetalDetails
            ? (nextColours[0] ?? "")
            : "",
      },
    });
  };

  return (
    <SectionShell eyebrow="Metal" title="Metal, polish and requirement notes">
      <div className="grid gap-4 sm:grid-cols-2">
        <OptionTextField
          label="Metal type"
          value={value.metalType}
          options={METAL_TYPES}
          onChange={updateMetalType}
          required
        />
        <OptionTextField
          label="Metal color"
          value={value.details.metalColor}
          options={metalColours}
          onChange={(metalColor) => updateDetails({ metalColor })}
        />
        <TextField
          label="Metal weight (in gms)"
          value={value.metalWeight}
          placeholder="5.800"
          inputMode="decimal"
          onChange={(metalWeight) => onChange({ ...value, metalWeight })}
          optional
        />
        <OptionTextField
          label="Metal KT / purity"
          value={value.metalPurity}
          options={metalPurities}
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
