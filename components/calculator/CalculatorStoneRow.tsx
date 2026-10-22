"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import {
  fieldLabelClassName,
  formatWeight,
  NumericLineInput,
} from "@/components/calculator/CalculatorFields";
import { StoneTypeCombobox as SharedStoneTypeCombobox } from "@/components/stone-type-combobox";
import { Button } from "@/components/ui/button";
import { getStoneType, resolveAutoSlab } from "@/lib/calculator/pricing";
import { normalizeDiamondClarity } from "@/lib/diamondClarity";
import { formatCurrency } from "@/lib/utils";
import type { CalculatorSettings, CalculatorStoneInput } from "@/types";

const PRIORITY_STONE_NAMES = [
  "ROUND",
  "OVAL",
  "MARQUISE",
  "EMERALD",
  "PEAR",
  "CUSHION",
  "RADIANT",
  "PRINCESS",
] as const;

function stoneNameContains(name: string, expectedName: string): boolean {
  const nameParts = name
    .trim()
    .toUpperCase()
    .split(/[^A-Z]+/)
    .filter(Boolean);

  return nameParts.includes(expectedName);
}

function compareStoneTypesBySlabs(
  a: CalculatorSettings["stoneTypes"][number],
  b: CalculatorSettings["stoneTypes"][number],
): number {
  return (
    b.slabs.length - a.slabs.length ||
    a.category.localeCompare(b.category) ||
    a.name.localeCompare(b.name)
  );
}

function StoneTypeCombobox({
  stoneTypes,
  value,
  customValue,
  onCustomValueChange,
  onChange,
}: {
  stoneTypes: CalculatorSettings["stoneTypes"];
  value: string;
  onChange: (stoneTypeId: string) => void;
  customValue?: string;
  onCustomValueChange: (name: string) => void;
}) {
  const priorityStoneTypes: CalculatorSettings["stoneTypes"] = [];
  const priorityStoneIds = new Set<string>();

  for (const priorityName of PRIORITY_STONE_NAMES) {
    const priorityStone = stoneTypes
      .filter(
        (stone) =>
          !priorityStoneIds.has(stone.stoneId) &&
          stoneNameContains(stone.name, priorityName),
      )
      .sort(compareStoneTypesBySlabs)[0];

    if (priorityStone) {
      priorityStoneTypes.push(priorityStone);
      priorityStoneIds.add(priorityStone.stoneId);
    }
  }

  const remainingStoneTypes = stoneTypes
    .filter((stone) => !priorityStoneIds.has(stone.stoneId))
    .sort(compareStoneTypesBySlabs);
  const sortedStoneTypes = [...priorityStoneTypes, ...remainingStoneTypes];

  return (
    <SharedStoneTypeCombobox
      options={sortedStoneTypes.map((item) => ({
        value: item.stoneId,
        label: item.name,
        category: item.category,
        metadata: `${item.category} · ${item.slabs.length} slabs`,
        searchText: [normalizeDiamondClarity(item.clarity), item.color]
          .filter(Boolean)
          .join(" "),
      }))}
      value={value}
      onValueChange={onChange}
      customValue={customValue}
      onCustomValueChange={onCustomValueChange}
      showMetadata
      className="h-10 border-0 border-b bg-transparent px-0 shadow-none hover:bg-transparent md:h-9"
    />
  );
}

