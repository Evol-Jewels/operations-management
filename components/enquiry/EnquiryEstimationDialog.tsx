"use client";

import { Calculator, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { StoneTypeCombobox } from "@/components/stone-type-combobox";
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
  calculateMakingCharge,
  computeEstimateFromInputs,
  getStoneType,
  resolveAutoSlab,
} from "@/lib/calculator/pricing";
import { estimationStoneToCalculator } from "@/lib/enquiryEstimation";
import { formatCurrency } from "@/lib/utils";
import type {
  CalculatorFormState,
  CalculatorSettings,
  CalculatorStoneInput,
  MetalPurity,
  ProductEstimation,
} from "@/types";

type EstimationForm = Omit<CalculatorFormState, "purity"> & { purity: string };

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

function formatWeight(value: number) {
  return value.toFixed(3).replace(/\.?0+$/, "");
}

function buildInitialForm(
  settings: CalculatorSettings,
  productName: string,
  defaultPurity: MetalPurity,
  existingEstimation?: ProductEstimation,
): EstimationForm {
  const netGoldWeight = existingEstimation?.metalWeight ?? 0;

  return {
    netGoldWeight,
    purity: existingEstimation?.purity ?? defaultPurity,
    stones:
      existingEstimation && existingEstimation.stoneDetails.length > 0
        ? existingEstimation.stoneDetails.map((stone) =>
            estimationStoneToCalculator(stone, settings),
          )
        : [createStone(settings)],
    diamondColor: "",
    diamondClarity: "",
    gstRate: settings.gstRate,
    makingCharge:
      existingEstimation?.makingCost ??
      calculateMakingCharge(
        netGoldWeight,
        settings.makingChargeFlat,
        settings.makingChargePerGram,
      ),
    productName,
    productNote: "",
  };
}

interface EnquiryEstimationDialogProps {
  productId: string;
  productName: string;
  defaultPurity: MetalPurity;
  defaultMetalType?: string;
  defaultMetalPurity?: string;
  settings: CalculatorSettings;
  existingEstimation?: ProductEstimation;
  onSave: (estimation: ProductEstimation) => void;
  disabled?: boolean;
}

export function EnquiryEstimationDialog({
  productId,
  productName,
  defaultPurity,
  defaultMetalType = "Gold",
  defaultMetalPurity,
  settings,
  existingEstimation,
  onSave,
  disabled,
}: EnquiryEstimationDialogProps) {
  const [open, setOpen] = useState(false);
  const [metalTypeId, setMetalTypeId] = useState("gold");
  const selectedMetal = settings.metalTypes.find(
    (metal) => metal.id === metalTypeId,
  );

  const [form, setForm] = useState<EstimationForm>(() =>
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
    const metalName = existingEstimation?.metalType ?? defaultMetalType;
    const metal =
      settings.metalTypes.find(
        (item) =>
          item.id === metalName.toLowerCase() ||
          item.name.toLowerCase() === metalName.toLowerCase(),
      ) ?? settings.metalTypes[0];
    const requestedPurity =
      existingEstimation?.purity ?? defaultMetalPurity ?? defaultPurity;
    const purity =
      existingEstimation?.purity ??
      metal?.purities.find((item) => item.id === requestedPurity)?.id ??
      metal?.purities[0]?.id ??
      "";
    setMetalTypeId(metal?.id ?? "");
    setForm((current) => ({ ...current, purity }));
    setVendorName(existingEstimation?.vendorName ?? "");
    setNotes(existingEstimation?.notes ?? "");
    setMakingCost(existingEstimation?.makingCost ?? 0);
    setIsMakingCostEdited(false);
  }, [
    defaultPurity,
    defaultMetalType,
    defaultMetalPurity,
    existingEstimation,
    open,
    productName,
    settings,
  ]);

  const calculatedMakingCost = useMemo(
    () =>
      computeEstimateFromInputs(
        settings,
        form.netGoldWeight,
        "Other",
        form.stones,
      ).makingCost,
    [form.netGoldWeight, form.stones, settings],
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
        "Other",
        form.stones,
        {
          makingCostOverride: makingCost,
          metals: [
            {
              id: productId,
              metalTypeId,
              purityId: form.purity,
              weight: form.netGoldWeight,
            },
          ],
        },
      ),
    [
      form.netGoldWeight,
      form.purity,
      form.stones,
      makingCost,
      settings,
      productId,
      metalTypeId,
    ],
  );

  const canSave =
    Boolean(selectedMetal && form.purity) &&
    Number.isFinite(form.netGoldWeight) &&
    form.netGoldWeight >= 0 &&
    (form.netGoldWeight > 0 || form.stones.some((stone) => stone.weight > 0));

  function updateForm<K extends keyof EstimationForm>(
    key: K,
    value: EstimationForm[K],
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
      metalType: selectedMetal?.name,
      stoneDetails: breakdown.stoneDetails
        .filter((stone) => stone.weight > 0)
        .map((stone) => ({
          id: stone.id,
          type: stone.sourceStoneName || stone.stoneType?.name || "Stone",
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
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor={`metal-type-${productId}`}>Metal Type</Label>
                <Select
                  value={metalTypeId}
                  onValueChange={(id) => {
                    const purity =
                      settings.metalTypes.find((item) => item.id === id)
                        ?.purities[0]?.id ?? "";
                    setMetalTypeId(id);
                    updateForm("purity", purity);
                  }}
                >
                  <SelectTrigger
                    id={`metal-type-${productId}`}
                    className="w-full"
                  >
                    <SelectValue placeholder="Select metal" />
                  </SelectTrigger>
                  <SelectContent>
                    {settings.metalTypes.map((metal) => (
                      <SelectItem key={metal.id} value={metal.id}>
                        {metal.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`metal-purity-${productId}`}>Purity</Label>
                <Select
                  value={form.purity}
                  onValueChange={(purity) => {
                    updateForm("purity", purity);
                  }}
                >
                  <SelectTrigger
                    id={`metal-purity-${productId}`}
                    className="w-full"
                  >
                    <SelectValue placeholder="Select purity" />
                  </SelectTrigger>
                  <SelectContent>
                    {form.purity &&
                    !selectedMetal?.purities.some(
                      (purity) => purity.id === form.purity,
                    ) ? (
                      <SelectItem value={form.purity}>{form.purity}</SelectItem>
                    ) : null}
                    {selectedMetal?.purities.map((purity) => (
                      <SelectItem key={purity.id} value={purity.id}>
                        {purity.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                      <StoneTypeCombobox
                        options={settings.stoneTypes.map((item) => ({
                          value: item.stoneId,
                          label: item.name,
                          category: item.category,
                        }))}
                        value={stone.stoneTypeId}
                        customValue={
                          !stone.stoneTypeId ? stone.sourceStoneName : undefined
                        }
                        onCustomValueChange={(name) =>
                          updateStone(stone.id, {
                            stoneTypeId: "",
                            sourceStoneName: name,
                          })
                        }
                        onValueChange={(stoneTypeId) =>
                          updateStone(stone.id, {
                            stoneTypeId,
                            sourceStoneName: undefined,
                          })
                        }
                        placeholder="Select stone"
                        className="bg-background"
                      />
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
                        aria-label={`Stone ${index + 1} weight in carats`}
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
                        aria-label={`Stone ${index + 1} quantity`}
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
                {selectedMetal?.name ?? "Metal"} + making
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
