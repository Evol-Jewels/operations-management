"use client";

import { toBlob } from "html-to-image";
import { Download, ImageIcon, Loader2 } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn, formatCurrency } from "@/lib/utils";
import type {
  CalculatorFormState,
  CalculatorPricingBreakdown,
  ProductEstimateResult,
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
  compact?: boolean;
  showDownloadButton?: boolean;
  showHeader?: boolean;
  downloadFilename?: string;
  title?: string;
  renderActions?: (props: {
    downloadSummary: () => Promise<void>;
    isDownloading: boolean;
  }) => ReactNode;
  renderHeaderActions?: (props: {
    downloadSummary: () => Promise<void>;
    isDownloading: boolean;
  }) => ReactNode;
  data:
    | {
        kind: "calculator";
        form: CalculatorFormState;
        breakdown: CalculatorPricingBreakdown;
        gstRate: number;
      }
    | {
        kind: "estimate";
        result: ProductEstimateResult;
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
    note: data.result.product.note.trim(),
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
    gstRate: data.result.pricing.gstRate,
  };
}

function waitForCardImages(card: HTMLElement) {
  const images = Array.from(card.querySelectorAll("img"));

  return Promise.all(
    images.map((image) => {
      if (image.complete && image.naturalWidth > 0) return Promise.resolve();
      if (image.complete) return Promise.resolve();

      return new Promise<void>((resolve) => {
        const timeout = window.setTimeout(resolve, 3000);
        image.addEventListener(
          "load",
          () => {
            window.clearTimeout(timeout);
            resolve();
          },
          { once: true },
        );
        image.addEventListener(
          "error",
          () => {
            window.clearTimeout(timeout);
            resolve();
          },
          { once: true },
        );
      });
    }),
  );
}

function isLoadedImage(image: HTMLImageElement) {
  return image.complete && image.naturalWidth > 0 && image.naturalHeight > 0;
}

function imageToPngDataUrl(image: HTMLImageElement) {
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Unable to prepare logo for download");

  context.drawImage(image, 0, 0);
  return canvas.toDataURL("image/png");
}

function inlineDownloadLogos(card: HTMLElement) {
  const logos = Array.from(
    card.querySelectorAll<HTMLImageElement>("[data-download-logo]"),
  ).filter(isLoadedImage);
  const originalSources = logos.map((logo) => logo.currentSrc || logo.src);
  const originalSrcsets = logos.map((logo) => logo.getAttribute("srcset"));

  logos.forEach((logo, index) => {
    logo.src = imageToPngDataUrl(logo);
    logo.removeAttribute("srcset");
    originalSources[index] = originalSources[index] || logo.src;
  });

  return () => {
    logos.forEach((logo, index) => {
      logo.src = originalSources[index];
      if (originalSrcsets[index]) {
        logo.setAttribute("srcset", originalSrcsets[index]);
      }
    });
  };
}

