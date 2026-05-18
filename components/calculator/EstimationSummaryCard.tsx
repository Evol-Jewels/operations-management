"use client";

import { Diamond, Info, Receipt, Scale } from "lucide-react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatCurrency } from "@/lib/utils";
import type {
  CalculatorFormState,
  CalculatorPricingBreakdown,
} from "@/types";

interface EstimationSummaryCardProps {
  form: CalculatorFormState;
  breakdown: CalculatorPricingBreakdown;
}

function formatWeight(value: number, suffix: string) {
  return `${value.toFixed(3).replace(/\.?0+$/, "")} ${suffix}`;
}

export function EstimationSummaryCard({
  form,
  breakdown,
}: EstimationSummaryCardProps) {
  const hasStones = breakdown.stoneDetails.some((stone) => stone.weight > 0);

  return (
    <Card className="overflow-hidden border-black/10 bg-card py-0 shadow-[0_18px_50px_rgba(0,0,0,0.08)]">
      <CardHeader className="border-b border-border/70 px-5 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Estimation Summary
            </p>
            <CardTitle className="mt-2 text-xl">
              {form.productName.trim() || "Manual Estimate"}
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {form.purity} - Net wt {formatWeight(form.netGoldWeight, "g")}
            </p>
          </div>
          <div className="rounded-full bg-black px-3 py-1 text-xs font-semibold text-white">
            Live
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 px-0 py-0">
        {form.productImageUrl ? (
          <div className="border-b border-border/70 bg-muted/20 px-5 py-5">
            <div className="overflow-hidden rounded-2xl border border-border/70 bg-white">
              <Image
                src={form.productImageUrl}
                alt={form.productName || "Product preview"}
                className="h-56 w-full object-cover"
                width={960}
                height={720}
                unoptimized
              />
            </div>
          </div>
        ) : null}

        <div className="space-y-4 px-5">
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <Scale className="h-3.5 w-3.5" />
                Gross Weight
              </div>
              <p className="mt-3 text-2xl font-semibold">
                {formatWeight(breakdown.grossWeight, "g")}
              </p>
            </div>

            <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <Receipt className="h-3.5 w-3.5" />
                Gold Rate
              </div>
              <p className="mt-3 text-2xl font-semibold">
                {formatCurrency(breakdown.goldRateValue)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Per gram</p>
            </div>

            <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <Diamond className="h-3.5 w-3.5" />
                Stone Cost
              </div>
              <p className="mt-3 text-2xl font-semibold">
                {formatCurrency(breakdown.totalStoneCost)}
              </p>
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-border/70 bg-white p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Net Gold Weight</span>
              <span className="font-medium tabular">
                {formatWeight(form.netGoldWeight, "g")}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Gold Cost</span>
              <span className="font-semibold tabular">
                {formatCurrency(breakdown.goldCost)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Making Charges</span>
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="flex items-center gap-1 font-semibold tabular cursor-help">
                      {formatCurrency(breakdown.makingCost)}
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs max-w-[200px]">
                    <p>Flat: ₹4,000 + Per gram: ₹1,800 × {form.netGoldWeight.toFixed(2)}g</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {hasStones ? (
            <div className="space-y-3 rounded-2xl border border-border/70 bg-white p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Stones
              </p>
              {breakdown.stoneDetails
                .filter((stone) => stone.weight > 0)
                .map((stone) => (
                  <div
                    key={stone.id}
                    className="flex items-start justify-between gap-4 border-b border-border/60 pb-3 last:border-b-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="font-medium">
                        {stone.stoneType?.name || "Stone"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatWeight(stone.weight, "ct")} • {stone.quantity}{" "}
                        pcs
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      {stone.slabInfo ? (
                        <>
                          <p className="text-[10px] text-muted-foreground">
                            {stone.slabInfo.code}
                          </p>
                          <p className="font-semibold tabular">
                            {formatCurrency(stone.totalCost)}
                          </p>
                        </>
                      ) : (
                        <p className="text-xs text-destructive">No slab</p>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          ) : null}

          {form.productNote.trim() ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/15 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Note
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {form.productNote}
              </p>
            </div>
          ) : null}
        </div>

        <Separator />

        <div className="space-y-3 px-5 pb-5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium tabular">
              {formatCurrency(breakdown.subTotal)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">GST (3%)</span>
            <span className="font-medium tabular">
              {formatCurrency(breakdown.gst)}
            </span>
          </div>
          <div className="rounded-2xl bg-black px-4 py-4 text-white">
            <div className="flex items-end justify-between gap-4">
              <span className="text-sm uppercase tracking-[0.22em] text-white/60">
                Total Estimate
              </span>
              <span className="text-3xl font-semibold tabular">
                {formatCurrency(breakdown.total)}
              </span>
            </div>
          </div>
          <div className="space-y-1 text-[11px] leading-5 text-muted-foreground">
            <p>
              Gold weight estimated might be slightly higher than actual product
              weight. Invoicing should be as per actuals.
            </p>
            <p>
              Prices are indicative and depend on the latest synced rate card.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
