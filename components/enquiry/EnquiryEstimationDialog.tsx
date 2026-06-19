"use client";

import { Calculator, Diamond, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  calculateGoldRate,
  computeEstimateFromInputs,
  getStoneType,
  resolveAutoSlab,
} from "@/lib/calculator/pricing";
import { cn, formatCurrency } from "@/lib/utils";
import type {
  CalculatorFormState,
  CalculatorSettings,
  CalculatorStoneInput,
  MetalPurity,
  ProductEstimation,
} from "@/types";

const PURITY_OPTIONS: MetalPurity[] = ["24K", "22K", "18K", "14K"];

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

function createStone(settings: CalculatorSettings): CalculatorStoneInput {
  return {
    id: generateId(),
    stoneTypeId: settings.stoneTypes[0]?.stoneId ?? "",
    weight: 0,
    quantity: 1,
  };
}

function getStoneTypeIdByName(settings: CalculatorSettings, name: string) {
  const normalizedName = name.trim().toLowerCase();
  return (
    settings.stoneTypes.find(
      (stone) => stone.name.trim().toLowerCase() === normalizedName,
    )?.stoneId ??
    settings.stoneTypes[0]?.stoneId ??
    ""
  );
}

function formatWeight(value: number) {
  return value.toFixed(3).replace(/\.?0+$/, "");
}

function buildInitialForm(
  settings: CalculatorSettings,
  productName: string,
  defaultPurity: MetalPurity,
  existingEstimation?: ProductEstimation,
): CalculatorFormState {
  return {
    netGoldWeight: existingEstimation?.metalWeight ?? 0,
    purity: existingEstimation?.purity ?? defaultPurity,
    stones:
      existingEstimation && existingEstimation.stoneDetails.length > 0
        ? existingEstimation.stoneDetails.map((stone) => ({
            id: stone.id || generateId(),
            stoneTypeId: getStoneTypeIdByName(settings, stone.type),
            weight: stone.netWeight,
            quantity: stone.pieces,
          }))
        : [createStone(settings)],
    productName,
    productNote: "",
  };
}

interface EnquiryEstimationDialogProps {
  productId: string;
  productName: string;
  defaultPurity: MetalPurity;
  settings: CalculatorSettings;
  existingEstimation?: ProductEstimation;
  onSave: (estimation: ProductEstimation) => void;
  disabled?: boolean;
}

