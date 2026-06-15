"use client";

import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Diamond,
  Percent,
  RefreshCw,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { CalculatorSettings, MetalPurity } from "@/types";

interface SettingsViewProps {
  settings: CalculatorSettings;
  lastSynced: string | null;
  onSyncStones: () => Promise<{ success: boolean; error: string | null }>;
  isSyncingStones: boolean;
  syncError: string | null;
}

const GOLD_PURITIES: MetalPurity[] = ["24K", "22K", "18K", "14K"];
const settingsCardClass = "rounded-lg border border-border py-0";
const sectionTriggerClass =
  "flex min-h-16 w-full items-center justify-between gap-3 rounded-lg px-4 py-3.5 text-left transition-colors hover:bg-muted/50 sm:px-5";
const sectionTitleClass =
  "text-xs font-medium uppercase tracking-wide text-foreground";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatWeight(value: number) {
  return value.toFixed(3).replace(/\.?0+$/, "");
}

function getLastSyncedLabel(lastSynced: string | null) {
  if (!lastSynced) return "Stones never synced";

  const diff = Math.floor((Date.now() - new Date(lastSynced).getTime()) / 1000);
  if (diff < 60) return "Stones synced just now";
  if (diff < 3600) return `Stones synced ${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `Stones synced ${Math.floor(diff / 3600)}h ago`;
  return `Stones synced ${Math.floor(diff / 86400)}d ago`;
}

export function SettingsView({
  settings,
  lastSynced,
  onSyncStones,
  isSyncingStones,
  syncError,
}: SettingsViewProps) {
  const [goldExpanded, setGoldExpanded] = useState(true);
  const [makingExpanded, setMakingExpanded] = useState(true);
  const [taxExpanded, setTaxExpanded] = useState(true);
  const [stonesExpanded, setStonesExpanded] = useState(true);

  const calculatedGoldRates = useMemo(() => {
    return GOLD_PURITIES.map((purity) => {
      const percentage = settings.purityPercentages[purity] ?? 100;
      const rate = Math.round(settings.goldRate24k * (percentage / 100));
      return { purity, rate, percentage };
    });
  }, [settings.goldRate24k, settings.purityPercentages]);

  const slabCount = settings.stoneTypes.reduce(
    (sum, stone) => sum + stone.slabs.length,
    0,
  );
  const lastSyncedLabel = getLastSyncedLabel(lastSynced);

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
          onClick={() => void onSyncStones()}
          disabled={isSyncingStones}
          className="h-9 shrink-0 gap-1.5 border-border text-xs"
        >
          <RefreshCw
            className={`h-3 w-3 ${isSyncingStones ? "animate-spin" : ""}`}
          />
          {isSyncingStones ? "Syncing stones..." : "Sync stones"}
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
                    Base: {formatCurrency(settings.goldRate24k)}/g
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
              <div className="space-y-2 px-4 pb-4 pt-1 sm:px-5">
                {calculatedGoldRates.map((goldRate) => (
                  <div
                    key={goldRate.purity}
                    className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-md bg-muted/50 px-3 py-2"
                  >
                    <span className="text-xs font-mono text-muted-foreground">
                      {goldRate.purity}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {goldRate.percentage}%
                    </span>
                    <span className="text-sm font-mono text-foreground">
                      {formatCurrency(goldRate.rate)}/g
                    </span>
                  </div>
                ))}
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
                <ReadOnlyMetric
                  label="Flat Fee (<= 2g)"
                  value={formatCurrency(settings.makingChargeFlat)}
                />
                <ReadOnlyMetric
                  label="Per Gram (> 2g)"
                  value={`${formatCurrency(settings.makingChargePerGram)}/g`}
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
                <div className="flex items-center justify-between rounded-md bg-muted p-3">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">
                    GST Percentage
                  </span>
                  <span className="inline-flex items-center gap-1 font-mono text-sm text-foreground">
                    {(settings.gstRate * 100).toFixed(2).replace(/\.?0+$/, "")}
                    <Percent className="h-4 w-4 text-muted-foreground" />
                  </span>
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
                {settings.stoneTypes.length === 0 ? (
                  <div className="rounded-md bg-muted py-6 text-center">
                    <Diamond className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      No stone types configured
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 pt-2">
                    {settings.stoneTypes.map((stone) => (
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
                          <Badge
                            variant="secondary"
                            className="shrink-0 text-xs"
                          >
                            {stone.slabs.length} slabs
                          </Badge>
                        </div>

                        {stone.slabs.length > 0 ? (
                          <div className="mt-3 grid gap-2">
                            {stone.slabs.map((slab) => (
                              <div
                                key={`${stone.stoneId}-${slab.code}-${slab.fromWeight}-${slab.toWeight}`}
                                className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 rounded bg-background/70 px-3 py-2 text-xs"
                              >
                                <span className="min-w-0 truncate font-mono text-foreground">
                                  {slab.code}
                                </span>
                                <span className="text-muted-foreground">
                                  {formatWeight(slab.fromWeight)}-
                                  {formatWeight(slab.toWeight)} ct ·{" "}
                                  {formatCurrency(slab.pricePerCarat)}/ct
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>
    </div>
  );
}

function ReadOnlyMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md bg-muted p-3">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="shrink-0 font-mono text-sm text-foreground">
        {value}
      </span>
    </div>
  );
}
