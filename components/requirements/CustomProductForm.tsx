"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ColorStoneDetailsSection } from "./ColorStoneDetailsSection";
import { DiamondDetailsSection } from "./DiamondDetailsSection";
import { MetalDetailsSection } from "./MetalDetailsSection";
import { RequirementBasicsSection } from "./RequirementBasicsSection";
import { RequirementReferencesSection } from "./RequirementReferencesSection";
import type { RequirementDraft } from "./requirement-form-types";

export function CustomProductForm({
  value,
  onChange,
  onSubmit,
  submitLabel = "Add requirement",
  disabled,
  showActions = true,
  hideDeliveryDate = false,
  className,
}: {
  value: RequirementDraft;
  onChange: (value: RequirementDraft) => void;
  onSubmit: () => void;
  submitLabel?: string;
  disabled?: boolean;
  showActions?: boolean;
  hideDeliveryDate?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "space-y-5 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5",
        className,
      )}
    >
      <RequirementReferencesSection
        productCode={value.referenceProductCode}
        references={value.references}
        onProductChange={(referenceProductCode) =>
          onChange({ ...value, referenceProductCode })
        }
        onReferencesChange={(references) => onChange({ ...value, references })}
      />
      <RequirementBasicsSection
        value={value}
        onChange={onChange}
        hideDeliveryDate={hideDeliveryDate}
      />
      <DiamondDetailsSection value={value} onChange={onChange} />
      <ColorStoneDetailsSection value={value} onChange={onChange} />
      <MetalDetailsSection value={value} onChange={onChange} />

      {showActions ? (
        <div className="flex justify-end border-t border-border pt-4">
          <Button type="button" onClick={onSubmit} disabled={disabled}>
            <Plus className="size-4" />
            {submitLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
