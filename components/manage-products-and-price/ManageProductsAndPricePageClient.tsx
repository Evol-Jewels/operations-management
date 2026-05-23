"use client";

import {
  ArrowLeft,
  CircleDollarSign,
  Layers3,
  Pencil,
  Percent,
  Plus,
  ReceiptText,
  Trash2,
} from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { formatCurrency } from "@/lib/utils";
import type {
  CalculatorSettings,
  CalculatorStoneSlab,
  CalculatorStoneType,
  MetalPurity,
} from "@/types";
import { MOCK_PRICING_SETTINGS } from "./mockPricingData";

type ManageSection = "overview" | "metals" | "stones-slabs" | "misc";
type StoneDialogMode = "add" | "edit";

type StoneDraft = {
  stoneId: string;
  name: string;
  category: CalculatorStoneType["category"];
  clarity: string;
  color: string;
};

type SlabDraft = {
  code: string;
  fromWeight: number;
  toWeight: number;
  pricePerCarat: number;
};

const GOLD_PURITIES: MetalPurity[] = ["24K", "22K", "18K", "14K"];

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

function toNumber(value: string) {
  return Number(value) || 0;
}

function SectionShell({
  icon,
  title,
  description,
  onBack,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  onBack: () => void;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5">
      <div className="shrink-0 space-y-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-2 px-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to categories
        </Button>

        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-card">
            {icon}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              {title}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
    </div>
  );
}