export function StoneRow({
  settings,
  stone,
  index,
  canRemove,
  onChange,
  onRemove,
  allowRateEditing = true,
}: {
  settings: CalculatorSettings;
  stone: CalculatorStoneInput;
  index: number;
  canRemove: boolean;
  onChange: (patch: Partial<CalculatorStoneInput>) => void;
  onRemove: () => void;
  allowRateEditing?: boolean;
}) {
  const stoneType = getStoneType(settings, stone.stoneTypeId);
  const resolvedSlab = resolveAutoSlab(
    stoneType?.slabs ?? [],
    stone.weight,
    stone.quantity,
  );
  const hasFixedRate = stone.fixedRatePerCarat !== undefined;
  const hasUnmatchedWeight = stone.weight > 0 && !resolvedSlab && !hasFixedRate;
  const ratePerCarat =
    stone.fixedRatePerCarat ?? resolvedSlab?.pricePerCarat ?? 0;
  const stoneTotal = ratePerCarat * stone.weight;
  const priceValue = hasFixedRate
    ? stone.fixedRatePerCarat || ""
    : resolvedSlab?.pricePerCarat || "";

  function updatePricePerCarat(value: string) {
    onChange({
      fixedRatePerCarat: value.trim()
        ? Math.max(0, Number(value) || 0)
        : undefined,
    });
  }

  function updatePieces(quantity: number) {
    onChange({ quantity: Math.max(0, quantity) });
  }

  function updatePiecesInput(value: string) {
    const digits = value.replace(/\D/g, "");
    updatePieces(digits ? Number(digits) : 0);
  }

  return (
    <div className="space-y-2.5 rounded-xl border border-border bg-muted/10 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <p className="text-xs font-semibold text-muted-foreground">
            Stone {index + 1}
          </p>
          {resolvedSlab ? (
            <span className="text-[11px] text-muted-foreground">
              {formatWeight(resolvedSlab.fromWeight)}-
              {formatWeight(resolvedSlab.toWeight)} ct
            </span>
          ) : hasFixedRate ? (
            <span className="text-[11px] text-muted-foreground">
              Manual rate
            </span>
          ) : null}
        </div>
        <div className="flex shrink-0 items-start gap-1.5">
          <div className="text-right">
            <p className="text-sm font-semibold leading-none tabular">
              {formatCurrency(stoneTotal)}
            </p>
            <p className="mt-1 text-[11px] leading-none text-muted-foreground tabular">
              {formatCurrency(ratePerCarat)}/ct
              {hasFixedRate ? " / custom" : ""}
            </p>
          </div>
          {canRemove ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="-mr-1 -mt-2 size-9"
              onClick={onRemove}
              aria-label={`Remove stone ${index + 1}`}
            >
              <Trash2 className="size-4" />
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-2 items-end gap-3 sm:gap-4">
        <div className="space-y-1.5">
          <p className={fieldLabelClassName}>Stone type</p>
          <StoneTypeCombobox
            stoneTypes={settings.stoneTypes}
            value={stone.stoneTypeId}
            customValue={!stone.stoneTypeId ? stone.sourceStoneName : undefined}
            onCustomValueChange={(sourceStoneName) =>
              onChange({
                stoneTypeId: "",
                sourceStoneName,
                fixedRatePerCarat: undefined,
              })
            }
            onChange={(stoneTypeId) =>
              onChange({
                stoneTypeId,
                fixedRatePerCarat: undefined,
                sourceStoneName: undefined,
              })
            }
          />
        </div>
        <div className="space-y-1.5">
          <p className={fieldLabelClassName}>Weight</p>
          <NumericLineInput
            value={stone.weight}
            onChange={(weight) => onChange({ weight })}
            placeholder="0.000"
            suffix="ct"
            ariaLabel={`Stone ${index + 1} weight in carats`}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 items-end gap-3 sm:gap-4">
        <div className="space-y-1.5">
          <p className={fieldLabelClassName}>Pieces</p>
          <div className="grid h-10 grid-cols-[2.5rem_minmax(0,1fr)_2.5rem] items-end gap-1.5 md:h-9 md:grid-cols-[2rem_minmax(0,1fr)_2rem] md:gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-10 rounded-md md:size-8"
              onClick={() => updatePieces(Math.max(0, stone.quantity - 1))}
              aria-label={`Decrease pieces for stone ${index + 1}`}
            >
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <input
              type="text"
              inputMode="numeric"
              value={stone.quantity || ""}
              onChange={(event) => updatePiecesInput(event.target.value)}
              placeholder="0"
              aria-label={`Stone ${index + 1} pieces`}
              className="h-10 min-w-0 border-b border-border bg-transparent px-0 text-center text-base outline-none md:h-8 md:text-sm placeholder:text-muted-foreground/35 focus:border-foreground"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-10 rounded-md md:size-8"
              onClick={() => updatePieces(stone.quantity + 1)}
              aria-label={`Increase pieces for stone ${index + 1}`}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <div className="space-y-1.5">
          <p className={fieldLabelClassName}>Price / carat</p>
          <div className="flex h-10 items-end gap-2 border-b border-border pb-1.5 focus-within:border-foreground md:h-9">
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step={1}
              value={priceValue}
              readOnly={!allowRateEditing}
              aria-label={`Stone ${index + 1} price per carat`}
              title={
                !allowRateEditing ? "Rate from calculator settings" : undefined
              }
              onChange={(event) => updatePricePerCarat(event.target.value)}
              onFocus={(event) => event.target.select()}
              placeholder={hasUnmatchedWeight ? "Enter rate" : "Auto"}
              className="min-w-0 flex-1 bg-transparent px-0 text-base outline-none placeholder:text-muted-foreground/35 md:text-sm"
            />
            <span className="shrink-0 pb-0.5 text-sm text-muted-foreground">
              /ct
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
