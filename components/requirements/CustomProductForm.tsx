"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ColorStoneDetailsSection } from "./ColorStoneDetailsSection";
import { DiamondDetailsSection } from "./DiamondDetailsSection";
import { MetalDetailsSection } from "./MetalDetailsSection";
import { RequirementBasicsSection } from "./RequirementBasicsSection";
import { RequirementMediaSection } from "./RequirementMediaSection";
import type { RequirementDraft } from "./requirement-form-types";

export function CustomProductForm({
  value,
  onChange,
  onSubmit,
  submitLabel = "Add requirement",
  disabled,
}: {
  value: RequirementDraft;
  onChange: (value: RequirementDraft) => void;
  onSubmit: () => void;
  submitLabel?: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-5 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <RequirementBasicsSection value={value} onChange={onChange} />
      <RequirementMediaSection
        references={value.references}
        onChange={(references) => onChange({ ...value, references })}
      />
      <DiamondDetailsSection value={value} onChange={onChange} />
      <ColorStoneDetailsSection value={value} onChange={onChange} />
      <MetalDetailsSection value={value} onChange={onChange} />

      <div className="flex justify-end border-t border-border pt-4">
        <Button type="button" onClick={onSubmit} disabled={disabled}>
          <Plus className="size-4" />
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}
