"use client";

import { toPng } from "html-to-image";
import { Download, ImageIcon, Loader2 } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn, formatCurrency } from "@/lib/utils";
import type {
  CalculatorFormState,
  CalculatorPricingBreakdown,
  CatalogueEstimateResult,
} from "@/types";

interface SharedSummaryData {
  name: string;
  code: string;
  note: string;
  imageUrl?: string | null;
  grossWeight: number;
  netGoldWeight: number;
  purity: string;
  goldRateValue: number;
  goldCost: number;
  makingCost: number;
  stoneDetails: CalculatorPricingBreakdown["stoneDetails"];
  totalStoneCost: number;
  subTotal: number;
  gst: number;
  total: number;
  gstRate: number;
}

interface EstimationSummaryCardProps {
  className?: string;
  showDownloadButton?: boolean;
  downloadFilename?: string;
  title?: string;
  data:
    | {
        kind: "calculator";
        form: CalculatorFormState;
        breakdown: CalculatorPricingBreakdown;
        gstRate: number;
      }
    | {
        kind: "estimate";
        result: CatalogueEstimateResult;
      };
}

function formatWeight(value: number, suffix: string, decimals = 3) {
  return `${value.toFixed(decimals).replace(/\.?0+$/, "")} ${suffix}`;
}

function makeSlug(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "summary"
  );
}

function getSummaryData(
  data: EstimationSummaryCardProps["data"],
): SharedSummaryData {
  if (data.kind === "calculator") {
    return {
      name: data.form.productName.trim(),
      code: "",
      note: data.form.productNote.trim(),
      imageUrl: data.form.productImageUrl,
      grossWeight: data.breakdown.grossWeight,
      netGoldWeight: data.form.netGoldWeight,
      purity: data.form.purity,
      goldRateValue: data.breakdown.goldRateValue,
      goldCost: data.breakdown.goldCost,
      makingCost: data.breakdown.makingCost,
      stoneDetails: data.breakdown.stoneDetails,
      totalStoneCost: data.breakdown.totalStoneCost,
      subTotal: data.breakdown.subTotal,
      gst: data.breakdown.gst,
      total: data.breakdown.total,
      gstRate: data.gstRate,
    };
  }

  return {
    name: data.result.product.productName,
    code: data.result.product.productCode,
    note: data.result.product.description?.trim() ?? "",
    imageUrl: data.result.product.imageUrl,
    grossWeight: data.result.pricing.grossWeight,
    netGoldWeight: data.result.product.netGoldWeight,
    purity: data.result.product.purity,
    goldRateValue: data.result.pricing.goldRateValue,
    goldCost: data.result.pricing.goldCost,
    makingCost: data.result.pricing.makingCost,
    stoneDetails: data.result.pricing.stoneDetails,
    totalStoneCost: data.result.pricing.totalStoneCost,
    subTotal: data.result.pricing.subTotal,
    gst: data.result.pricing.gst,
    total: data.result.pricing.total,
    gstRate: data.result.pricing.gst / data.result.pricing.subTotal || 0,
  };
}