function FieldBlock({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div>
        <Label className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </Label>
        {description ? (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function NumberInput({
  value,
  onChange,
  step = "0.001",
}: {
  value: number;
  onChange: (value: number) => void;
  step?: string;
}) {
  return (
    <Input
      type="number"
      inputMode="decimal"
      step={step}
      value={value}
      onChange={(event) => onChange(toNumber(event.target.value))}
      className="h-10 rounded-none border-0 border-b bg-transparent px-0 shadow-none focus-visible:ring-0"
    />
  );
}

function OverviewCard({
  icon,
  title,
  description,
  meta,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  meta: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-h-36 cursor-pointer flex-col rounded-2xl border border-border bg-card p-5 text-left shadow-sm outline-none transition-colors hover:border-foreground/30 hover:bg-muted/20 focus-visible:ring-2 focus-visible:ring-ring/40"
    >
      <div className="flex items-start gap-4">
        <div className="mt-0.5 text-foreground">{icon}</div>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <p className="mt-2 text-sm leading-5 text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
      <span className="mt-auto pt-5 text-xs font-medium text-muted-foreground transition-colors group-hover:text-foreground">
        {meta}
      </span>
    </button>
  );
}

function Overview({
  settings,
  onSelect,
}: {
  settings: CalculatorSettings;
  onSelect: (section: ManageSection) => void;
}) {
  const slabCount = settings.stoneTypes.reduce(
    (sum, stone) => sum + stone.slabs.length,
    0,
  );

  return (
    <div className="space-y-6 overflow-y-auto pr-1">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Manage Products & Pricing
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Update mock pricing values for metals, stones, slabs, making charges,
          and GST.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <OverviewCard
          icon={<CircleDollarSign className="h-5 w-5" />}
          title="Metals"
          description="Gold base rate and purity percentages."
          meta={`${formatCurrency(settings.goldRate24k)}/g base`}
          onClick={() => onSelect("metals")}
        />
        <OverviewCard
          icon={<Layers3 className="h-5 w-5" />}
          title="Stones & Slabs"
          description="Manage stone metadata and per-carat slab pricing."
          meta={`${settings.stoneTypes.length} stones, ${slabCount} slabs`}
          onClick={() => onSelect("stones-slabs")}
        />
        <OverviewCard
          icon={<ReceiptText className="h-5 w-5" />}
          title="Miscellaneous"
          description="GST and making cost rules."
          meta={`${settings.gstRate * 100}% GST`}
          onClick={() => onSelect("misc")}
        />
      </div>
    </div>
  );
}

function MetalsEditor({
  settings,
  onChange,
  onBack,
}: {
  settings: CalculatorSettings;
  onChange: (settings: CalculatorSettings) => void;
  onBack: () => void;
}) {
  const rates = useMemo(
    () =>
      GOLD_PURITIES.map((purity) => {
        const percentage = settings.purityPercentages[purity] ?? 100;
        return {
          purity,
          percentage,
          rate: Math.round(settings.goldRate24k * (percentage / 100)),
        };
      }),
    [settings.goldRate24k, settings.purityPercentages],
  );

  function updatePurity(purity: MetalPurity, value: number) {
    onChange({
      ...settings,
      purityPercentages: {
        ...settings.purityPercentages,
        [purity]: value,
      },
    });
  }

  return (
    <SectionShell
      icon={<CircleDollarSign className="h-5 w-5" />}
      title="Metals"
      description="Manage the 24K base rate and purity percentages used in estimates."
      onBack={onBack}
    >
      <Card className="h-full overflow-hidden py-0">
        <CardContent className="h-full space-y-6 overflow-y-auto p-6">
          <FieldBlock
            label="24K gold rate"
            description="Base metal rate per gram."
          >
            <div className="flex items-end gap-3">
              <NumberInput
                value={settings.goldRate24k}
                onChange={(goldRate24k) =>
                  onChange({ ...settings, goldRate24k })
                }
              />
              <span className="pb-2 text-sm text-muted-foreground">INR/g</span>
            </div>
          </FieldBlock>

          <Separator />

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Purity percentages
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              {rates.map((item) => (
                <div
                  key={item.purity}
                  className="rounded-xl border border-border bg-muted/20 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">
                        {item.purity}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatCurrency(item.rate)}/g
                      </p>
                    </div>
                    <div className="flex w-28 items-end gap-2">
                      <NumberInput
                        value={item.percentage}
                        step="0.1"
                        onChange={(value) => updatePurity(item.purity, value)}
                      />
                      <Percent className="mb-2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </SectionShell>
  );
}

function StoneDialog({
  mode,
  draft,
  onDraftChange,
  onOpenChange,
  onSubmit,
}: {
  mode: StoneDialogMode | null;
  draft: StoneDraft | null;
  onDraftChange: (draft: StoneDraft) => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
}) {
  const open = !!mode && !!draft;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit Stone" : "Add Stone"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Update stone details without changing its slabs."
              : "Create a stone type for slab pricing."}
          </DialogDescription>
        </DialogHeader>

        {draft ? (
          <div className="grid gap-5 py-2 md:grid-cols-2">
            <FieldBlock label="Name">
              <Input
                value={draft.name}
                onChange={(event) =>
                  onDraftChange({ ...draft, name: event.target.value })
                }
                className="h-10 rounded-none border-0 border-b bg-transparent px-0 shadow-none focus-visible:ring-0"
              />
            </FieldBlock>
            <FieldBlock label="Stone ID">
              <Input
                value={draft.stoneId}
                onChange={(event) =>
                  onDraftChange({ ...draft, stoneId: event.target.value })
                }
                className="h-10 rounded-none border-0 border-b bg-transparent px-0 shadow-none focus-visible:ring-0"
              />
            </FieldBlock>
            <FieldBlock label="Category">
              <Select
                value={draft.category}
                onValueChange={(value) =>
                  onDraftChange({
                    ...draft,
                    category: value as CalculatorStoneType["category"],
                  })
                }
              >
                <SelectTrigger className="h-10 rounded-none border-0 border-b bg-transparent px-0 shadow-none focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Diamond">Diamond</SelectItem>
                  <SelectItem value="Gemstone">Gemstone</SelectItem>
                </SelectContent>
              </Select>
            </FieldBlock>
            <FieldBlock label="Clarity">
              <Input
                value={draft.clarity}
                onChange={(event) =>
                  onDraftChange({ ...draft, clarity: event.target.value })
                }
                className="h-10 rounded-none border-0 border-b bg-transparent px-0 shadow-none focus-visible:ring-0"
              />
            </FieldBlock>
            <FieldBlock label="Color">
              <Input
                value={draft.color}
                onChange={(event) =>
                  onDraftChange({ ...draft, color: event.target.value })
                }
                className="h-10 rounded-none border-0 border-b bg-transparent px-0 shadow-none focus-visible:ring-0"
              />
            </FieldBlock>
          </div>
        ) : null}

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" onClick={onSubmit}>
            {mode === "edit" ? "Save Changes" : "Add Stone"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SlabDialog({
  open,
  draft,
  onDraftChange,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  draft: SlabDraft;
  onDraftChange: (draft: SlabDraft) => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Slab</DialogTitle>
          <DialogDescription>
            Create a pricing range for the selected stone.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-2 md:grid-cols-2">
          <FieldBlock label="Code">
            <Input
              value={draft.code}
              onChange={(event) =>
                onDraftChange({ ...draft, code: event.target.value })
              }
              className="h-10 rounded-none border-0 border-b bg-transparent px-0 shadow-none focus-visible:ring-0"
            />
          </FieldBlock>
          <FieldBlock label="From ct">
            <NumberInput
              value={draft.fromWeight}
              step="0.0001"
              onChange={(fromWeight) => onDraftChange({ ...draft, fromWeight })}
            />
          </FieldBlock>
          <FieldBlock label="To ct">
            <NumberInput
              value={draft.toWeight}
              step="0.0001"
              onChange={(toWeight) => onDraftChange({ ...draft, toWeight })}
            />
          </FieldBlock>
          <FieldBlock label="Price / ct">
            <NumberInput
              value={draft.pricePerCarat}
              onChange={(pricePerCarat) =>
                onDraftChange({ ...draft, pricePerCarat })
              }
            />
          </FieldBlock>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" onClick={onSubmit}>
            Add Slab
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StonesAndSlabsEditor({
  settings,
  onChange,
  onBack,
}: {
  settings: CalculatorSettings;
  onChange: (settings: CalculatorSettings) => void;
  onBack: () => void;
}) {
  const [selectedStoneId, setSelectedStoneId] = useState<string | null>(
    settings.stoneTypes[0]?.stoneId ?? null,
  );
  const [stoneToDelete, setStoneToDelete] = useState<string | null>(null);
  const [stoneDialogMode, setStoneDialogMode] =
    useState<StoneDialogMode | null>(null);
  const [editingStoneOriginalId, setEditingStoneOriginalId] = useState<
    string | null
  >(null);
  const [stoneDraft, setStoneDraft] = useState<StoneDraft | null>(null);
  const [slabDialogOpen, setSlabDialogOpen] = useState(false);
  const [slabDraft, setSlabDraft] = useState<SlabDraft>({
    code: "",
    fromWeight: 0,
    toWeight: 0,
    pricePerCarat: 0,
  });
  const selectedStone =
    settings.stoneTypes.find((stone) => stone.stoneId === selectedStoneId) ??
    settings.stoneTypes[0] ??
    null;

  function setStoneTypes(stoneTypes: CalculatorStoneType[]) {
    onChange({ ...settings, stoneTypes });
  }

  function closeStoneDialog() {
    setStoneDialogMode(null);
    setEditingStoneOriginalId(null);
    setStoneDraft(null);
  }

  function openAddStoneDialog() {
    setEditingStoneOriginalId(null);
    setStoneDraft({
      stoneId: `stone-${generateId()}`,
      name: "",
      category: "Diamond",
      clarity: "",
      color: "",
    });
    setStoneDialogMode("add");
  }

  function openEditStoneDialog(stone: CalculatorStoneType) {
    setSelectedStoneId(stone.stoneId);
    setEditingStoneOriginalId(stone.stoneId);
    setStoneDraft({
      stoneId: stone.stoneId,
      name: stone.name,
      category: stone.category,
      clarity: stone.clarity ?? "",
      color: stone.color ?? "",
    });
    setStoneDialogMode("edit");
  }

  function validateStoneDraft() {
    if (!stoneDraft) return false;
    const name = stoneDraft.name.trim();
    const stoneId = stoneDraft.stoneId.trim();

    if (!name) {
      toast.error("Stone name is required.");
      return false;
    }
    if (!stoneId) {
      toast.error("Stone ID is required.");
      return false;
    }

    const duplicate = settings.stoneTypes.some(
      (stone) =>
        stone.stoneId === stoneId &&
        (stoneDialogMode === "add" || stone.stoneId !== editingStoneOriginalId),
    );

    if (duplicate) {
      toast.error("Stone ID already exists.");
      return false;
    }

    return true;
  }

  function submitStoneDialog() {
    if (!stoneDraft || !stoneDialogMode || !validateStoneDraft()) return;

    const normalizedDraft = {
      stoneId: stoneDraft.stoneId.trim(),
      name: stoneDraft.name.trim(),
      category: stoneDraft.category,
      clarity: stoneDraft.clarity.trim(),
      color: stoneDraft.color.trim(),
    };

    try {
      if (stoneDialogMode === "add") {
        const newStone: CalculatorStoneType = {
          ...normalizedDraft,
          slabs: [],
        };
        setStoneTypes([...settings.stoneTypes, newStone]);
        setSelectedStoneId(newStone.stoneId);
        closeStoneDialog();
        toast.success("Stone added");
        return;
      }

      if (!editingStoneOriginalId) {
        toast.error("Could not update stone");
        return;
      }

      setStoneTypes(
        settings.stoneTypes.map((stone) =>
          stone.stoneId === editingStoneOriginalId
            ? { ...stone, ...normalizedDraft }
            : stone,
        ),
      );
      setSelectedStoneId(normalizedDraft.stoneId);
      closeStoneDialog();
      toast.success("Stone updated");
    } catch {
      toast.error(
        stoneDialogMode === "add"
          ? "Could not add stone"
          : "Could not update stone",
      );
    }
  }

  function deleteStone(stoneId: string) {
    try {
      const currentIndex = settings.stoneTypes.findIndex(
        (stone) => stone.stoneId === stoneId,
      );
      const nextStoneTypes = settings.stoneTypes.filter(
        (stone) => stone.stoneId !== stoneId,
      );
      setStoneTypes(nextStoneTypes);
      if (selectedStoneId === stoneId) {
        setSelectedStoneId(
          nextStoneTypes[currentIndex]?.stoneId ??
            nextStoneTypes[currentIndex - 1]?.stoneId ??
            nextStoneTypes[0]?.stoneId ??
            null,
        );
      }
      setStoneToDelete(null);
      toast.success("Stone deleted");
    } catch {
      toast.error("Could not delete stone");
    }
  }

  function updateSelectedStoneSlabs(slabs: CalculatorStoneSlab[]) {
    if (!selectedStone) return;
    setStoneTypes(
      settings.stoneTypes.map((stone) =>
        stone.stoneId === selectedStone.stoneId ? { ...stone, slabs } : stone,
      ),
    );
  }

  function openAddSlabDialog() {
    if (!selectedStone) {
      toast.error("Select a stone before adding a slab.");
      return;
    }
    setSlabDraft({
      code: "",
      fromWeight: 0,
      toWeight: 0,
      pricePerCarat: 0,
    });
    setSlabDialogOpen(true);
  }

  function submitSlabDialog() {
    if (!selectedStone) {
      toast.error("Select a stone before adding a slab.");
      return;
    }

    const code = slabDraft.code.trim();
    if (!code) {
      toast.error("Slab code is required.");
      return;
    }
    if (slabDraft.toWeight <= slabDraft.fromWeight) {
      toast.error("To ct must be greater than From ct.");
      return;
    }
    if (slabDraft.pricePerCarat < 0) {
      toast.error("Price / ct cannot be negative.");
      return;
    }
    if (selectedStone.slabs.some((slab) => slab.code === code)) {
      toast.error("Slab code already exists for this stone.");
      return;
    }

    try {
      updateSelectedStoneSlabs([
        ...selectedStone.slabs,
        {
          code,
          fromWeight: slabDraft.fromWeight,
          toWeight: slabDraft.toWeight,
          pricePerCarat: slabDraft.pricePerCarat,
        },
      ]);
      setSlabDialogOpen(false);
      toast.success("Slab added");
    } catch {
      toast.error("Could not add slab");
    }
  }

  function updateSlab(index: number, updates: Partial<CalculatorStoneSlab>) {
    if (!selectedStone) return;
    updateSelectedStoneSlabs(
      selectedStone.slabs.map((slab, slabIndex) =>
        slabIndex === index ? { ...slab, ...updates } : slab,
      ),
    );
  }

  function deleteSlab(index: number) {
    if (!selectedStone) return;
    updateSelectedStoneSlabs(
      selectedStone.slabs.filter((_, slabIndex) => slabIndex !== index),
    );
  }

  return (
    <SectionShell
      icon={<Layers3 className="h-5 w-5" />}
      title="Stones & Slabs"
      description="Manage stones on the left and slab pricing for the selected stone on the right."
      onBack={onBack}
    >
      <div className="grid h-full min-h-0 gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        <Card className="min-h-0 overflow-hidden py-0">
          <CardContent className="flex h-full min-h-0 flex-col gap-4 p-5 lg:p-6">
            <div className="shrink-0 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Stones
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {settings.stoneTypes.length} configured stones
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={openAddStoneDialog}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>
            </div>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-1 py-1">
              {settings.stoneTypes.map((stone) => {
                const selected = stone.stoneId === selectedStone?.stoneId;

                return (
                  <div
                    key={stone.stoneId}
                    className={
                      selected
                        ? "relative rounded-2xl border border-foreground bg-foreground text-background"
                        : "relative rounded-2xl border border-border bg-muted/20"
                    }
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedStoneId(stone.stoneId)}
                      className="block w-full cursor-pointer rounded-2xl p-4 pr-24 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                    >
                      <p className="break-words font-semibold">{stone.name}</p>
                      <p
                        className={
                          selected
                            ? "mt-1 truncate text-xs text-background/70"
                            : "mt-1 truncate text-xs text-muted-foreground"
                        }
                      >
                        {stone.stoneId}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Badge
                          variant={selected ? "outline" : "secondary"}
                          className={
                            selected
                              ? "border-background/25 text-background"
                              : undefined
                          }
                        >
                          {stone.category}
                        </Badge>
                        <span
                          className={
                            selected
                              ? "text-xs text-background/70"
                              : "text-xs text-muted-foreground"
                          }
                        >
                          {stone.slabs.length} slabs
                        </span>
                      </div>
                    </button>
                    <div className="absolute top-3 right-3 z-10 flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEditStoneDialog(stone)}
                        aria-label={`Edit ${stone.name}`}
                        className={
                          selected
                            ? "text-background/70 hover:bg-background/10 hover:text-background"
                            : "text-muted-foreground hover:text-foreground"
                        }
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setStoneToDelete(stone.stoneId)}
                        aria-label={`Delete ${stone.name}`}
                        className={
                          selected
                            ? "text-background/70 hover:bg-background/10 hover:text-background"
                            : "text-muted-foreground hover:text-destructive"
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="min-h-0 overflow-hidden py-0">
          <CardContent className="flex h-full min-h-0 flex-col gap-5 p-5 lg:p-6">
            {selectedStone ? (
              <>
                <div className="shrink-0 space-y-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h2 className="break-words text-lg font-semibold text-foreground">
                        {selectedStone.name}
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {selectedStone.stoneId}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">
                          {selectedStone.category}
                        </Badge>
                        {selectedStone.clarity ? (
                          <span className="text-xs text-muted-foreground">
                            {selectedStone.clarity}
                          </span>
                        ) : null}
                        {selectedStone.color ? (
                          <span className="text-xs text-muted-foreground">
                            {selectedStone.color}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <Button
                      type="button"
                      onClick={openAddSlabDialog}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Slab
                    </Button>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      Pricing Slabs
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {selectedStone.slabs.length} slabs defined
                    </p>
                  </div>
                </div>

                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-1 py-1">
                  {selectedStone.slabs.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border py-10 text-center">
                      <p className="text-sm text-muted-foreground">
                        No slabs configured
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={openAddSlabDialog}
                        className="mt-3 gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add first slab
                      </Button>
                    </div>
                  ) : (
                    selectedStone.slabs.map((slab, index) => (
                      <div
                        key={`${slab.code}-${index}`}
                        className="rounded-xl border border-border bg-muted/20 p-4"
                      >
                        <div className="mb-4 flex items-center justify-between gap-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                            Slab {index + 1}
                          </p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => deleteSlab(index)}
                            aria-label={`Delete slab ${index + 1}`}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                          <FieldBlock label="Code">
                            <Input
                              value={slab.code}
                              onChange={(event) =>
                                updateSlab(index, { code: event.target.value })
                              }
                              className="h-10 rounded-none border-0 border-b bg-transparent px-0 shadow-none focus-visible:ring-0"
                            />
                          </FieldBlock>
                          <FieldBlock label="From ct">
                            <NumberInput
                              value={slab.fromWeight}
                              step="0.0001"
                              onChange={(fromWeight) =>
                                updateSlab(index, { fromWeight })
                              }
                            />
                          </FieldBlock>
                          <FieldBlock label="To ct">
                            <NumberInput
                              value={slab.toWeight}
                              step="0.0001"
                              onChange={(toWeight) =>
                                updateSlab(index, { toWeight })
                              }
                            />
                          </FieldBlock>
                          <FieldBlock label="Price / ct">
                            <NumberInput
                              value={slab.pricePerCarat}
                              onChange={(pricePerCarat) =>
                                updateSlab(index, { pricePerCarat })
                              }
                            />
                          </FieldBlock>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border text-center">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Add a stone type before managing slabs.
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={openAddStoneDialog}
                    className="mt-3 gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Stone
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog
        open={!!stoneToDelete}
        onOpenChange={(open) => {
          if (!open) setStoneToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete stone type?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the stone and all pricing slabs attached to it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => stoneToDelete && deleteStone(stoneToDelete)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <StoneDialog
        mode={stoneDialogMode}
        draft={stoneDraft}
        onDraftChange={setStoneDraft}
        onOpenChange={(open) => {
          if (!open) closeStoneDialog();
        }}
        onSubmit={submitStoneDialog}
      />

      <SlabDialog
        open={slabDialogOpen}
        draft={slabDraft}
        onDraftChange={setSlabDraft}
        onOpenChange={setSlabDialogOpen}
        onSubmit={submitSlabDialog}
      />
    </SectionShell>
  );
}

function MiscEditor({
  settings,
  onChange,
  onBack,
}: {
  settings: CalculatorSettings;
  onChange: (settings: CalculatorSettings) => void;
  onBack: () => void;
}) {
  return (
    <SectionShell
      icon={<ReceiptText className="h-5 w-5" />}
      title="Miscellaneous"
      description="Manage GST and making cost values used by the calculator."
      onBack={onBack}
    >
      <Card className="h-full overflow-hidden py-0">
        <CardContent className="h-full space-y-6 overflow-y-auto p-6">
          <div className="grid gap-6 md:grid-cols-3">
            <FieldBlock label="GST percentage">
              <div className="flex items-end gap-3">
                <NumberInput
                  value={settings.gstRate * 100}
                  step="0.1"
                  onChange={(value) =>
                    onChange({ ...settings, gstRate: value / 100 })
                  }
                />
                <Percent className="mb-2 h-4 w-4 text-muted-foreground" />
              </div>
            </FieldBlock>
            <FieldBlock
              label="Making flat fee"
              description="Flat fee for small products."
            >
              <div className="flex items-end gap-3">
                <NumberInput
                  value={settings.makingChargeFlat}
                  onChange={(makingChargeFlat) =>
                    onChange({ ...settings, makingChargeFlat })
                  }
                />
                <span className="pb-2 text-sm text-muted-foreground">INR</span>
              </div>
            </FieldBlock>
            <FieldBlock
              label="Making per gram"
              description="Rate applied per gram."
            >
              <div className="flex items-end gap-3">
                <NumberInput
                  value={settings.makingChargePerGram}
                  onChange={(makingChargePerGram) =>
                    onChange({ ...settings, makingChargePerGram })
                  }
                />
                <span className="pb-2 text-sm text-muted-foreground">
                  INR/g
                </span>
              </div>
            </FieldBlock>
          </div>

          <div className="grid gap-3 rounded-xl border border-border bg-muted/20 p-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">Current GST</p>
              <p className="mt-1 font-semibold text-foreground">
                {settings.gstRate * 100}%
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Flat making</p>
              <p className="mt-1 font-semibold text-foreground">
                {formatCurrency(settings.makingChargeFlat)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Per gram making</p>
              <p className="mt-1 font-semibold text-foreground">
                {formatCurrency(settings.makingChargePerGram)}/g
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </SectionShell>
  );
}

export function ManageProductsAndPricePageClient() {
  const [settings, setSettings] = useState<CalculatorSettings>(
    MOCK_PRICING_SETTINGS,
  );
  const [activeSection, setActiveSection] = useState<ManageSection>("overview");

  return (
    <div className="mx-auto flex h-[calc(100svh-2rem)] w-full max-w-7xl flex-col overflow-hidden sm:h-[calc(100svh-3rem)]">
      {activeSection === "overview" ? (
        <Overview settings={settings} onSelect={setActiveSection} />
      ) : null}
      {activeSection === "metals" ? (
        <MetalsEditor
          settings={settings}
          onChange={setSettings}
          onBack={() => setActiveSection("overview")}
        />
      ) : null}
      {activeSection === "stones-slabs" ? (
        <StonesAndSlabsEditor
          settings={settings}
          onChange={setSettings}
          onBack={() => setActiveSection("overview")}
        />
      ) : null}
      {activeSection === "misc" ? (
        <MiscEditor
          settings={settings}
          onChange={setSettings}
          onBack={() => setActiveSection("overview")}
        />
      ) : null}
    </div>
  );
}
