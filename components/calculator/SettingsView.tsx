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
  Trash2,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useMemo, useState } from "react";
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
  onSync: () => Promise<{ success: boolean; error: string | null }>;
  isSyncing: boolean;
  syncError: string | null;
}

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

const GOLD_PURITIES: MetalPurity[] = ["24K", "22K", "18K", "14K"];

export function SettingsView({
  settings,
  onChange,
  lastSynced,
  onSync,
  isSyncing,
  syncError,
}: SettingsViewProps) {
  const handleSync = async () => {
    await onSync();
  };

  const lastSyncedLabel = (() => {
    if (!lastSynced) return "Never synced";
    const diff = Math.floor(
      (Date.now() - new Date(lastSynced).getTime()) / 1000,
    );
    if (diff < 60) return "Last Synced just now";
    if (diff < 3600) return `Last Synced ${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `Last Synced ${Math.floor(diff / 3600)}h ago`;
    return `Last Synced ${Math.floor(diff / 86400)}d ago`;
  })();

  const [editingStoneId, setEditingStoneId] = useState<string | null>(null);
  const [stoneToDelete, setStoneToDelete] = useState<string | null>(null);
  const [goldExpanded, setGoldExpanded] = useState(true);
  const [makingExpanded, setMakingExpanded] = useState(true);
  const [taxExpanded, setTaxExpanded] = useState(true);
  const [stonesExpanded, setStonesExpanded] = useState(true);

  const calculatedGoldRates = useMemo(() => {
    return GOLD_PURITIES.map((purity) => {
      const percentage = settings.purityPercentages[purity] ?? 100;
      const rate = Math.round(settings.goldRate24k * (percentage / 100));
      return { purity, label: `${purity}`, rate, percentage };
    });
  }, [settings.goldRate24k, settings.purityPercentages]);

  const updateGoldRate24k = useCallback(
    (value: number) => {
      onChange({ ...settings, goldRate24k: value });
    },
    [settings, onChange],
  );

  const updatePurityPercentage = useCallback(
    (purity: MetalPurity, value: number) => {
      onChange({
        ...settings,
        purityPercentages: {
          ...settings.purityPercentages,
          [purity]: value,
        },
      });
    },
    [settings, onChange],
  );

  const updateMakingFlat = useCallback(
    (value: number) => {
      onChange({ ...settings, makingChargeFlat: value });
    },
    [settings, onChange],
  );

  const updateMakingPerGram = useCallback(
    (value: number) => {
      onChange({ ...settings, makingChargePerGram: value });
    },
    [settings, onChange],
  );

  const updateGstRate = useCallback(
    (value: number) => {
      onChange({ ...settings, gstRate: value / 100 });
    },
    [settings, onChange],
  );

  const updateStoneType = useCallback(
    (stoneId: string, updates: Partial<CalculatorStoneType>) => {
      onChange({
        ...settings,
        stoneTypes: settings.stoneTypes.map((st) =>
          st.stoneId === stoneId ? { ...st, ...updates } : st,
        ),
      });
    },
    [settings, onChange],
  );

  const addStoneType = useCallback(() => {
    const newStone: CalculatorStoneType = {
      stoneId: genId(),
      name: "New Stone",
      category: "Diamond",
      slabs: [],
    };
    onChange({ ...settings, stoneTypes: [...settings.stoneTypes, newStone] });
    setEditingStoneId(newStone.stoneId);
  }, [settings, onChange]);

  const confirmRemoveStoneType = useCallback(
    (stoneId: string) => {
      onChange({
        ...settings,
        stoneTypes: settings.stoneTypes.filter((st) => st.stoneId !== stoneId),
      });
      if (editingStoneId === stoneId) setEditingStoneId(null);
      setStoneToDelete(null);
    },
    [settings, onChange, editingStoneId],
  );

  const addSlab = useCallback(
    (stoneId: string) => {
      const stone = settings.stoneTypes.find((s) => s.stoneId === stoneId);
      if (!stone) return;
      const newSlab: CalculatorStoneSlab = {
        code: "",
        fromWeight: 0,
        toWeight: 0,
        pricePerCarat: 0,
      };
      updateStoneType(stoneId, { slabs: [...stone.slabs, newSlab] });
    },
    [settings.stoneTypes, updateStoneType],
  );

  const updateSlab = useCallback(
    (
      stoneId: string,
      slabIndex: number,
      updates: Partial<CalculatorStoneSlab>,
    ) => {
      const stone = settings.stoneTypes.find((s) => s.stoneId === stoneId);
      if (!stone) return;
      const slabs = stone.slabs.map((sl, i) =>
        i === slabIndex ? { ...sl, ...updates } : sl,
      );
      updateStoneType(stoneId, { slabs });
    },
    [settings.stoneTypes, updateStoneType],
  );

  const removeSlab = useCallback(
    (stoneId: string, slabIndex: number) => {
      const stone = settings.stoneTypes.find((s) => s.stoneId === stoneId);
      if (!stone) return;
      updateStoneType(stoneId, {
        slabs: stone.slabs.filter((_, i) => i !== slabIndex),
      });
    },
    [settings.stoneTypes, updateStoneType],
  );

  const editingStone = settings.stoneTypes.find(
    (s) => s.stoneId === editingStoneId,
  );

  return (
    <div className="space-y-4">
      {/* Sync Banner */}
      <div className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-border bg-muted/40">
        <div className="flex items-center gap-2 min-w-0">
          {syncError ? (
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          ) : lastSynced ? (
            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
          ) : (
            <RefreshCw className="w-4 h-4 text-muted-foreground shrink-0" />
          )}
          <span className="text-xs text-muted-foreground truncate">
            {syncError ? syncError : lastSyncedLabel}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSync}
          disabled={isSyncing}
          className="ml-3 h-7 text-xs shrink-0 gap-1.5 border-border"
        >
          <RefreshCw className={`w-3 h-3 ${isSyncing ? "animate-spin" : ""}`} />
          {isSyncing ? "Syncing…" : "Sync"}
        </Button>
      </div>

      {/* Gold Rates */}
      <Card className="border border-border">
        <CardContent className="p-4">
          <Collapsible open={goldExpanded} onOpenChange={setGoldExpanded}>
            <CollapsibleTrigger asChild>
              <button className="w-full flex items-center justify-between py-1 hover:bg-muted rounded px-2 -mx-2 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-foreground uppercase tracking-wide">
                    Gold Rates
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-foreground">Base: 24K</span>
                  {goldExpanded ? (
                    <ChevronUp className="w-4 h-4 text-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-foreground" />
                  )}
                </div>
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="pt-4 space-y-3">
                <div className="p-3 bg-muted rounded-md">
                  <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-2">
                    24K Gold Rate (Base)
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">₹</span>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="0.001"
                      value={settings.goldRate24k}
                      onChange={(e) =>
                        updateGoldRate24k(Number(e.target.value))
                      }
                      className="w-32 h-9 text-sm border-0 border-b border-border rounded-none bg-transparent px-0 focus:ring-0 focus:border-foreground"
                    />
                    <span className="text-sm text-muted-foreground">/g</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Purity Percentages
                  </p>
                  {calculatedGoldRates.map((gr) => (
                    <div
                      key={gr.purity}
                      className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-md gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-mono text-muted-foreground shrink-0">
                          {gr.purity}
                        </span>
                        <span className="text-sm text-foreground shrink-0">
                          {gr.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Input
                          type="number"
                          inputMode="decimal"
                          step="0.1"
                          value={gr.percentage}
                          onChange={(e) =>
                            updatePurityPercentage(
                              gr.purity,
                              Number(e.target.value),
                            )
                          }
                          className="w-14 h-8 text-xs text-right border-0 border-b border-border rounded-none bg-transparent px-0 focus:ring-0 focus:border-foreground"
                        />
                        <span className="text-xs text-muted-foreground shrink-0">
                          %
                        </span>
                        <span className="text-sm font-mono text-muted-foreground whitespace-nowrap shrink-0">
                          {formatCurrency(gr.rate)}/g
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Making Charges */}
      <Card className="border border-border">
        <CardContent className="p-4">
          <Collapsible open={makingExpanded} onOpenChange={setMakingExpanded}>
            <CollapsibleTrigger asChild>
              <button className="w-full flex items-center justify-between py-1 hover:bg-muted rounded px-2 -mx-2 transition-colors">
                <div className="flex flex-col items-start gap-0.5 min-w-0">
                  <span className="text-xs font-medium text-foreground uppercase tracking-wide">
                    Making Charges
                  </span>
                  <span className="text-[11px] font-mono text-muted-foreground truncate max-w-[200px] sm:max-w-none">
                    Flat {formatCurrency(settings.makingChargeFlat)} ·{" "}
                    {formatCurrency(settings.makingChargePerGram)}/g
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  {makingExpanded ? (
                    <ChevronUp className="w-4 h-4 text-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-foreground" />
                  )}
                </div>
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="pt-4 space-y-4">
                <div className="p-3 bg-muted rounded-md">
                  <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-2">
                    Flat Fee (≤ 2g)
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">₹</span>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="0.001"
                      value={settings.makingChargeFlat}
                      onChange={(e) => updateMakingFlat(Number(e.target.value))}
                      className="w-32 h-9 text-sm border-0 border-b border-border rounded-none bg-transparent px-0 focus:ring-0 focus:border-foreground"
                    />
                    <span className="text-sm text-muted-foreground">flat</span>
                  </div>
                </div>

                <div className="p-3 bg-muted rounded-md">
                  <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-2">
                    Per Gram (&gt; 2g)
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">₹</span>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="0.001"
                      value={settings.makingChargePerGram}
                      onChange={(e) =>
                        updateMakingPerGram(Number(e.target.value))
                      }
                      className="w-32 h-9 text-sm border-0 border-b border-border rounded-none bg-transparent px-0 focus:ring-0 focus:border-foreground"
                    />
                    <span className="text-sm text-muted-foreground">/g</span>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* GST / Tax */}
      <Card className="border border-border">
        <CardContent className="p-4">
          <Collapsible open={taxExpanded} onOpenChange={setTaxExpanded}>
            <CollapsibleTrigger asChild>
              <button className="w-full flex items-center justify-between py-1 hover:bg-muted rounded px-2 -mx-2 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-foreground uppercase tracking-wide">
                    Tax (GST)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-foreground">
                    {settings.gstRate * 100}%
                  </span>
                  {taxExpanded ? (
                    <ChevronUp className="w-4 h-4 text-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-foreground" />
                  )}
                </div>
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="pt-4">
                <div className="p-3 bg-muted rounded-md">
                  <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-2">
                    GST Percentage
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="0.1"
                      value={settings.gstRate * 100}
                      onChange={(e) => updateGstRate(Number(e.target.value))}
                      className="w-24 h-9 text-sm border-0 border-b border-border rounded-none bg-transparent px-0 focus:ring-0 focus:border-foreground"
                    />
                    <Percent className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Stone Types */}
      <Card className="border border-border">
        <CardContent className="p-4">
          <Collapsible open={stonesExpanded} onOpenChange={setStonesExpanded}>
            <CollapsibleTrigger asChild>
              <button className="w-full flex items-center justify-between py-1 hover:bg-muted rounded px-2 -mx-2 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-foreground uppercase tracking-wide">
                    Stone Types
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      addStoneType();
                    }}
                    className="h-7 text-xs gap-1 hover:bg-muted text-foreground"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </Button>
                  <span className="text-xs text-foreground">
                    {settings.stoneTypes.length}
                  </span>
                  {stonesExpanded ? (
                    <ChevronUp className="w-4 h-4 text-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-foreground" />
                  )}
                </div>
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="pt-4">
                {editingStone ? (
                  <motion.div
                    key="editing"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <button
                      onClick={() => setEditingStoneId(null)}
                      className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Back to list
                    </button>

                    <div className="flex items-center gap-3 pb-3 border-b border-border">
                      <h3 className="text-base font-medium text-foreground">
                        {editingStone.name}
                      </h3>
                      <Badge variant="secondary" className="text-xs">
                        {editingStone.category}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs text-muted-foreground">
                          Name
                        </label>
                        <Input
                          value={editingStone.name}
                          onChange={(e) =>
                            updateStoneType(editingStone.stoneId, {
                              name: e.target.value,
                            })
                          }
                          className="h-9 text-sm border-0 border-b border-border rounded-none bg-transparent px-0 focus:ring-0 focus:border-foreground"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-muted-foreground">
                          Stone ID
                        </label>
                        <Input
                          value={editingStone.stoneId}
                          onChange={(e) =>
                            updateStoneType(editingStone.stoneId, {
                              stoneId: e.target.value,
                            })
                          }
                          className="h-9 text-sm border-0 border-b border-border rounded-none bg-transparent px-0 focus:ring-0 focus:border-foreground"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-muted-foreground">
                          Clarity
                        </label>
                        <Input
                          value={editingStone.clarity ?? ""}
                          onChange={(e) =>
                            updateStoneType(editingStone.stoneId, {
                              clarity: e.target.value,
                            })
                          }
                          className="h-9 text-sm border-0 border-b border-border rounded-none bg-transparent px-0 focus:ring-0 focus:border-foreground"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-muted-foreground">
                          Category
                        </label>
                        <Select
                          value={editingStone.category}
                          onValueChange={(v) =>
                            updateStoneType(editingStone.stoneId, {
                              category: v as "Diamond" | "Gemstone",
                            })
                          }
                        >
                          <SelectTrigger className="h-9 text-sm border-0 border-b border-border rounded-none bg-transparent px-0 focus:ring-0 focus:border-foreground">
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
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-foreground">
                            Pricing Slabs
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {editingStone.slabs.length}{" "}
                            {editingStone.slabs.length === 1 ? "slab" : "slabs"}{" "}
                            defined
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => addSlab(editingStone.stoneId)}
                          className="h-8 text-xs gap-1 hover:bg-muted text-foreground"
                        >
                          <Plus className="w-3 h-3" />
                          Add Slab
                        </Button>
                      </div>

                      {editingStone.slabs.length === 0 ? (
                        <div className="text-center py-6 bg-muted rounded-md">
                          <p className="text-sm text-muted-foreground">
                            No slabs configured
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => addSlab(editingStone.stoneId)}
                            className="mt-2 hover:bg-muted text-foreground"
                          >
                            <Plus className="w-3.5 h-3.5 mr-1" />
                            Add first slab
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {editingStone.slabs.map((sl, i) => (
                            <motion.div
                              key={sl.code + i}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="p-3 bg-muted rounded-md space-y-3"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground/60">
                                  Slab {i + 1}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    removeSlab(editingStone.stoneId, i)
                                  }
                                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-transparent"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                                <div className="space-y-1">
                                  <label className="text-[10px] text-muted-foreground block">
                                    ID / Code
                                  </label>
                                  <Input
                                    value={sl.code}
                                    onChange={(e) =>
                                      updateSlab(editingStone.stoneId, i, {
                                        code: e.target.value,
                                      })
                                    }
                                    className="h-8 text-xs border-0 border-b border-border rounded-none bg-transparent px-0 focus:ring-0 focus:border-foreground"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] text-muted-foreground block">
                                    ₹/Carat
                                  </label>
                                  <Input
                                    type="number"
                                    inputMode="decimal"
                                    step="0.001"
                                    value={sl.pricePerCarat}
                                    onChange={(e) =>
                                      updateSlab(editingStone.stoneId, i, {
                                        pricePerCarat: Number(e.target.value),
                                      })
                                    }
                                    className="h-8 text-xs border-0 border-b border-border rounded-none bg-transparent px-0 focus:ring-0 focus:border-foreground"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] text-muted-foreground block">
                                    From (ct)
                                  </label>
                                  <Input
                                    type="number"
                                    inputMode="decimal"
                                    step="0.0001"
                                    value={sl.fromWeight}
                                    onChange={(e) =>
                                      updateSlab(editingStone.stoneId, i, {
                                        fromWeight: Number(e.target.value),
                                      })
                                    }
                                    className="h-8 text-xs border-0 border-b border-border rounded-none bg-transparent px-0 focus:ring-0 focus:border-foreground"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] text-muted-foreground block">
                                    To (ct)
                                  </label>
                                  <Input
                                    type="number"
                                    inputMode="decimal"
                                    step="0.0001"
                                    value={sl.toWeight}
                                    onChange={(e) =>
                                      updateSlab(editingStone.stoneId, i, {
                                        toWeight: Number(e.target.value),
                                      })
                                    }
                                    className="h-8 text-xs border-0 border-b border-border rounded-none bg-transparent px-0 focus:ring-0 focus:border-foreground"
                                  />
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="list" className="space-y-2 pt-2">
                    {settings.stoneTypes.length === 0 ? (
                      <div className="text-center py-6 bg-muted rounded-md">
                        <Diamond className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          No stone types configured
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={addStoneType}
                          className="mt-2 text-foreground"
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" />
                          Add stone type
                        </Button>
                      </div>
                    ) : (
                      settings.stoneTypes.map((st) => (
                        <motion.div
                          key={st.stoneId}
                          layout
                          className="p-3 bg-muted rounded-md"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2 min-w-0">
                              <Diamond className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground break-words leading-snug">
                                  {st.name}
                                </p>
                                <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                                  {st.stoneId}
                                  {st.clarity && ` · ${st.clarity}`}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingStoneId(st.stoneId)}
                                className="h-8 text-xs hover:bg-accent text-foreground px-2.5"
                              >
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setStoneToDelete(st.stoneId)}
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-transparent"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-2 pl-6">
                            <Badge variant="secondary" className="text-xs">
                              {st.category}
                            </Badge>
                            <span className="text-xs font-mono text-muted-foreground">
                              {st.slabs.length} slabs
                            </span>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </motion.div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
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
              This will permanently delete this stone type and all its pricing
              slabs. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border hover:bg-muted">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                stoneToDelete && confirmRemoveStoneType(stoneToDelete)
              }
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
