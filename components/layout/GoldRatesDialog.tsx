"use client";

import { type ReactNode, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useGoldRate, useSystemConfigs } from "@/hooks/useSystemConfigs";
import { DEFAULT_CALCULATOR_SETTINGS } from "@/lib/calculator/constants";
import { calculateGoldRate } from "@/lib/calculator/pricing";
import { formatCurrency } from "@/lib/utils";
import type { MetalPurity } from "@/types";

const PURITIES: MetalPurity[] = ["24K", "22K", "18K", "14K"];

function configuredPercentage(
  configs: { key: string; value: string }[],
  purity: MetalPurity,
) {
  const configured = Number(
    configs.find((config) => config.key === `purity${purity}`)?.value,
  );

  return Number.isFinite(configured)
    ? configured
    : DEFAULT_CALCULATOR_SETTINGS.purityPercentages[purity];
}

export function GoldRatesDialog({ trigger }: { trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const goldRateQuery = useGoldRate(open);
  const configsQuery = useSystemConfigs(open);

  const rates = useMemo(() => {
    const goldRate24k = goldRateQuery.data?.goldRate24k;
    if (typeof goldRate24k !== "number" || !Number.isFinite(goldRate24k)) {
      return [];
    }

    const configs = configsQuery.data ?? [];
    const purityPercentages = {
      ...DEFAULT_CALCULATOR_SETTINGS.purityPercentages,
      ...Object.fromEntries(
        PURITIES.map((purity) => [
          purity,
          configuredPercentage(configs, purity),
        ]),
      ),
    };

    return PURITIES.map((purity) => ({
      purity,
      percentage: purityPercentages[purity],
      rate: calculateGoldRate(goldRate24k, purity, purityPercentages),
    }));
  }, [configsQuery.data, goldRateQuery.data?.goldRate24k]);

  const isLoading = goldRateQuery.isLoading || configsQuery.isLoading;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md gap-5">
        <DialogHeader className="pr-6 text-left">
          <DialogTitle>Gold rates per gram</DialogTitle>
          <DialogDescription>
            Based on the current 24K gold rate and configured purity values.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3" aria-label="Loading gold rates">
            {PURITIES.map((purity) => (
              <div
                key={purity}
                className="h-24 animate-pulse rounded-xl border bg-muted/50"
              />
            ))}
          </div>
        ) : rates.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {rates.map(({ purity, percentage, rate }) => (
              <div
                key={purity}
                className="rounded-xl border bg-muted/30 p-4"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-semibold">{purity}</span>
                  <span className="text-xs text-muted-foreground">
                    {percentage}%
                  </span>
                </div>
                <p className="mt-3 text-lg font-semibold tabular-nums">
                  {formatCurrency(rate)}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    /g
                  </span>
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground">
            Gold rates are currently unavailable.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
