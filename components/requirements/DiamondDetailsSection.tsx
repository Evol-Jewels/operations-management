"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DIAMOND_CLARITIES,
  DIAMOND_COLOURS,
  DIAMOND_METHODS,
  DIAMOND_SHAPES,
  DIAMOND_TYPES,
} from "./requirement-options";
import {
  type RequirementDiamond,
  type RequirementDraft,
} from "./requirement-form-types";
import { createEmptyDiamond } from "./requirement-form-utils";
import { NotesField, OptionTextField, SectionShell, TextField } from "./RequirementFields";

export function DiamondDetailsSection({
  value,
  onChange,
}: {
  value: RequirementDraft;
  onChange: (value: RequirementDraft) => void;
}) {
  function updateDiamond(id: string, patch: Partial<RequirementDiamond>) {
    onChange({
      ...value,
      diamonds: value.diamonds.map((diamond) =>
        diamond.id === id ? { ...diamond, ...patch } : diamond,
      ),
    });
  }

  function removeDiamond(id: string) {
    onChange({
      ...value,
      diamonds: value.diamonds.filter((diamond) => diamond.id !== id),
    });
  }

  return (
    <SectionShell eyebrow="Diamonds" title="Diamond details">
      <div className="space-y-3">
        {value.diamonds.length === 0 ? (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-border px-3 py-3">
            <p className="text-sm text-muted-foreground">No diamonds added.</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                onChange({
                  ...value,
                  diamonds: [createEmptyDiamond()],
                })
              }
            >
              <Plus className="size-3.5" />
              Add diamond
            </Button>
          </div>
        ) : null}
        {value.diamonds.map((diamond, index) => (
          <div
            key={diamond.id}
            className="rounded-lg border border-border bg-muted/15 p-3"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-xs font-semibold text-foreground">
                Diamond {index + 1}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => removeDiamond(diamond.id)}
                aria-label={`Remove diamond ${index + 1}`}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <OptionTextField
                label="Diamond type"
                value={diamond.type}
                options={DIAMOND_TYPES}
                onChange={(type) => updateDiamond(diamond.id, { type })}
              />
              <OptionTextField
                label="If LGD"
                value={diamond.growthMethod}
                options={DIAMOND_METHODS}
                onChange={(growthMethod) =>
                  updateDiamond(diamond.id, { growthMethod })
                }
              />
              <OptionTextField
                label="Shape"
                value={diamond.shape}
                options={DIAMOND_SHAPES}
                onChange={(shape) => updateDiamond(diamond.id, { shape })}
              />
              <OptionTextField
                label="Clarity"
                value={diamond.clarity}
                options={DIAMOND_CLARITIES}
                onChange={(clarity) => updateDiamond(diamond.id, { clarity })}
              />
              <OptionTextField
                label="Colour"
                value={diamond.colour}
                options={DIAMOND_COLOURS}
                onChange={(colour) => updateDiamond(diamond.id, { colour })}
              />
              <TextField
                label="Size"
                value={diamond.size}
                placeholder="1.20 ct center, mix..."
                onChange={(size) => updateDiamond(diamond.id, { size })}
              />
              <TextField
                label="Pieces"
                value={diamond.pieces}
                placeholder="12"
                onChange={(pieces) => updateDiamond(diamond.id, { pieces })}
              />
              <TextField
                label="Diamond wt (in cts)"
                value={diamond.weight}
                placeholder="5.80..."
                onChange={(weight) => updateDiamond(diamond.id, { weight })}
              />
              <NotesField
                label="Diamond notes"
                value={diamond.notes}
                onChange={(notes) => updateDiamond(diamond.id, { notes })}
              />
            </div>
          </div>
        ))}
        {value.diamonds.length > 0 ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              onChange({
                ...value,
                diamonds: [...value.diamonds, createEmptyDiamond()],
              })
            }
          >
            <Plus className="size-3.5" />
            Add diamond
          </Button>
        ) : null}
      </div>
    </SectionShell>
  );
}
