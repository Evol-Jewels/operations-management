"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  COLOR_STONE_NATURES,
  COLOR_STONE_ORIGINS,
  COLOR_STONE_TREATMENTS,
  COLOR_STONE_TYPES,
  DIAMOND_SHAPES,
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
      colorStones:
        value.colorStones.length > 1
          ? value.colorStones.filter((stone) => stone.id !== id)
          : value.colorStones,
    });
  }

  return (
    <SectionShell eyebrow="Color Stones" title="Colour stone details">
      <div className="space-y-3">
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
                disabled={value.colorStones.length === 1}
                aria-label={`Remove colour stone ${index + 1}`}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <OptionTextField
                label="Color stone type"
                value={stone.stoneType}
                options={COLOR_STONE_TYPES}
                onChange={(stoneType) => updateStone(stone.id, { stoneType })}
              />
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
              <OptionTextField
                label="Shape"
                value={stone.shape}
                options={DIAMOND_SHAPES}
                onChange={(shape) => updateStone(stone.id, { shape })}
              />
              <TextField
                label="Colour"
                value={stone.colour}
                placeholder="Green, blue..."
                onChange={(colour) => updateStone(stone.id, { colour })}
              />
              <TextField
                label="Size"
                value={stone.size}
                placeholder="2 mm, calibrated..."
                onChange={(size) => updateStone(stone.id, { size })}
              />
              <TextField
                label="Pieces"
                value={stone.pieces}
                placeholder="10"
                onChange={(pieces) => updateStone(stone.id, { pieces })}
              />
              <TextField
                label="Color stone wt"
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
      </div>
    </SectionShell>
  );
}
