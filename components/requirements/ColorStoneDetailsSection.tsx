"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StoneTypeCombobox } from "@/components/stone-type-combobox";
import { FormField } from "@/components/ui/form-field";
import { useStoneTypes } from "@/hooks/useManageProducts";
import {
  COLOR_STONE_NATURES,
  COLOR_STONE_ORIGINS,
  COLOR_STONE_TREATMENTS,
  COLOR_STONE_TYPES,
} from "./requirement-options";
import {
  type RequirementColorStone,
  type RequirementDraft,
} from "./requirement-form-types";
import { createEmptyColorStone } from "./requirement-form-utils";
import { NotesField, OptionTextField, SectionShell, TextField } from "./RequirementFields";

export function ColorStoneDetailsSection({
  value,
  onChange,
}: {
  value: RequirementDraft;
  onChange: (value: RequirementDraft) => void;
}) {
  const stoneTypesQuery = useStoneTypes({ limit: 1000 });
  const apiStoneTypes = (stoneTypesQuery.data?.data ?? [])
    .filter((stone) => !stone.isDeleted)
    .map((stone) => stone.name);
  const stoneTypeOptions = Array.from(
    new Set(apiStoneTypes.length > 0 ? apiStoneTypes : COLOR_STONE_TYPES),
  ).map((stoneType) => ({ value: stoneType, label: stoneType }));

  function updateStone(id: string, patch: Partial<RequirementColorStone>) {
    onChange({
      ...value,
      colorStones: value.colorStones.map((stone) =>
        stone.id === id ? { ...stone, ...patch } : stone,
      ),
    });
  }

  function removeStone(id: string) {
    onChange({
      ...value,
      colorStones: value.colorStones.filter((stone) => stone.id !== id),
    });
  }

  return (
    <SectionShell eyebrow="Color Stones" title="Colour stone details">
      <div className="space-y-3">
        {value.colorStones.length === 0 ? (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-border px-3 py-3">
            <p className="text-sm text-muted-foreground">
              No colour stones added.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                onChange({
                  ...value,
                  colorStones: [createEmptyColorStone()],
                })
              }
            >
              <Plus className="size-3.5" />
              Add colour stone
            </Button>
          </div>
        ) : null}
        {value.colorStones.map((stone, index) => (
          <div
            key={stone.id}
            className="rounded-lg border border-border bg-muted/15 p-3"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-xs font-semibold text-foreground">
                Colour stone {index + 1}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => removeStone(stone.id)}
                aria-label={`Remove colour stone ${index + 1}`}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Color stone type" required>
                <StoneTypeCombobox
                  options={stoneTypeOptions}
                  value={stone.stoneType}
                  onValueChange={(stoneType) =>
                    updateStone(stone.id, { stoneType })
                  }
                  loading={stoneTypesQuery.isLoading}
                />
              </FormField>
              <OptionTextField
                label="Color stone nature"
                value={stone.nature}
                options={COLOR_STONE_NATURES}
                onChange={(nature) => updateStone(stone.id, { nature })}
              />
              <OptionTextField
                label="Origin"
                value={stone.origin}
                options={COLOR_STONE_ORIGINS}
                onChange={(origin) => updateStone(stone.id, { origin })}
              />
              <OptionTextField
                label="Treatment"
                value={stone.treatment}
                options={COLOR_STONE_TREATMENTS}
                onChange={(treatment) => updateStone(stone.id, { treatment })}
              />
              <TextField
                label="Color stone wt (in cts)"
                value={stone.weight}
                placeholder="1.20"
                onChange={(weight) => updateStone(stone.id, { weight })}
              />
              <NotesField
                label="Color stone notes"
                value={stone.notes}
                onChange={(notes) => updateStone(stone.id, { notes })}
              />
            </div>
          </div>
        ))}
        {value.colorStones.length > 0 ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              onChange({
                ...value,
                colorStones: [...value.colorStones, createEmptyColorStone()],
              })
            }
          >
            <Plus className="size-3.5" />
            Add colour stone
          </Button>
        ) : null}
      </div>
    </SectionShell>
  );
}
