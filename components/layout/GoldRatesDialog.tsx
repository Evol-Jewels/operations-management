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

const OTHER_METALS = [
  { key: "silverPrice", label: "Silver", purity: "925" },
  { key: "platinumPrice", label: "Platinum", purity: "950" },
] as const;

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

function configuredMetalRate(
  configs: { key: string; value: string }[],
  key: string,
) {
  const value = Number(configs.find((config) => config.key === key)?.value);
  return Number.isFinite(value) && value >= 0 ? value : null;
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

  const otherMetalRates = useMemo(() => {
    const configs = configsQuery.data ?? [];
    return OTHER_METALS.map((metal) => ({
      ...metal,
      rate: configuredMetalRate(configs, metal.key),
    }));
  }, [configsQuery.data]);

  const isLoading = goldRateQuery.isLoading || configsQuery.isLoading;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md gap-5">
        <DialogHeader className="pr-6 text-left">
          <DialogTitle>Metal rates per gram</DialogTitle>
          <DialogDescription>
            Current gold, silver, and platinum rates from system config.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div
            className="grid grid-cols-2 gap-3"
            aria-label="Loading metal rates"
          >
            {[...PURITIES, ...OTHER_METALS.map((metal) => metal.key)].map(
              (rateKey) => (
                <div
                  key={rateKey}
                  className="h-24 animate-pulse rounded-xl border bg-muted/50"
                />
              ),
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <section aria-labelledby="gold-rates-heading">
              <h3
                id="gold-rates-heading"
                className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground"
              >
                Gold
              </h3>
              {rates.length > 0 ? (
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
                <p className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
                  Gold rates are currently unavailable.
                </p>
              )}
            </section>

            <section aria-labelledby="other-metal-rates-heading">
              <h3
                id="other-metal-rates-heading"
                className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground"
              >
                Other metals
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {otherMetalRates.map(({ key, label, purity, rate }) => (
                  <div key={key} className="rounded-xl border bg-muted/30 p-4">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-semibold">{label}</span>
                      <span className="text-xs text-muted-foreground">
                        {purity}
                      </span>
                    </div>
                    <p className="mt-3 text-lg font-semibold tabular-nums">
                      {rate === null ? "Unavailable" : formatCurrency(rate)}
                      {rate !== null ? (
                        <span className="ml-1 text-xs font-normal text-muted-foreground">
                          /g
                        </span>
                      ) : null}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