export function EstimationSummaryCard({
  className,
  showDownloadButton = true,
  downloadFilename,
  title = "Summary",
  data,
}: EstimationSummaryCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const summary = getSummaryData(data);
  const hasStones = summary.stoneDetails.some((stone) => stone.weight > 0);
  const displayName = summary.name || "Summary";
  const displayCode = summary.code.trim();
  const displaySubtotal = Math.round(summary.subTotal);
  const displayGst = Math.round(summary.gst);
  const displayTotal = Math.round(summary.total);

  async function downloadSummary() {
    if (!cardRef.current) return;

    setIsDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
      });
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download =
        downloadFilename ??
        `evol-estimate-${makeSlug(displayName)}-${new Date()
          .toISOString()
          .slice(0, 10)}.png`;
      link.click();
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <section
      className={cn(
        "min-w-0 rounded-xl border border-border bg-card p-3 shadow-md sm:p-4",
        className,
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {showDownloadButton ? (
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            className="rounded-lg"
            onClick={downloadSummary}
            disabled={isDownloading}
            aria-label="Download summary"
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
          </Button>
        ) : null}
      </div>

      <div
        ref={cardRef}
        className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground"
      >
        <div className="flex items-center justify-center border-b border-border py-3">
          <Image
            src="/evol-jewels-logo.png"
            alt="Evol"
            width={82}
            height={30}
            className="h-7 w-auto object-contain"
            priority
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[3fr_2fr]">
          <div className="relative flex min-h-56 items-center justify-center overflow-hidden bg-muted/60 sm:aspect-square sm:min-h-0">
            {summary.imageUrl ? (
              <Image
                src={summary.imageUrl}
                alt={displayName}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <ImageIcon className="h-9 w-9 text-muted-foreground/35" />
            )}
          </div>

          <div className="flex min-h-72 min-w-0 flex-col justify-between border-t border-border px-4 py-4 sm:border-t-0 sm:border-l">
            <div className="min-w-0">
              <p className="break-words text-sm font-semibold leading-snug">
                {displayName}
              </p>
              {displayCode ? (
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  {displayCode}
                </p>
              ) : null}
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Total
              </p>
              <p className="mt-1 text-2xl font-semibold tabular">
                {formatCurrency(displayTotal)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between bg-muted/35 px-4 py-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Gross Weight
          </span>
          <span className="text-sm font-semibold tabular">
            {formatWeight(summary.grossWeight, "g")}
          </span>
        </div>

        <Separator />

        <div className="px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Gold
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            {formatWeight(summary.netGoldWeight, "g")} - {summary.purity} -{" "}
            {formatCurrency(summary.goldRateValue)}/g
          </p>
          <div className="mt-3 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">Gold Cost</span>
              <span className="text-sm font-semibold tabular">
                {formatCurrency(summary.goldCost)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">
                Making Charges
              </span>
              <span className="text-sm font-semibold tabular">
                {formatCurrency(summary.makingCost)}
              </span>
            </div>
          </div>
        </div>

        {hasStones ? (
          <>
            <Separator />
            <div className="px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Stones
              </p>
              <div className="mt-3 divide-y divide-border/70">
                {summary.stoneDetails
                  .filter((stone) => stone.weight > 0)
                  .map((stone) => (
                    <div
                      key={stone.id}
                      className="flex items-start justify-between gap-4 py-3 first:pt-0"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          {stone.stoneType?.name || "Stone"}
                        </p>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {formatWeight(stone.weight, "ct")} - {stone.quantity}{" "}
                          pcs
                          {stone.slabInfo
                            ? ` @ ${formatCurrency(stone.slabInfo.pricePerCarat)}/ct`
                            : ""}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-semibold tabular">
                        {formatCurrency(stone.totalCost)}
                      </span>
                    </div>
                  ))}
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-border pt-3">
                <span className="text-sm text-muted-foreground">
                  Total Stones
                </span>
                <span className="text-sm font-semibold tabular">
                  {formatCurrency(summary.totalStoneCost)}
                </span>
              </div>
            </div>
          </>
        ) : null}

        <Separator />

        <div className="space-y-3 px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground">Subtotal</span>
            <span className="text-sm font-medium tabular">
              {formatCurrency(displaySubtotal)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground">
              GST ({(summary.gstRate * 100).toFixed(1)}%)
            </span>
            <span className="text-sm text-muted-foreground tabular">
              {formatCurrency(displayGst)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 bg-foreground px-4 py-4 text-background">
          <span className="text-sm font-medium">Total</span>
          <span className="text-2xl font-semibold tabular sm:text-3xl">
            {formatCurrency(displayTotal)}
          </span>
        </div>

        <div className="border-t border-border bg-muted/20 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Terms & Conditions
          </p>
          <ul className="mt-2 space-y-1 text-[10px] leading-4 text-muted-foreground">
            <li>
              Gold weight estimated might be slightly higher than actual product
              weight. Invoicing will be as per actuals.
            </li>
            <li>
              Prices quoted are indicative and subject to rate fluctuations on
              the date of confirmation.
            </li>
            <li>
              Custom orders require advance payment to confirm the order and
              lock applicable rates.
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
