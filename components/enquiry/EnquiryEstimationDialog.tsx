"use client";

import { Calculator, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  NumericLineInput,
  SectionLabel,
} from "@/components/calculator/CalculatorFields";
import { MetalRow } from "@/components/calculator/CalculatorMetalRow";
import { StoneRow } from "@/components/calculator/CalculatorStoneRow";
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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useVendorAccess } from "@/hooks/useVendors";
import { calculateMakingCharge } from "@/lib/calculator/pricing";
import {
  buildEnquiryCalculatorForm,
  createEnquiryCalculatorStone,
  enquiryCalculatorToEstimation,
} from "@/lib/enquiryCalculator";
import { computeEnquiryEstimate } from "@/lib/enquiryEstimation";
import type {
  CalculatorMetalInput,
  CalculatorSettings,
  CalculatorStoneInput,
  MetalPurity,
  ProductEstimation,
} from "@/types";

interface EnquiryEstimationDialogProps {
  productId: string;
  productName: string;
  defaultPurity: MetalPurity;
  defaultMetalType?: string;
  defaultMetalPurity?: string;
  imageUrls?: string[];
  settings: CalculatorSettings;
  existingEstimation?: ProductEstimation;
  onSave: (estimation: ProductEstimation) => void | Promise<void>;
  disabled?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function EnquiryEstimationDialog(props: EnquiryEstimationDialogProps) {
  const [localOpen, setLocalOpen] = useState(false);
  const open = props.open ?? localOpen;
  const setOpen = props.onOpenChange ?? setLocalOpen;
  const [saving, setSaving] = useState(false);
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!saving) setOpen(nextOpen);
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-2 text-xs"
          disabled={props.disabled}
        >
          <Calculator className="size-4" />
          {props.existingEstimation ? "Edit Estimation" : "Add Estimation"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto p-4 sm:max-w-2xl sm:p-6">
        <DialogHeader className="pr-6 text-left">
          <DialogTitle>
            {props.existingEstimation ? "Calculator" : "Add Estimation"}
          </DialogTitle>
          <DialogDescription>{props.productName}</DialogDescription>
        </DialogHeader>
        {open ? (
          <EnquiryCalculatorEditor
            {...props}
            disabled={props.disabled || saving}
            isSaving={saving}
            onCancel={() => setOpen(false)}
            onSave={async (estimation) => {
              setSaving(true);
              try {
                await props.onSave(estimation);
                setOpen(false);
              } catch (error) {
                toast.error(
                  error instanceof Error
                    ? error.message
                    : "Could not save the estimation. Try again.",
                );
              } finally {
                setSaving(false);
              }
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function EnquiryCalculatorEditor({
  productId,
  productName,
  defaultPurity,
  defaultMetalType = "Gold",
  defaultMetalPurity,
  imageUrls,
  settings,
  existingEstimation,
  onSave,
  onCancel,
  disabled,
  isSaving,
}: EnquiryEstimationDialogProps & { onCancel: () => void; isSaving: boolean }) {
  const canManageVendor = useVendorAccess();
  const [identity] = useState(() => ({
    id: existingEstimation?.id ?? `est-${crypto.randomUUID()}`,
    createdAt: existingEstimation?.createdAt ?? new Date().toISOString(),
  }));
  const [draft, setDraft] = useState(() =>
    buildEnquiryCalculatorForm({
      settings,
      productId,
      productName,
      metalType: defaultMetalType,
      purity: defaultMetalPurity ?? defaultPurity,
      imageUrls,
      estimation: existingEstimation,
    }),
  );
  const [makingOverride, setMakingOverride] = useState(
    existingEstimation?.makingCost,
  );
  const [vendorName, setVendorName] = useState(
    existingEstimation?.vendorName ?? "",
  );
  const [notes, setNotes] = useState(existingEstimation?.notes ?? "");
  const metal = draft.metals?.[0];
  const makingCharge =
    makingOverride ??
    calculateMakingCharge(
      metal?.weight ?? 0,
      settings.makingChargeFlat,
      settings.makingChargePerGram,
    );
  const form = {
    ...draft,
    netGoldWeight: metal?.weight ?? 0,
    gstRate: settings.gstRate,
    makingCharge,
  };
  const estimation = enquiryCalculatorToEstimation({
    form,
    settings,
    productId,
    estimation: identity,
    vendorName: canManageVendor ? vendorName : undefined,
    notes,
  });
  const { unpricedItems } = computeEnquiryEstimate(estimation, settings);
  const hasWeight =
    form.netGoldWeight > 0 || form.stones.some((stone) => stone.weight > 0);
  const canSave =
    !disabled &&
    unpricedItems.length === 0 &&
    Boolean(
      metal?.purityId &&
        settings.metalTypes.some((item) => item.id === metal.metalTypeId),
    ) &&
    Number.isFinite(form.netGoldWeight) &&
    form.netGoldWeight >= 0 &&
    Number.isFinite(makingCharge) &&
    makingCharge >= 0 &&
    hasWeight &&
    form.stones.every(
      (stone) =>
        Number.isFinite(stone.weight) &&
        stone.weight >= 0 &&
        (stone.weight === 0 ||
          (Number.isInteger(stone.quantity) && stone.quantity > 0)),
    );

  function updateMetal(patch: Partial<CalculatorMetalInput>) {
    setDraft((current) => ({
      ...current,
      metals: current.metals?.map((item) => ({ ...item, ...patch })),
    }));
  }

  function updateStone(id: string, patch: Partial<CalculatorStoneInput>) {
    setDraft((current) => ({
      ...current,
      stones: current.stones.map((stone) =>
        stone.id === id ? { ...stone, ...patch } : stone,
      ),
    }));
  }

  return (
    <>
      <fieldset disabled={disabled} className="min-w-0">
        <div className="min-w-0 space-y-5">
          <section className="space-y-3">
            <SectionLabel title="Metal" />
            {metal ? (
              <MetalRow
                settings={settings}
                metal={metal}
                index={0}
                canRemove={false}
                onChange={updateMetal}
                onRemove={() => {}}
              />
            ) : null}
          </section>
          <Separator />
          <section className="space-y-3">
            <SectionLabel
              title="Stones"
              action={
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-9 gap-1.5 px-2.5"
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      stones: [
                        ...current.stones,
                        createEnquiryCalculatorStone(settings),
                      ],
                    }))
                  }
                >
                  <Plus className="size-3.5" />
                  Add stone
                </Button>
              }
            />
            <div className="space-y-3">
              {form.stones.map((stone, index) => (
                <StoneRow
                  key={stone.id}
                  settings={settings}
                  stone={stone}
                  index={index}
                  canRemove={form.stones.length > 1}
                  allowRateEditing={false}
                  onChange={(patch) => updateStone(stone.id, patch)}
                  onRemove={() =>
                    setDraft((current) => ({
                      ...current,
                      stones: current.stones.filter(
                        (item) => item.id !== stone.id,
                      ),
                    }))
                  }
                />
              ))}
            </div>
          </section>
          <Separator />
          <section className="space-y-3">
            <SectionLabel title="Making charges" />
            <div className="max-w-48">
              <NumericLineInput
                value={makingCharge}
                onChange={setMakingOverride}
                placeholder="0"
                suffix="Rs."
                step={1}
                ariaLabel="Making charges"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Metal and stone rates use calculator settings.
            </p>
          </section>
          <Separator />
          <section className="space-y-3">
            <SectionLabel title="Internal details (optional)" />
            {canManageVendor ? (
              <div className="grid gap-2">
                <Label htmlFor={`vendor-${productId}`}>Vendor name</Label>
                <Input
                  id={`vendor-${productId}`}
                  value={vendorName}
                  onChange={(event) => setVendorName(event.target.value)}
                  placeholder="Enter vendor name"
                />
              </div>
            ) : null}
            <div className="grid gap-2">
              <Label htmlFor={`notes-${productId}`}>Notes</Label>
              <Textarea
                id={`notes-${productId}`}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Add internal estimation notes"
              />
            </div>
          </section>
        </div>
        {hasWeight && unpricedItems.length > 0 ? (
          <p role="alert" className="mt-4 text-sm text-destructive">
            Pricing is incomplete: {unpricedItems.join(", ")}. Check the weights
            and configured rates before saving.
          </p>
        ) : null}
      </fieldset>
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button
          type="button"
          disabled={!canSave}
          onClick={() => onSave(estimation)}
        >
          {isSaving ? "Saving…" : "Save Estimation"}
        </Button>
      </DialogFooter>
    </>
  );
}
