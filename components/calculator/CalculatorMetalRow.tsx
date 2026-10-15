"use client";

import { Trash2 } from "lucide-react";
import { NumericLineInput } from "@/components/calculator/CalculatorFields";
import { JewelryVisual } from "@/components/jewelry/JewelryVisual";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { resolveMetalRate } from "@/lib/calculator/pricing";
import { cn, formatCurrency } from "@/lib/utils";
import type { CalculatorMetalInput, CalculatorSettings } from "@/types";

const metalOptionStyles = {
  gold: {
    active:
      "border-amber-400/50 bg-amber-400/15 text-amber-950 shadow-xs dark:text-amber-200",
    inactive:
      "border-transparent text-muted-foreground hover:border-amber-400/25 hover:bg-amber-400/10 hover:text-foreground",
  },
  silver: {
    active:
      "border-zinc-400/60 bg-zinc-200 text-zinc-950 shadow-xs dark:border-zinc-300/40 dark:bg-zinc-200/15 dark:text-zinc-100",
    inactive:
      "border-transparent text-muted-foreground hover:border-zinc-400/30 hover:bg-zinc-400/10 hover:text-foreground",
  },
  platinum: {
    active:
      "border-sky-400/50 bg-sky-400/15 text-sky-950 shadow-xs dark:text-sky-200",
    inactive:
      "border-transparent text-muted-foreground hover:border-sky-400/25 hover:bg-sky-400/10 hover:text-foreground",
  },
} as const;

function getMetalOptionStyle(metalTypeId: string) {
  return metalOptionStyles[metalTypeId as keyof typeof metalOptionStyles];
}

export function MetalRow({
  settings,
  metal,
  index,
  canRemove,
  onChange,
  onRemove,
}: {
  settings: CalculatorSettings;
  metal: CalculatorMetalInput;
  index: number;
  canRemove: boolean;
  onChange: (patch: Partial<CalculatorMetalInput>) => void;
  onRemove: () => void;
}) {
  const metalType =
    settings.metalTypes.find((item) => item.id === metal.metalTypeId) ??
    settings.metalTypes[0];
  const rate = metal.rateOverride ?? resolveMetalRate(settings, metal);

  return (
    <div className="space-y-2.5 rounded-xl border border-border bg-muted/10 p-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Metal {index + 1}
        </p>
        <div className="flex items-start gap-1.5">
          <div className="text-right">
            <p className="text-sm font-semibold leading-none tabular">
              {formatCurrency(metal.weight * rate)}
            </p>
            <p className="mt-1 text-[11px] leading-none text-muted-foreground tabular">
              {formatCurrency(rate)}/g
              {metal.rateOverride !== undefined ? " / custom" : ""}
            </p>
          </div>
          {canRemove ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="-mr-1 -mt-2 size-9"
              onClick={onRemove}
              aria-label={`Remove metal ${index + 1}`}
            >
              <Trash2 className="size-4" />
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid w-full grid-cols-3 gap-1.5 rounded-lg bg-muted/60 p-1.5 sm:w-fit">
        {settings.metalTypes.map((option) => {
          const style = getMetalOptionStyle(option.id);
          const isActive = option.id === metal.metalTypeId;

          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={isActive}
              onClick={() =>
                onChange({
                  metalTypeId: option.id,
                  purityId: option.purities[0]?.id ?? "",
                  rateOverride: undefined,
                })
              }
              className={cn(
                "flex h-9 min-w-0 cursor-pointer items-center justify-center gap-1.5 rounded-md border px-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-w-24 sm:gap-2 sm:px-3",
                isActive
                  ? (style?.active ??
                      "border-border bg-background text-foreground shadow-xs")
                  : (style?.inactive ??
                      "border-transparent text-muted-foreground hover:border-border hover:bg-background/70 hover:text-foreground"),
              )}
            >
              <JewelryVisual
                kind="metal"
                value={option.name}
                className="size-4"
              />
              {option.name}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 items-end gap-3 min-[430px]:grid-cols-2 min-[430px]:gap-4">
        <div className="space-y-1.5">
          <label
            htmlFor={`calculator-metal-purity-${metal.id}`}
            className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
          >
            Purity
          </label>
          <Select
            value={metal.purityId}
            onValueChange={(purityId) =>
              onChange({ purityId, rateOverride: undefined })
            }
          >
            <SelectTrigger
              id={`calculator-metal-purity-${metal.id}`}
              className="w-full bg-background px-3 font-semibold uppercase shadow-none"
            >
              <SelectValue placeholder="Select purity" />
            </SelectTrigger>
            <SelectContent position="popper" align="start">
              {metal.purityId &&
              !metalType?.purities.some(
                (option) => option.id === metal.purityId,
              ) ? (
                <SelectItem value={metal.purityId}>{metal.purityId}</SelectItem>
              ) : null}
              {metalType?.purities.map((option) => (
                <SelectItem
                  key={option.id}
                  value={option.id}
                  className="font-medium"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Net weight
          </p>
          <NumericLineInput
            value={metal.weight}
            onChange={(weight) => onChange({ weight })}
            placeholder="0.000"
            suffix="g"
            ariaLabel={`Metal ${index + 1} net weight in grams`}
          />
        </div>
      </div>
    </div>
  );
}
