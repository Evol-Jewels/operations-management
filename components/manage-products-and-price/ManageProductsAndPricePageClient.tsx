"use client";

import {
  ArrowLeft,
  CircleDollarSign,
  Diamond,
  Layers3,
  Percent,
  Plus,
  ReceiptText,
  RefreshCw,
  Settings2,
  Trash2,
} from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
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
import { useCalculatorSettings } from "@/hooks/useCalculatorSettings";
import { formatCurrency } from "@/lib/utils";
import type {
  CalculatorSettings,
  CalculatorStoneSlab,
  CalculatorStoneType,
  MetalPurity,
} from "@/types";

type ManageSection = "overview" | "metals" | "stones" | "slabs" | "misc";

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
    <div className="space-y-5">
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

      {children}
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

function SyncStrip({
  lastSynced,
  syncError,
  isSyncing,
  onSync,
}: {
  lastSynced: string | null;
  syncError: string | null;
  isSyncing: boolean;
  onSync: () => void;
}) {
  const label = (() => {
    if (syncError) return syncError;
    if (!lastSynced) return "Not synced yet";
    return `Last synced ${new Date(lastSynced).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  })();

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/25 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-2">
        <Settings2 className="h-4 w-4 shrink-0 text-muted-foreground" />
        <p className="truncate text-sm text-muted-foreground">{label}</p>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onSync}
        disabled={isSyncing}
        className="w-full gap-2 sm:w-auto"
      >
        <RefreshCw className={isSyncing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
        {isSyncing ? "Syncing" : "Sync"}
      </Button>
    </div>
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Manage Products & Pricing
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Update the values used by the calculator for metals, stones, slabs,
          making charges, and GST.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <OverviewCard
          icon={<CircleDollarSign className="h-5 w-5" />}
          title="Metals"
          description="Gold base rate and purity percentages."
          meta={`${formatCurrency(settings.goldRate24k)}/g base`}
          onClick={() => onSelect("metals")}
        />
        <OverviewCard
          icon={<Diamond className="h-5 w-5" />}
          title="Stones"
          description="Stone names, IDs, categories, clarity, and color."
          meta={`${settings.stoneTypes.length} stone types`}
          onClick={() => onSelect("stones")}
        />
        <OverviewCard
          icon={<Layers3 className="h-5 w-5" />}
          title="Slabs"
          description="Per-carat pricing ranges for each stone."
          meta={`${slabCount} pricing slabs`}
          onClick={() => onSelect("slabs")}
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
      <Card>
        <CardContent className="space-y-6">
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

function StonesEditor({
  settings,
  onChange,
  onBack,
}: {
  settings: CalculatorSettings;
  onChange: (settings: CalculatorSettings) => void;
  onBack: () => void;
}) {
  const [editingStoneId, setEditingStoneId] = useState<string | null>(null);
  const [stoneToDelete, setStoneToDelete] = useState<string | null>(null);
  const editingStone = settings.stoneTypes.find(
    (stone) => stone.stoneId === editingStoneId,
  );

  function updateStone(stoneId: string, updates: Partial<CalculatorStoneType>) {
    onChange({
      ...settings,
      stoneTypes: settings.stoneTypes.map((stone) =>
        stone.stoneId === stoneId ? { ...stone, ...updates } : stone,
      ),
    });

    if (updates.stoneId) {
      setEditingStoneId(updates.stoneId);
    }
  }

  function addStone() {
    const newStone: CalculatorStoneType = {
      stoneId: `stone-${generateId()}`,
      name: "New Stone",
      category: "Diamond",
      clarity: "",
      color: "",
      slabs: [],
    };
    onChange({ ...settings, stoneTypes: [...settings.stoneTypes, newStone] });
    setEditingStoneId(newStone.stoneId);
  }

  function deleteStone(stoneId: string) {
    onChange({
      ...settings,
      stoneTypes: settings.stoneTypes.filter(
        (stone) => stone.stoneId !== stoneId,
      ),
    });
    if (editingStoneId === stoneId) setEditingStoneId(null);
    setStoneToDelete(null);
  }

  return (
    <SectionShell
      icon={<Diamond className="h-5 w-5" />}
      title="Stones"
      description="Manage stone types and metadata used in calculator stone selection."
      onBack={onBack}
    >
      <Card>
        <CardContent className="space-y-5">
          {editingStone ? (
            <div className="space-y-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingStoneId(null)}
                    className="mb-2 gap-2 px-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to stones
                  </Button>
                  <h2 className="text-lg font-semibold text-foreground">
                    {editingStone.name}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {editingStone.stoneId}
                  </p>
                </div>
                <Badge variant="secondary" className="w-fit">
                  {editingStone.category}
                </Badge>
              </div>

              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                <FieldBlock label="Name">
                  <Input
                    value={editingStone.name}
                    onChange={(event) =>
                      updateStone(editingStone.stoneId, {
                        name: event.target.value,
                      })
                    }
                    className="h-10 rounded-none border-0 border-b bg-transparent px-0 shadow-none focus-visible:ring-0"
                  />
                </FieldBlock>
                <FieldBlock label="Stone ID">
                  <Input
                    value={editingStone.stoneId}
                    onChange={(event) =>
                      updateStone(editingStone.stoneId, {
                        stoneId: event.target.value,
                      })
                    }
                    className="h-10 rounded-none border-0 border-b bg-transparent px-0 shadow-none focus-visible:ring-0"
                  />
                </FieldBlock>
                <FieldBlock label="Category">
                  <Select
                    value={editingStone.category}
                    onValueChange={(value) =>
                      updateStone(editingStone.stoneId, {
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
                    value={editingStone.clarity ?? ""}
                    onChange={(event) =>
                      updateStone(editingStone.stoneId, {
                        clarity: event.target.value,
                      })
                    }
                    className="h-10 rounded-none border-0 border-b bg-transparent px-0 shadow-none focus-visible:ring-0"
                  />
                </FieldBlock>
                <FieldBlock label="Color">
                  <Input
                    value={editingStone.color ?? ""}
                    onChange={(event) =>
                      updateStone(editingStone.stoneId, {
                        color: event.target.value,
                      })
                    }
                    className="h-10 rounded-none border-0 border-b bg-transparent px-0 shadow-none focus-visible:ring-0"
                  />
                </FieldBlock>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Stone types
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {settings.stoneTypes.length} configured stones
                  </p>
                </div>
                <Button type="button" onClick={addStone} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Stone
                </Button>
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                {settings.stoneTypes.map((stone) => (
                  <div
                    key={stone.stoneId}
                    className="rounded-xl border border-border bg-muted/20 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="break-words font-semibold text-foreground">
                          {stone.name}
                        </p>
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {stone.stoneId}
                          {stone.clarity ? ` - ${stone.clarity}` : ""}
                          {stone.color ? ` - ${stone.color}` : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingStoneId(stone.stoneId)}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setStoneToDelete(stone.stoneId)}
                          aria-label={`Delete ${stone.name}`}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{stone.category}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {stone.slabs.length} slabs
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
    </SectionShell>
  );
}

function SlabsEditor({
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
  const selectedStone =
    settings.stoneTypes.find((stone) => stone.stoneId === selectedStoneId) ??
    settings.stoneTypes[0];

  function updateStoneSlabs(stoneId: string, slabs: CalculatorStoneSlab[]) {
    onChange({
      ...settings,
      stoneTypes: settings.stoneTypes.map((stone) =>
        stone.stoneId === stoneId ? { ...stone, slabs } : stone,
      ),
    });
  }

  function addSlab(stone: CalculatorStoneType) {
    updateStoneSlabs(stone.stoneId, [
      ...stone.slabs,
      {
        code: "",
        fromWeight: 0,
        toWeight: 0,
        pricePerCarat: 0,
      },
    ]);
  }

  function updateSlab(
    stone: CalculatorStoneType,
    index: number,
    updates: Partial<CalculatorStoneSlab>,
  ) {
    updateStoneSlabs(
      stone.stoneId,
      stone.slabs.map((slab, slabIndex) =>
        slabIndex === index ? { ...slab, ...updates } : slab,
      ),
    );
  }

  function deleteSlab(stone: CalculatorStoneType, index: number) {
    updateStoneSlabs(
      stone.stoneId,
      stone.slabs.filter((_, slabIndex) => slabIndex !== index),
    );
  }

  return (
    <SectionShell
      icon={<Layers3 className="h-5 w-5" />}
      title="Slabs"
      description="Manage weight ranges and per-carat prices for each stone."
      onBack={onBack}
    >
      <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <Card className="lg:self-start">
          <CardContent className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Stones</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Choose a stone to edit its slabs.
              </p>
            </div>
            <div className="space-y-2">
              {settings.stoneTypes.map((stone) => {
                const selected = stone.stoneId === selectedStone?.stoneId;

                return (
                  <button
                    key={stone.stoneId}
                    type="button"
                    onClick={() => setSelectedStoneId(stone.stoneId)}
                    className={
                      selected
                        ? "w-full cursor-pointer rounded-xl border border-foreground bg-foreground px-3 py-3 text-left text-background"
                        : "w-full cursor-pointer rounded-xl border border-border bg-muted/20 px-3 py-3 text-left transition-colors hover:border-foreground/30"
                    }
                  >
                    <span className="block truncate text-sm font-semibold">
                      {stone.name}
                    </span>
                    <span
                      className={
                        selected
                          ? "mt-1 block text-xs text-background/70"
                          : "mt-1 block text-xs text-muted-foreground"
                      }
                    >
                      {stone.slabs.length} slabs
                    </span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-5">
            {selectedStone ? (
              <>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="break-words text-lg font-semibold text-foreground">
                      {selectedStone.name}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {selectedStone.stoneId}
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={() => addSlab(selectedStone)}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Slab
                  </Button>
                </div>

                {selectedStone.slabs.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border py-10 text-center">
                    <p className="text-sm text-muted-foreground">
                      No slabs configured
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => addSlab(selectedStone)}
                      className="mt-3 gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add first slab
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedStone.slabs.map((slab, index) => (
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
                            onClick={() => deleteSlab(selectedStone, index)}
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
                                updateSlab(selectedStone, index, {
                                  code: event.target.value,
                                })
                              }
                              className="h-10 rounded-none border-0 border-b bg-transparent px-0 shadow-none focus-visible:ring-0"
                            />
                          </FieldBlock>
                          <FieldBlock label="From ct">
                            <NumberInput
                              value={slab.fromWeight}
                              step="0.0001"
                              onChange={(fromWeight) =>
                                updateSlab(selectedStone, index, { fromWeight })
                              }
                            />
                          </FieldBlock>
                          <FieldBlock label="To ct">
                            <NumberInput
                              value={slab.toWeight}
                              step="0.0001"
                              onChange={(toWeight) =>
                                updateSlab(selectedStone, index, { toWeight })
                              }
                            />
                          </FieldBlock>
                          <FieldBlock label="Price / ct">
                            <NumberInput
                              value={slab.pricePerCarat}
                              onChange={(pricePerCarat) =>
                                updateSlab(selectedStone, index, {
                                  pricePerCarat,
                                })
                              }
                            />
                          </FieldBlock>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-border py-10 text-center">
                <p className="text-sm text-muted-foreground">
                  Add a stone type before managing slabs.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
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
      <Card>
        <CardContent className="space-y-6">
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
  const {
    settings,
    lastSynced,
    isSyncing,
    syncError,
    setSettings,
    syncFromSheet,
  } = useCalculatorSettings();
  const [activeSection, setActiveSection] = useState<ManageSection>("overview");

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <SyncStrip
        lastSynced={lastSynced}
        syncError={syncError}
        isSyncing={isSyncing}
        onSync={() => void syncFromSheet()}
      />

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
      {activeSection === "stones" ? (
        <StonesEditor
          settings={settings}
          onChange={setSettings}
          onBack={() => setActiveSection("overview")}
        />
      ) : null}
      {activeSection === "slabs" ? (
        <SlabsEditor
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