export function EnquiryEstimationDialog({
  productId,
  productName,
  defaultPurity,
  settings,
  existingEstimation,
  onSave,
  disabled,
}: EnquiryEstimationDialogProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CalculatorFormState>(() =>
    buildInitialForm(settings, productName, defaultPurity, existingEstimation),
  );
  const [vendorName, setVendorName] = useState(
    existingEstimation?.vendorName ?? "",
  );
  const [notes, setNotes] = useState(existingEstimation?.notes ?? "");
  const [makingCost, setMakingCost] = useState(
    existingEstimation?.makingCost ?? 0,
  );
  const [isMakingCostEdited, setIsMakingCostEdited] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(
      buildInitialForm(
        settings,
        productName,
        defaultPurity,
        existingEstimation,
      ),
    );
    setVendorName(existingEstimation?.vendorName ?? "");
    setNotes(existingEstimation?.notes ?? "");
    setMakingCost(existingEstimation?.makingCost ?? 0);
    setIsMakingCostEdited(false);
  }, [defaultPurity, existingEstimation, open, productName, settings]);

  const calculatedMakingCost = useMemo(
    () =>
      computeEstimateFromInputs(
        settings,
        form.netGoldWeight,
        form.purity,
        form.stones,
      ).makingCost,
    [form.netGoldWeight, form.purity, form.stones, settings],
  );

  useEffect(() => {
    if (!open || existingEstimation || isMakingCostEdited) return;
    setMakingCost(calculatedMakingCost);
  }, [calculatedMakingCost, existingEstimation, isMakingCostEdited, open]);

  const breakdown = useMemo(
    () =>
      computeEstimateFromInputs(
        settings,
        form.netGoldWeight,
        form.purity,
        form.stones,
        { makingCostOverride: makingCost },
      ),
    [form.netGoldWeight, form.purity, form.stones, makingCost, settings],
  );

  const canSave =
    form.netGoldWeight > 0 || form.stones.some((stone) => stone.weight > 0);

  function updateForm<K extends keyof CalculatorFormState>(
    key: K,
    value: CalculatorFormState[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateStone(stoneId: string, patch: Partial<CalculatorStoneInput>) {
    setForm((current) => ({
      ...current,
      stones: current.stones.map((stone) =>
        stone.id === stoneId ? { ...stone, ...patch } : stone,
      ),
    }));
  }

  function addStone() {
    setForm((current) => ({
      ...current,
      stones: [...current.stones, createStone(settings)],
    }));
  }

  function removeStone(stoneId: string) {
    setForm((current) => ({
      ...current,
      stones:
        current.stones.length === 1
          ? current.stones
          : current.stones.filter((stone) => stone.id !== stoneId),
    }));
  }

  function handleSave() {
    if (!canSave) return;

    onSave({
      id: existingEstimation?.id ?? `est-${Date.now()}`,
      productId,
      metalWeight: form.netGoldWeight,
      purity: form.purity,
      stoneDetails: breakdown.stoneDetails
        .filter((stone) => stone.weight > 0)
        .map((stone) => ({
          id: stone.id,
          type: stone.stoneType?.name ?? "Stone",
          netWeight: stone.weight,
          pieces: stone.quantity,
        })),
      finalAmount: Math.round(breakdown.total),
      makingCost,
      createdAt: existingEstimation?.createdAt ?? new Date().toISOString(),
      vendorName: vendorName.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={disabled}
        >
          <Calculator className="size-4" />
          {existingEstimation ? "Edit Estimation" : "Add Estimation"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {existingEstimation ? "Edit Estimation" : "Add Estimation"}
          </DialogTitle>
          <DialogDescription>{productName}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-5">
          <section className="grid gap-3">
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Metal
            </p>
            <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {PURITY_OPTIONS.map((purity) => {
                  const selected = form.purity === purity;
                  const rate = calculateGoldRate(
                    settings.goldRate24k,
                    purity,
                    settings.purityPercentages,
                  );

                  return (
                    <button
                      key={purity}
                      type="button"
                      onClick={() => updateForm("purity", purity)}
                      className={cn(
                        "min-h-12 rounded-lg border px-3 py-2 text-center text-sm transition-colors",
                        selected
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-background hover:border-foreground/30",
                      )}
                    >
                      <span className="font-semibold">{purity}</span>
                      <span
                        className={cn(
                          "mt-0.5 block text-[0.625rem]",
                          selected
                            ? "text-background/70"
                            : "text-muted-foreground",
                        )}
                      >
                        {formatCurrency(rate)}/g
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`metal-weight-${productId}`}>
                  Net Weight (g)
                </Label>
                <Input
                  id={`metal-weight-${productId}`}
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step={0.001}
                  value={form.netGoldWeight || ""}
                  onChange={(event) =>
                    updateForm("netGoldWeight", Number(event.target.value) || 0)
                  }
                  placeholder="0.000"
                />
              </div>
            </div>
          </section>

          <Separator />

          <section className="grid gap-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Stones
              </p>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={addStone}
              >
                <Plus className="size-3.5" />
                Add Stone
              </Button>
            </div>

            <div className="grid gap-3">
              {form.stones.map((stone, index) => {
                const stoneType = getStoneType(settings, stone.stoneTypeId);
                const resolvedSlab = resolveAutoSlab(
                  stoneType?.slabs ?? [],
                  stone.weight,
                  stone.quantity,
                );

                return (
                  <div
                    key={stone.id}
                    className="grid gap-3 rounded-lg border border-border bg-muted/20 p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          Stone {index + 1}
                        </p>
                        {resolvedSlab ? (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {formatWeight(resolvedSlab.fromWeight)}-
                            {formatWeight(resolvedSlab.toWeight)} ct slab ·{" "}
                            {formatCurrency(resolvedSlab.pricePerCarat)}/ct
                          </p>
                        ) : null}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeStone(stone.id)}
                        disabled={form.stones.length === 1}
                        aria-label={`Remove stone ${index + 1}`}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-[1fr_8rem_7rem]">
                      <Select
                        value={stone.stoneTypeId}
                        onValueChange={(stoneTypeId) =>
                          updateStone(stone.id, { stoneTypeId })
                        }
                      >
                        <SelectTrigger className="w-full bg-background">
                          <SelectValue placeholder="Select stone" />
                        </SelectTrigger>
                        <SelectContent>
                          {settings.stoneTypes.map((item) => (
                            <SelectItem key={item.stoneId} value={item.stoneId}>
                              <span className="flex items-center gap-2">
                                {item.category === "Diamond" ? (
                                  <Diamond className="size-3.5 text-muted-foreground" />
                                ) : (
                                  <span className="size-3 rounded-full bg-muted-foreground/40" />
                                )}
                                {item.name}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step={0.001}
                        value={stone.weight || ""}
                        onChange={(event) =>
                          updateStone(stone.id, {
                            weight: Number(event.target.value) || 0,
                          })
                        }
                        placeholder="ct"
                      />
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        step={1}
                        value={stone.quantity || ""}
                        onChange={(event) =>
                          updateStone(stone.id, {
                            quantity: Math.max(
                              1,
                              Number(event.target.value) || 1,
                            ),
                          })
                        }
                        placeholder="pcs"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="grid gap-3">
            <div className="grid gap-2 sm:max-w-48">
              <Label
                htmlFor={`making-cost-${productId}`}
                className="text-[0.6875rem] pb-2 font-semibold uppercase tracking-[0.22em] text-muted-foreground"
              >
                Making Charge
              </Label>
              <Input
                id={`making-cost-${productId}`}
                type="number"
                inputMode="decimal"
                min={0}
                step={0.01}
                value={makingCost || ""}
                onChange={(event) => {
                  setIsMakingCostEdited(true);
                  setMakingCost(Math.max(0, Number(event.target.value) || 0));
                }}
                placeholder="0.00"
              />
            </div>
          </section>

          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-sm font-medium text-muted-foreground">
                Gold + making
              </span>
              <span className="font-medium tabular-nums">
                {formatCurrency(breakdown.goldCost + breakdown.makingCost)}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-border py-3">
              <span className="text-sm font-medium text-muted-foreground">
                Stones
              </span>
              <span className="font-medium tabular-nums">
                {formatCurrency(breakdown.totalStoneCost)}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-border py-3">
              <span className="text-sm font-medium text-muted-foreground">
                GST ({(settings.gstRate * 100).toFixed(1)}%)
              </span>
              <span className="font-medium tabular-nums">
                {formatCurrency(breakdown.gst)}
              </span>
            </div>
            <div className="flex items-center justify-between pt-3">
              <span className="text-base font-semibold">Total</span>
              <span className="text-2xl font-semibold tabular-nums">
                {formatCurrency(Math.round(breakdown.total))}
              </span>
            </div>
          </div>

          <section className="grid gap-3">
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Other Details (optional)
            </p>
            <div className="grid gap-3 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] sm:items-start">
              <div className="grid gap-2">
                <Label htmlFor={`vendor-name-${productId}`}>Vendor Name</Label>
                <Input
                  id={`vendor-name-${productId}`}
                  value={vendorName}
                  onChange={(event) => setVendorName(event.target.value)}
                  placeholder="Enter vendor name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`estimation-notes-${productId}`}>Notes</Label>
                <Textarea
                  id={`estimation-notes-${productId}`}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Add estimation notes"
                  className="min-h-10 resize-none"
                />
              </div>
            </div>
          </section>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={!canSave}>
            Save Estimation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