async function saveSummaryImage(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function EstimationSummaryCard({
  className,
  compact = false,
  showDownloadButton = true,
  showHeader = true,
  downloadFilename,
  title = "Estimate summary",
  renderActions,
  renderHeaderActions,
  data,
}: EstimationSummaryCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const summary = getSummaryData(data);
  const hasStones = summary.stoneDetails.some((stone) => stone.weight > 0);
  const displayName = summary.name || "";
  const displayCode = summary.code.trim();
  const displayNote = summary.note.trim();
  const displaySubtotal = summary.subTotal;
  const displayGst = summary.gst;
  const displayTotal = summary.total;

  async function downloadSummary() {
    if (!cardRef.current) return;

    setIsDownloading(true);
    try {
      await waitForCardImages(cardRef.current);
      const restoreLogos = inlineDownloadLogos(cardRef.current);

      const blob = await toBlob(cardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
      }).finally(restoreLogos);

      if (!blob) throw new Error("Unable to create summary image");

      await saveSummaryImage(
        blob,
        downloadFilename ??
          `evol-estimate-${makeSlug(displayName)}-${new Date()
            .toISOString()
            .slice(0, 10)}.png`,
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;

      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to download estimate summary",
      );
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <section
      className={cn(
        "min-w-0 rounded-lg border border-border bg-background p-4 sm:p-5",
        className,
      )}
    >
      {showHeader ? (
        <>
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Estimation as per values, share with customers using the
                download button
              </p>
            </div>
            {showDownloadButton || renderHeaderActions ? (
              <div className="flex shrink-0 items-center gap-2">
                {renderHeaderActions?.({ downloadSummary, isDownloading })}
                {showDownloadButton ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 shrink-0 rounded-md px-2.5 sm:px-3"
                    onClick={downloadSummary}
                    disabled={isDownloading}
                    aria-label="Download summary"
                  >
                    {isDownloading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    <span className="hidden sm:inline">Download</span>
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>

          <Separator className="mb-4" />
        </>
      ) : null}

      <div
        ref={cardRef}
        className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground"
      >
        <div
          className={cn(
            "flex items-center justify-center border-b border-border",
            compact ? "py-2" : "py-3",
          )}
        >
          <img
            src="/evol-logo.webp"
            alt="Evol"
            width={82}
            height={30}
            className={cn(
              "w-auto object-contain dark:hidden",
              compact ? "h-6" : "h-7",
            )}
            data-download-logo
          />
          <img
            src="/evol-logo-white.webp"
            alt="Evol"
            width={82}
            height={30}
            className={cn(
              "hidden w-auto object-contain dark:block dark:brightness-0 dark:invert",
              compact ? "h-6" : "h-7",
            )}
            data-download-logo
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[3fr_2fr]">
          <div className="relative flex min-h-48 items-center justify-center overflow-hidden bg-muted/60 sm:aspect-[4/3] sm:min-h-0">
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

          <div
            className={cn(
              "flex min-h-48 min-w-0 flex-col justify-between border-t border-border px-4 sm:min-h-0 sm:border-t-0 sm:border-l",
              compact ? "py-3" : "py-4",
            )}
          >
            <div className="min-w-0">
              <p className="break-words text-sm font-semibold leading-snug sm:text-base">
                {displayName}
              </p>
              {displayCode ? (
                <p
                  className={cn(
                    "text-xs leading-5 text-muted-foreground",
                    compact ? "mt-1" : "mt-2",
                  )}
                >
                  {displayCode}
                </p>
              ) : null}
              {displayNote ? (
                <p
                  className={cn(
                    "break-words text-xs leading-5 text-muted-foreground",
                    compact ? "mt-1" : "mt-2",
                  )}
                >
                  {displayNote}
                </p>
              ) : null}
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Total
              </p>
              <p
                className={cn(
                  "font-semibold tabular",
                  compact ? "mt-1 text-xl" : "mt-2 text-2xl",
                )}
              >
                {formatCurrency(displayTotal)}
              </p>
            </div>
          </div>
        </div>

        <div
          className={cn(
            "flex items-center justify-between bg-muted/35 px-4",
            compact ? "py-2.5" : "py-3",
          )}
        >
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Gross Weight
          </span>
          <span className="text-sm font-semibold tabular">
            {formatWeight(summary.grossWeight, "g")}
          </span>
        </div>

        <Separator />

        <div className={cn("px-4", compact ? "py-3" : "py-4")}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Gold
          </p>
          <p
            className={cn(
              "text-xs text-muted-foreground",
              compact ? "mt-2" : "mt-3",
            )}
          >
            {formatWeight(summary.netGoldWeight, "g")} - {summary.purity} -{" "}
            {formatCurrency(summary.goldRateValue)}/g
          </p>
          <div className={cn(compact ? "mt-2 space-y-2" : "mt-3 space-y-3")}>
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
            <div className={cn("px-4", compact ? "py-3" : "py-4")}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Stones
              </p>
              <div
                className={cn(
                  "divide-y divide-border/70",
                  compact ? "mt-2" : "mt-3",
                )}
              >
                {summary.stoneDetails
                  .filter((stone) => stone.weight > 0)
                  .map((stone) => (
                    <div
                      key={stone.id}
                      className={cn(
                        "flex items-start justify-between gap-4 first:pt-0",
                        compact ? "py-2" : "py-3",
                      )}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          {stone.sourceStoneName ||
                            stone.stoneType?.name ||
                            "Stone"}
                        </p>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {formatWeight(stone.weight, "ct")} - {stone.quantity}{" "}
                          pcs
                          {stone.fixedRatePerCarat
                            ? ` @ ${formatCurrency(stone.fixedRatePerCarat)}/ct`
                            : stone.slabInfo
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
              <div
                className={cn(
                  "mt-2 flex items-center justify-between border-t border-border",
                  compact ? "pt-2" : "pt-3",
                )}
              >
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

        <div
          className={cn(
            "px-4",
            compact ? "space-y-2 py-3" : "space-y-3 py-4",
          )}
        >
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

        <div
          className={cn(
            "flex items-center justify-between gap-4 bg-foreground px-4 text-background",
            compact ? "py-3" : "py-3.5",
          )}
        >
          <span className="text-sm font-medium">Total</span>
          <span
            className={cn(
              "font-semibold tabular",
              compact ? "text-xl" : "text-2xl",
            )}
          >
            {formatCurrency(displayTotal)}
          </span>
        </div>

        <div
          className={cn(
            "border-t border-border bg-muted/20 px-4",
            compact ? "py-2.5" : "py-3",
          )}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Terms & Conditions
          </p>
          <ul
            className={cn(
              "mt-2 text-[10px] leading-4 text-muted-foreground",
              compact ? "space-y-0.5" : "space-y-1",
            )}
          >
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

      {renderActions ? (
        <div className={cn(compact ? "mt-3" : "mt-4")}>
          {renderActions({ downloadSummary, isDownloading })}
        </div>
      ) : null}
    </section>
  );
}
