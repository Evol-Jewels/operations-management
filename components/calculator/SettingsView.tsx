"use client";

import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Diamond,
  Percent,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type {
  CalculatorSettings,
  CalculatorStoneSlab,
  CalculatorStoneType,
  MetalPurity,
} from "@/types";

interface SettingsViewProps {
  settings: CalculatorSettings;
  onChange: (settings: CalculatorSettings) => void;
  lastSynced: string | null;
  onSyncSettings: () => Promise<{ success: boolean; error: string | null }>;
  isSyncingSettings: boolean;
  syncError: string | null;
}

const GOLD_PURITIES: MetalPurity[] = ["24K", "22K", "18K", "14K"];
const settingsCardClass = "rounded-lg border border-border py-0";
const sectionTriggerClass =
  "flex min-h-16 w-full items-center justify-between gap-3 rounded-lg px-4 py-3.5 text-left transition-colors hover:bg-muted/50 sm:px-5";
const sectionTitleClass =
  "text-xs font-medium uppercase tracking-wide text-foreground";
const compactInputClass =
  "border-0 border-b border-border bg-transparent px-1 text-foreground focus:border-foreground focus:ring-0";

function genId() {
  return Math.random().toString(36).slice(2, 9);
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

function getLastSyncedLabel(lastSynced: string | null) {
  if (!lastSynced) return "Settings never synced";

  const diff = Math.floor((Date.now() - new Date(lastSynced).getTime()) / 1000);
  if (diff < 60) return "Settings synced just now";
  if (diff < 3600) return `Settings synced ${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `Settings synced ${Math.floor(diff / 3600)}h ago`;
  return `Settings synced ${Math.floor(diff / 86400)}d ago`;
}

export function SettingsView({
  settings,
  onChange,
  lastSynced,
  onSyncSettings,
  isSyncingSettings,
  syncError,
}: SettingsViewProps) {
  const [editingStoneId, setEditingStoneId] = useState<string | null>(null);
  const [stoneToDelete, setStoneToDelete] = useState<string | null>(null);
  const [goldExpanded, setGoldExpanded] = useState(true);
  const [makingExpanded, setMakingExpanded] = useState(true);
  const [taxExpanded, setTaxExpanded] = useState(true);
  const [stonesExpanded, setStonesExpanded] = useState(true);
  const [stoneSearch, setStoneSearch] = useState("");

  const calculatedGoldRates = useMemo(() => {
    return GOLD_PURITIES.map((purity) => {
      const percentage = settings.purityPercentages[purity] ?? 100;
      const rate = Math.round(settings.goldRate24k * (percentage / 100));
      return { purity, rate, percentage };
    });
  }, [settings.goldRate24k, settings.purityPercentages]);

  const editingStone = settings.stoneTypes.find(
    (stone) => stone.stoneId === editingStoneId,
  );
  const slabCount = settings.stoneTypes.reduce(
    (sum, stone) => sum + stone.slabs.length,
    0,
  );
  const filteredStoneTypes = useMemo(() => {
    const query = stoneSearch.trim().toLowerCase();
    if (!query) return settings.stoneTypes;

    return settings.stoneTypes.filter((stone) =>
      [
        stone.name,
        stone.stoneId,
        stone.category,
        stone.clarity,
        stone.color,
        ...stone.slabs.map((slab) => slab.code),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [settings.stoneTypes, stoneSearch]);
  const lastSyncedLabel = getLastSyncedLabel(lastSynced);

  function updatePurityPercentage(purity: MetalPurity, value: number) {
    onChange({
      ...settings,
      purityPercentages: {
        ...settings.purityPercentages,
        [purity]: value,
      },
    });
  }

  function updateStoneType(
    stoneId: string,
    updates: Partial<CalculatorStoneType>,
  ) {
    onChange({
      ...settings,
      stoneTypes: settings.stoneTypes.map((stone) =>
        stone.stoneId === stoneId ? { ...stone, ...updates } : stone,
      ),
    });
  }

  function addStoneType() {
    const newStone: CalculatorStoneType = {
      stoneId: genId(),
      name: "New Stone",
      category: "Diamond",
      slabs: [],
    };
    onChange({ ...settings, stoneTypes: [...settings.stoneTypes, newStone] });
    setEditingStoneId(newStone.stoneId);
  }

  function removeStoneType(stoneId: string) {
    onChange({
      ...settings,
      stoneTypes: settings.stoneTypes.filter(
        (stone) => stone.stoneId !== stoneId,
      ),
    });
    if (editingStoneId === stoneId) setEditingStoneId(null);
    setStoneToDelete(null);
  }

  function addSlab(stoneId: string) {
    const stone = settings.stoneTypes.find((item) => item.stoneId === stoneId);
    if (!stone) return;

    const newSlab: CalculatorStoneSlab = {
      code: "",
      fromWeight: 0,
      toWeight: 0,
      pricePerCarat: 0,
    };
    updateStoneType(stoneId, { slabs: [...stone.slabs, newSlab] });
  }

  function updateSlab(
    stoneId: string,
    slabIndex: number,
    updates: Partial<CalculatorStoneSlab>,
  ) {
    const stone = settings.stoneTypes.find((item) => item.stoneId === stoneId);
    if (!stone) return;

    updateStoneType(stoneId, {
      slabs: stone.slabs.map((slab, index) =>
        index === slabIndex ? { ...slab, ...updates } : slab,
      ),
    });
  }

  function removeSlab(stoneId: string, slabIndex: number) {
    const stone = settings.stoneTypes.find((item) => item.stoneId === stoneId);
    if (!stone) return;

    updateStoneType(stoneId, {
      slabs: stone.slabs.filter((_, index) => index !== slabIndex),
    });
  }

  return (
    <div className="space-y-3 pb-20 sm:pb-4">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-2">
          {syncError ? (
            <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
          ) : lastSynced ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
          ) : (
            <RefreshCw className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <span className="truncate text-xs text-muted-foreground">
            {syncError ? syncError : lastSyncedLabel}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void onSyncSettings()}
          disabled={isSyncingSettings}
          className="h-9 shrink-0 gap-1.5 border-border text-xs"
        >
          <RefreshCw
            className={`h-3 w-3 ${isSyncingSettings ? "animate-spin" : ""}`}
          />
          {isSyncingSettings ? "Syncing settings..." : "Sync settings"}
        </Button>
      </div>

      <Card className={settingsCardClass}>
        <CardContent className="p-0">
          <Collapsible open={goldExpanded} onOpenChange={setGoldExpanded}>
            <CollapsibleTrigger asChild>
              <button type="button" className={sectionTriggerClass}>
                <span className={sectionTitleClass}>Gold Rates</span>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    Live: {formatCurrency(settings.goldRate24k)}/g
                  </span>
                  {goldExpanded ? (
                    <ChevronUp className="size-4 shrink-0 text-foreground" />
                  ) : (
                    <ChevronDown className="size-4 shrink-0 text-foreground" />
                  )}
                </div>
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-3 px-4 pb-4 pt-1 sm:px-5">
                <div className="rounded-md bg-muted p-3">
                  <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                    24K Gold Rate
                  </p>
                  <p className="text-sm font-mono text-foreground">
                    {formatCurrency(settings.goldRate24k)}/g
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Purity Percentages
                  </p>
                  {calculatedGoldRates.map((goldRate) => (
                    <div
                      key={goldRate.purity}
                      className="grid grid-cols-[auto_1fr_auto] items-center gap-2 rounded-md bg-muted/50 px-3 py-2"
                    >
                      <span className="text-xs font-mono text-muted-foreground">
                        {goldRate.purity}
                      </span>
                      <div className="flex items-center justify-end gap-2">
                        <Input
                          type="number"
                          inputMode="decimal"
                          step="0.1"
                          value={goldRate.percentage}
                          onChange={(event) =>
                            updatePurityPercentage(
                              goldRate.purity,
                              Number(event.target.value),
                            )
                          }
                          className={`${compactInputClass} h-8 w-16 rounded-none text-right text-xs`}
                        />
                        <span className="text-xs text-muted-foreground">%</span>
                      </div>
                      <span className="text-sm font-mono text-muted-foreground">
                        {formatCurrency(goldRate.rate)}/g
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      <Card className={settingsCardClass}>
        <CardContent className="p-0">
          <Collapsible open={makingExpanded} onOpenChange={setMakingExpanded}>
            <CollapsibleTrigger asChild>
              <button type="button" className={sectionTriggerClass}>
                <div className="flex min-w-0 flex-col items-start gap-0.5">
                  <span className={sectionTitleClass}>Making Charges</span>
                  <span className="truncate text-[11px] font-mono text-muted-foreground">
                    Flat {formatCurrency(settings.makingChargeFlat)} ·{" "}
                    {formatCurrency(settings.makingChargePerGram)}/g
                  </span>
                </div>
                {makingExpanded ? (
                  <ChevronUp className="size-4 shrink-0 text-foreground" />
                ) : (
                  <ChevronDown className="size-4 shrink-0 text-foreground" />
                )}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="grid gap-3 px-4 pb-4 pt-1 sm:px-5">
                <EditableMoneyMetric
                  label="Flat Fee (<= 2g)"
                  value={settings.makingChargeFlat}
                  suffix="flat"
                  onChange={(makingChargeFlat) =>
                    onChange({ ...settings, makingChargeFlat })
                  }
                />
                <EditableMoneyMetric
                  label="Per Gram (> 2g)"
                  value={settings.makingChargePerGram}
                  suffix="/g"
                  onChange={(makingChargePerGram) =>
                    onChange({ ...settings, makingChargePerGram })
                  }
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      <Card className={settingsCardClass}>
        <CardContent className="p-0">
          <Collapsible open={taxExpanded} onOpenChange={setTaxExpanded}>
            <CollapsibleTrigger asChild>
              <button type="button" className={sectionTriggerClass}>
                <span className={sectionTitleClass}>Tax (GST)</span>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-sm font-mono text-foreground">
                    {(settings.gstRate * 100).toFixed(2).replace(/\.?0+$/, "")}%
                  </span>
                  {taxExpanded ? (
                    <ChevronUp className="size-4 shrink-0 text-foreground" />
                  ) : (
                    <ChevronDown className="size-4 shrink-0 text-foreground" />
                  )}
                </div>
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-4 pb-4 pt-1 sm:px-5">
                <div className="rounded-md bg-muted p-3">
                  <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                    GST Percentage
                  </p>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="0.1"
                      value={settings.gstRate * 100}
                      onChange={(event) =>
                        onChange({
                          ...settings,
                          gstRate: Number(event.target.value) / 100,
                        })
                      }
                      className={`${compactInputClass} h-9 w-24 rounded-none text-sm`}
                    />
                    <Percent className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      <Card className={settingsCardClass}>
        <CardContent className="p-0">
          <Collapsible open={stonesExpanded} onOpenChange={setStonesExpanded}>
            <CollapsibleTrigger asChild>
              <button type="button" className={sectionTriggerClass}>
                <span className={sectionTitleClass}>Stone Types</span>
                <div className="flex shrink-0 items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(event) => {
                      event.stopPropagation();
                      addStoneType();
                    }}
                    className="h-7 gap-1 text-xs text-foreground hover:bg-muted"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {settings.stoneTypes.length} stones · {slabCount} slabs
                  </span>
                  {stonesExpanded ? (
                    <ChevronUp className="size-4 shrink-0 text-foreground" />
                  ) : (
                    <ChevronDown className="size-4 shrink-0 text-foreground" />
                  )}
                </div>
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-4 pb-4 pt-1 sm:px-5">
                {editingStone ? (
                  <div className="space-y-4">
                    <button
                      type="button"
                      onClick={() => setEditingStoneId(null)}
                      className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Back to list
                    </button>

                    <div className="flex items-center gap-3 border-b border-border pb-3">
                      <h3 className="text-base font-medium text-foreground">
                        {editingStone.name}
                      </h3>
                      <Badge variant="secondary" className="text-xs">
                        {editingStone.slabs.length} slabs
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div className="space-y-1.5">
                        <p className="text-xs text-muted-foreground">Name</p>
                        <Input
                          value={editingStone.name}
                          onChange={(event) =>
                            updateStoneType(editingStone.stoneId, {
                              name: event.target.value,
                            })
                          }
                          className={`${compactInputClass} h-9 rounded-none text-sm`}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-xs text-muted-foreground">
                          Stone ID
                        </p>
                        <Input
                          value={editingStone.stoneId}
                          onChange={(event) => {
                            const nextId = event.target.value;
                            onChange({
                              ...settings,
                              stoneTypes: settings.stoneTypes.map((stone) =>
                                stone.stoneId === editingStone.stoneId
                                  ? { ...stone, stoneId: nextId }
                                  : stone,
                              ),
                            });
                            setEditingStoneId(nextId);
                          }}
                          className={`${compactInputClass} h-9 rounded-none text-sm`}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-xs text-muted-foreground">Type</p>
                        <Select
                          value={editingStone.category}
                          onValueChange={(category) =>
                            updateStoneType(editingStone.stoneId, {
                              category: category as "Diamond" | "Gemstone",
                            })
                          }
                        >
                          <SelectTrigger className="h-9 w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Diamond">Diamond</SelectItem>
                            <SelectItem value="Gemstone">Gemstone</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h4 className="text-sm font-medium text-foreground">
                            Pricing Slabs
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            Local edits reset on sync
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => addSlab(editingStone.stoneId)}
                          className="h-8 gap-1 text-xs text-foreground hover:bg-muted"
                        >
                          <Plus className="h-3 w-3" />
                          Add Slab
                        </Button>
                      </div>

                      {editingStone.slabs.length === 0 ? (
                        <div className="rounded-md bg-muted py-6 text-center">
                          <p className="text-sm text-muted-foreground">
                            No slabs configured
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {editingStone.slabs.map((slab, index) => (
                            <div
                              key={`${editingStone.stoneId}-${index}`}
                              className="space-y-3 rounded-md bg-muted p-3"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                                  Slab {index + 1}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    removeSlab(editingStone.stoneId, index)
                                  }
                                  className="h-7 w-7 p-0 text-muted-foreground hover:bg-transparent hover:text-destructive"
                                  aria-label={`Remove slab ${index + 1}`}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                                <SlabInput
                                  label="ID / Code"
                                  value={slab.code}
                                  onChange={(code) =>
                                    updateSlab(editingStone.stoneId, index, {
                                      code,
                                    })
                                  }
                                />
                                <SlabInput
                                  label="Rs./Carat"
                                  type="number"
                                  value={slab.pricePerCarat}
                                  onChange={(pricePerCarat) =>
                                    updateSlab(editingStone.stoneId, index, {
                                      pricePerCarat: Number(pricePerCarat),
                                    })
                                  }
                                />
                                <SlabInput
                                  label="From (ct)"
                                  type="number"
                                  value={slab.fromWeight}
                                  onChange={(fromWeight) =>
                                    updateSlab(editingStone.stoneId, index, {
                                      fromWeight: Number(fromWeight),
                                    })
                                  }
                                />
                                <SlabInput
                                  label="To (ct)"
                                  type="number"
                                  value={slab.toWeight}
                                  onChange={(toWeight) =>
                                    updateSlab(editingStone.stoneId, index, {
                                      toWeight: Number(toWeight),
                                    })
                                  }
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 pt-2">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={stoneSearch}
                        onChange={(event) => setStoneSearch(event.target.value)}
                        placeholder="Search stone by name, ID or type"
                        className="h-10 rounded-md border-border bg-background pl-9 text-sm"
                      />
                    </div>
                    {settings.stoneTypes.length === 0 ? (
                      <div className="rounded-md bg-muted py-6 text-center">
                        <Diamond className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          No stone types configured
                        </p>
                      </div>
                    ) : filteredStoneTypes.length === 0 ? (
                      <div className="rounded-md bg-muted py-6 text-center">
                        <p className="text-sm text-muted-foreground">
                          No stone types match your search.
                        </p>
                      </div>
                    ) : (
                      filteredStoneTypes.map((stone) => (
                        <div
                          key={stone.stoneId}
                          className="rounded-md bg-muted p-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 items-start gap-2">
                              <Diamond className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                              <div className="min-w-0">
                                <p className="break-words text-sm font-medium leading-snug text-foreground">
                                  {stone.name}
                                </p>
                                <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                                  {stone.stoneId}
                                </p>
                              </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingStoneId(stone.stoneId)}
                                className="h-8 px-2.5 text-xs text-foreground hover:bg-accent"
                              >
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setStoneToDelete(stone.stoneId)}
                                className="h-8 w-8 p-0 text-muted-foreground hover:bg-transparent hover:text-destructive"
                                aria-label={`Delete ${stone.name}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center gap-2 pl-6">
                            <Badge variant="outline" className="text-xs">
                              {stone.category}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {stone.slabs.length} slabs
                            </Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      <AlertDialog
        open={!!stoneToDelete}
        onOpenChange={() => setStoneToDelete(null)}
      >
        <AlertDialogContent className="border border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              Delete Stone Type?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This removes the local stone type and slabs. Sync settings can
              restore backend values.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border hover:bg-muted">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => stoneToDelete && removeStoneType(stoneToDelete)}
              className="bg-foreground text-background hover:bg-foreground/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function EditableMoneyMetric({
  label,
  value,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  suffix: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="rounded-md bg-muted p-3">
      <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Rs.</span>
        <Input
          type="number"
          inputMode="decimal"
          step="0.001"
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className={`${compactInputClass} h-9 w-32 rounded-none text-sm`}
        />
        <span className="text-sm text-muted-foreground">{suffix}</span>
      </div>
    </div>
  );
}

function SlabInput({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: "text" | "number";
}) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <Input
        type={type}
        inputMode={type === "number" ? "decimal" : undefined}
        step={type === "number" ? "0.0001" : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`${compactInputClass} h-8 rounded-none text-xs`}
      />
    </div>
  );
}
