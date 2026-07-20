"use client";

import { toBlob } from "html-to-image";
import {
  ChevronDown,
  Check,
  Download,
  FileImage,
  FileText,
  ImageIcon,
  ListChevronsDownUp,
  ListChevronsUpDown,
  Loader2,
  Share2,
} from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  diamondColor: string;
  diamondClarity: string;
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
  showFormatToggle?: boolean;
  renderActions?: (props: {
    downloadSummary: () => Promise<void>;
    downloadSummaryPdf: () => Promise<void>;
    downloadSummaryPng: () => Promise<void>;
    shareSummaryPng: () => Promise<void>;
    isDownloading: boolean;
    isSharing: boolean;
  }) => ReactNode;
  renderHeaderActions?: (props: {
    downloadSummary: () => Promise<void>;
    downloadSummaryPdf: () => Promise<void>;
    downloadSummaryPng: () => Promise<void>;
    shareSummaryPng: () => Promise<void>;
    isDownloading: boolean;
    isSharing: boolean;
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

function getStoneCategoryGroups(
  stoneDetails: SharedSummaryData["stoneDetails"],
) {
  const visibleStoneDetails = stoneDetails.filter((stone) => stone.weight > 0);

  return (
    [
      { category: "Diamond", label: "Diamonds" },
      { category: "Gemstone", label: "Gemstones" },
    ] as const
  )
    .map(({ category, label }) => {
      const details = visibleStoneDetails.filter(
        (stone) => (stone.stoneType?.category ?? "Diamond") === category,
      );

      return {
        category,
        label,
        details,
        totalWeight: details.reduce((total, stone) => total + stone.weight, 0),
        totalCost: details.reduce((total, stone) => total + stone.totalCost, 0),
      };
    })
    .filter((group) => group.details.length > 0);
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
      diamondColor: data.form.diamondColor.trim(),
      diamondClarity: data.form.diamondClarity.trim(),
      totalStoneCost: data.breakdown.totalStoneCost,
      subTotal: data.breakdown.subTotal,
      gst: data.breakdown.gst,
      total: data.breakdown.total,
      gstRate: data.gstRate,
    };
  }

  const firstDiamond = data.result.pricing.stoneDetails.find(
    (stone) => stone.stoneType?.category === "Diamond",
  );

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
    diamondColor: firstDiamond?.stoneType?.color?.trim() ?? "",
    diamondClarity: firstDiamond?.stoneType?.clarity?.trim() ?? "",
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

function waitForAnimationFrame() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

async function waitForPrintLayout(card: HTMLElement) {
  await waitForCardImages(card);
  await document.fonts?.ready;
  await waitForAnimationFrame();
  await waitForAnimationFrame();
}

type DownloadFormat = "pdf" | "png";

const ESTIMATION_SUMMARY_DOWNLOAD_FORMAT_KEY =
  "evol:estimation-summary-download-format";

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

function inlineBlobImages(card: HTMLElement) {
  const images = Array.from(card.querySelectorAll<HTMLImageElement>("img"))
    .filter(isLoadedImage)
    .filter((image) => (image.currentSrc || image.src).startsWith("blob:"));
  const originalSources = images.map((image) => image.src);
  const originalSrcsets = images.map((image) => image.getAttribute("srcset"));

  images.forEach((image) => {
    image.src = imageToPngDataUrl(image);
    image.removeAttribute("srcset");
  });

  return () => {
    images.forEach((image, index) => {
      image.src = originalSources[index];
      if (originalSrcsets[index]) {
        image.setAttribute("srcset", originalSrcsets[index]);
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

async function shareImageFile(blob: Blob, filename: string, title: string) {
  const file = new File([blob], filename, { type: "image/png" });
  const shareData = {
    files: [file],
    title,
  };

  if (!navigator.canShare?.(shareData)) {
    throw new Error("File sharing is not supported on this device.");
  }

  await navigator.share(shareData);
}

export function EstimationSummaryShareButton({
  shareSummaryPng,
  isSharing,
  isDownloading,
  className,
}: {
  shareSummaryPng: () => Promise<void>;
  isSharing: boolean;
  isDownloading?: boolean;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn("h-8 shrink-0 rounded-md px-2.5 sm:hidden", className)}
      onClick={() => void shareSummaryPng()}
      disabled={isSharing || isDownloading}
      aria-label="Share summary PNG"
    >
      {isSharing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Share2 className="h-4 w-4" />
      )}
      <span className="hidden sm:inline">Share PNG</span>
    </Button>
  );
}

export function EstimationSummaryDownloadButton({
  downloadSummaryPdf,
  downloadSummaryPng,
  isDownloading,
  className,
}: {
  downloadSummaryPdf: () => Promise<void>;
  downloadSummaryPng: () => Promise<void>;
  isDownloading: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<DownloadFormat>("png");

  useEffect(() => {
    const storedFormat = localStorage.getItem(
      ESTIMATION_SUMMARY_DOWNLOAD_FORMAT_KEY,
    );
    if (storedFormat === "pdf" || storedFormat === "png") {
      setDownloadFormat(storedFormat);
    }
  }, []);

  function selectDownloadFormat(format: DownloadFormat) {
    setDownloadFormat(format);
    localStorage.setItem(ESTIMATION_SUMMARY_DOWNLOAD_FORMAT_KEY, format);
  }

  function downloadSelectedFormat() {
    if (downloadFormat === "pdf") {
      void downloadSummaryPdf();
      return;
    }

    void downloadSummaryPng();
  }

  function downloadFormatOption(format: DownloadFormat) {
    setOpen(false);
    selectDownloadFormat(format);

    if (format === "pdf") {
      void downloadSummaryPdf();
      return;
    }

    void downloadSummaryPng();
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="inline-flex overflow-hidden rounded-md border border-input shadow-xs">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 shrink-0 rounded-none border-0 px-2.5 shadow-none hover:bg-accent sm:px-3",
            className,
          )}
          onClick={downloadSelectedFormat}
          disabled={isDownloading}
          aria-label="Download summary"
        >
          {isDownloading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">Download .{downloadFormat}</span>
          <span className="sm:hidden">.{downloadFormat}</span>
        </Button>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="h-8 w-7 rounded-none border-0 border-l border-input shadow-none hover:bg-accent"
            disabled={isDownloading}
            aria-label="Choose download format"
          >
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
      </div>
      <PopoverContent align="end" className="w-48 p-1">
        <button
          type="button"
          onClick={() => downloadFormatOption("pdf")}
          className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
        >
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="flex-1">Download as .pdf</span>
          {downloadFormat === "pdf" ? <Check className="h-4 w-4" /> : null}
        </button>
        <button
          type="button"
          onClick={() => downloadFormatOption("png")}
          className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
        >
          <FileImage className="h-4 w-4 text-muted-foreground" />
          <span className="flex-1">Download as .png</span>
          {downloadFormat === "png" ? <Check className="h-4 w-4" /> : null}
        </button>
      </PopoverContent>
    </Popover>
  );
}

function CompactSummary({ summary }: { summary: SharedSummaryData }) {
  const stoneCategoryGroups = getStoneCategoryGroups(summary.stoneDetails);
  const hasDiamondColor = Boolean(summary.diamondColor);
  const hasDiamondClarity = Boolean(summary.diamondClarity);
  const hasDiamondMetadata = hasDiamondColor || hasDiamondClarity;
  const priceOrDash = (value: number) =>
    value > 0 ? formatCurrency(value) : "—";

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-[minmax(0,1.18fr)_minmax(240px,0.82fr)]"
      data-estimation-summary-compact
    >
      <div className="min-w-0" data-estimation-summary-compact-breakup>
        <div className="border-b border-border bg-muted/35 px-4 py-2.5 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Breakup Details
          </p>
        </div>
        <table className="w-full table-fixed border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/15 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <th className="w-[43%] px-4 py-2 font-semibold">Component</th>
              <th className="w-[24%] px-2 py-2 font-semibold">Weight</th>
              <th className="w-[33%] px-4 py-2 text-right font-semibold">
                Price
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/70">
            <tr>
              <td className="px-4 py-2.5">Gross Weight</td>
              <td className="px-2 py-2.5 font-medium tabular">
                {formatWeight(summary.grossWeight, "g")}
              </td>
              <td className="px-4 py-2.5 text-right text-muted-foreground">
                —
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2.5">Net Metal · {summary.purity}</td>
              <td className="px-2 py-2.5 font-medium tabular">
                {formatWeight(summary.netGoldWeight, "g")}
              </td>
              <td className="px-4 py-2.5 text-right font-semibold tabular">
                {formatCurrency(summary.goldCost)}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2.5">Making</td>
              <td className="px-2 py-2.5 font-medium tabular">
                {formatWeight(summary.netGoldWeight, "g")}
              </td>
              <td className="px-4 py-2.5 text-right font-semibold tabular">
                {priceOrDash(summary.makingCost)}
              </td>
            </tr>
            {stoneCategoryGroups.map((group) => (
              <tr key={group.category}>
                <td className="px-4 py-2.5">{group.label}</td>
                <td className="px-2 py-2.5 text-xs text-muted-foreground tabular">
                  {formatWeight(group.totalWeight, "ct")}
                </td>
                <td className="px-4 py-2.5 text-right font-semibold tabular">
                  {priceOrDash(group.totalCost)}
                </td>
              </tr>
            ))}
            <tr className="border-t border-border bg-muted/15">
              <td colSpan={2} className="px-4 py-2.5 font-medium">
                Subtotal
              </td>
              <td className="px-4 py-2.5 text-right font-semibold tabular">
                {formatCurrency(summary.subTotal)}
              </td>
            </tr>
            <tr className="bg-muted/15">
              <td colSpan={2} className="px-4 py-2.5">
                GST ({(summary.gstRate * 100).toFixed(1)}%)
              </td>
              <td className="px-4 py-2.5 text-right font-semibold tabular">
                {formatCurrency(summary.gst)}
              </td>
            </tr>
            {hasDiamondMetadata ? (
              <tr>
                <td colSpan={3} className="p-0">
                  <div
                    className={cn(
                      "grid",
                      hasDiamondColor && hasDiamondClarity
                        ? "grid-cols-2"
                        : "grid-cols-1",
                    )}
                  >
                    {hasDiamondColor ? (
                      <div className="min-w-0 px-4 py-3">
                        <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          Colour
                        </p>
                        <p className="mt-1 truncate text-xs font-semibold uppercase">
                          {summary.diamondColor}
                        </p>
                      </div>
                    ) : null}
                    {hasDiamondClarity ? (
                      <div
                        className={cn(
                          "min-w-0 px-4 py-3",
                          hasDiamondColor && "border-l border-border",
                        )}
                      >
                        <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          Clarity
                        </p>
                        <p className="mt-1 truncate text-xs font-semibold uppercase">
                          {summary.diamondClarity}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div
        className="flex min-w-0 flex-col border-t border-border sm:border-t-0 sm:border-l"
        data-estimation-summary-compact-product
      >
        <div className="border-b border-border bg-muted/35 px-4 py-2.5 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Product
          </p>
        </div>
        <div
          className="relative flex min-h-64 flex-1 items-center justify-center overflow-hidden bg-muted/60"
          data-estimation-summary-compact-media
        >
          {summary.imageUrl ? (
            <>
              <Image
                src={summary.imageUrl}
                alt=""
                fill
                aria-hidden="true"
                className="scale-110 object-cover opacity-30 blur-md"
                unoptimized
              />
              <div className="absolute inset-0 bg-black/5" aria-hidden="true" />
              <Image
                src={summary.imageUrl}
                alt={summary.name || "Jewellery product"}
                fill
                className="object-contain"
                unoptimized
              />
            </>
          ) : (
            <ImageIcon className="h-9 w-9 text-muted-foreground/35" />
          )}
        </div>
        <div
          className="flex items-center justify-between gap-4 border-t border-border bg-foreground px-4 py-3 text-background"
          data-estimation-summary-compact-total
        >
          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-background/70">
            Total
          </p>
          <p className="whitespace-nowrap text-lg font-semibold tabular">
            {formatCurrency(summary.total)}
          </p>
        </div>
      </div>
    </div>
  );
}

export function EstimationSummaryCard({
  className,
  compact = false,
  showDownloadButton = true,
  showHeader = true,
  downloadFilename,
  title = "Estimate summary",
  showFormatToggle = true,
  renderActions,
  renderHeaderActions,
  data,
}: EstimationSummaryCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [summaryFormat, setSummaryFormat] = useState<"detailed" | "compact">(
    data.kind === "calculator" ? "compact" : "detailed",
  );
  const summary = getSummaryData(data);
  const stoneCategoryGroups = getStoneCategoryGroups(summary.stoneDetails);
  const hasStones = stoneCategoryGroups.length > 0;
  const displayName = summary.name || "";
  const displayCode = summary.code.trim();
  const displayNote = summary.note.trim();
  const displaySubtotal = summary.subTotal;
  const displayGst = summary.gst;
  const displayTotal = summary.total;

  async function downloadSummaryPdf() {
    if (!cardRef.current) return;

    setIsDownloading(true);
    document.getElementById("estimation-summary-print-root")?.remove();

    const printRoot = document.createElement("div");
    printRoot.id = "estimation-summary-print-root";
    const printableCard = cardRef.current.cloneNode(true) as HTMLElement;
    printableCard.setAttribute("data-estimation-summary-printing", "true");
    printRoot.appendChild(printableCard);
    document.body.appendChild(printRoot);

    const cleanup = () => {
      printRoot.remove();
      setIsDownloading(false);
    };

    try {
      await waitForPrintLayout(printableCard);
      window.addEventListener("afterprint", cleanup, { once: true });
      window.print();
      window.setTimeout(cleanup, 30000);
    } catch (error) {
      cleanup();
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to prepare estimate summary PDF",
      );
    }
  }

  async function createSummaryPngBlob() {
    if (!cardRef.current) throw new Error("Unable to prepare summary image");

    await waitForCardImages(cardRef.current);
    const restoreBlobImages = inlineBlobImages(cardRef.current);
    const restoreLogos = inlineDownloadLogos(cardRef.current);

    const blob = await toBlob(cardRef.current, {
      pixelRatio: 2,
      cacheBust: true,
    }).finally(() => {
      restoreLogos();
      restoreBlobImages();
    });

    if (!blob) throw new Error("Unable to create summary image");
    return blob;
  }

  function getSummaryPngFilename() {
    const filename =
      downloadFilename ??
      `evol-estimate-${makeSlug(displayName)}-${new Date()
        .toISOString()
        .slice(0, 10)}.png`;

    if (summaryFormat !== "compact") return filename;
    return filename.replace(/(\.png)?$/i, "-compact.png");
  }

  async function downloadSummaryPng() {
    setIsDownloading(true);
    try {
      const blob = await createSummaryPngBlob();
      await saveSummaryImage(blob, getSummaryPngFilename());
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

  async function shareSummaryPng() {
    setIsSharing(true);
    try {
      const blob = await createSummaryPngBlob();
      await shareImageFile(
        blob,
        getSummaryPngFilename(),
        displayName || "Estimate summary",
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;

      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to share estimate summary",
      );
    } finally {
      setIsSharing(false);
    }
  }

  const downloadProps = {
    downloadSummary: downloadSummaryPng,
    downloadSummaryPdf,
    downloadSummaryPng,
    shareSummaryPng,
    isDownloading,
    isSharing,
  };

  return (
    <section
      className={cn(
        "min-w-0 rounded-lg border border-border bg-background p-4 sm:p-5",
        className,
      )}
    >
      {showHeader ? (
        <>
          <div className="mb-4 flex flex-wrap items-start gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Estimation as per values, share with customers using the
                download button
              </p>
            </div>
            {showDownloadButton || renderHeaderActions ? (
              <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
                {renderHeaderActions?.(downloadProps)}
                {showDownloadButton ? (
                  <>
                    <EstimationSummaryShareButton {...downloadProps} />
                    {showFormatToggle ? (
                      <div
                        role="group"
                        aria-label="Estimation summary format"
                        className="inline-flex shrink-0 overflow-hidden rounded-md border border-input shadow-xs"
                      >
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className={cn(
                            "h-8 w-8 rounded-none border-0 shadow-none",
                            summaryFormat === "detailed"
                              ? "bg-accent text-accent-foreground"
                              : "text-muted-foreground hover:text-foreground",
                          )}
                          onClick={() => setSummaryFormat("detailed")}
                          aria-label="Show detailed estimation summary"
                          aria-pressed={summaryFormat === "detailed"}
                          title="Detailed summary"
                        >
                          <ListChevronsUpDown className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className={cn(
                            "h-8 w-8 rounded-none border-0 border-l border-input shadow-none",
                            summaryFormat === "compact"
                              ? "bg-accent text-accent-foreground"
                              : "text-muted-foreground hover:text-foreground",
                          )}
                          onClick={() => setSummaryFormat("compact")}
                          aria-label="Show compact estimation summary"
                          aria-pressed={summaryFormat === "compact"}
                          title="Compact summary"
                        >
                          <ListChevronsDownUp className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : null}
                    <EstimationSummaryDownloadButton {...downloadProps} />
                  </>
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
        data-estimation-summary-card
        data-estimation-summary-format={summaryFormat}
      >
        <div
          className={cn(
            "flex items-center justify-center border-b border-border",
            compact ? "py-2" : "py-3",
          )}
          data-estimation-summary-logo
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
            data-estimation-summary-logo-tone="light"
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
            data-estimation-summary-logo-tone="dark"
          />
        </div>

        {summaryFormat === "compact" ? (
          <CompactSummary summary={summary} />
        ) : (
          <>
            <div
              className="grid grid-cols-1 sm:grid-cols-2"
              data-estimation-summary-hero
            >
              <div
                className="relative flex min-h-48 items-center justify-center overflow-hidden bg-muted/60 sm:aspect-square sm:min-h-0"
                data-estimation-summary-media
              >
                {summary.imageUrl ? (
                  <>
                    <Image
                      src={summary.imageUrl}
                      alt=""
                      fill
                      aria-hidden="true"
                      className="scale-110 object-cover opacity-30 blur-md"
                      data-estimation-summary-media-backdrop
                      unoptimized
                    />
                    <div
                      className="absolute inset-0 bg-black/5"
                      aria-hidden="true"
                    />
                    <Image
                      src={summary.imageUrl}
                      alt={displayName}
                      fill
                      className="object-contain"
                      data-estimation-summary-media-product
                      unoptimized
                    />
                  </>
                ) : (
                  <ImageIcon className="h-9 w-9 text-muted-foreground/35" />
                )}
              </div>

              <div
                className={cn(
                  "flex min-h-48 min-w-0 flex-col justify-between border-t border-border px-4 sm:min-h-0 sm:border-t-0 sm:border-l",
                  compact ? "py-3" : "py-4",
                )}
                data-estimation-summary-intro
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
              data-estimation-summary-strip
            >
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Gross Weight
              </span>
              <span className="text-sm font-semibold tabular">
                {formatWeight(summary.grossWeight, "g")}
              </span>
            </div>

            <Separator />

            <div
              className={cn("px-4", compact ? "py-3" : "py-4")}
              data-estimation-summary-section
            >
              <div className={cn(compact ? "space-y-2" : "space-y-3")}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">Gold</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {formatWeight(summary.netGoldWeight, "g")} -{" "}
                      {summary.purity} - {formatCurrency(summary.goldRateValue)}
                      /g
                    </p>
                  </div>
                  <span className="text-sm font-semibold tabular">
                    {formatCurrency(summary.goldCost)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-medium">Making Charges</span>
                  <span className="text-sm font-semibold tabular">
                    {formatCurrency(summary.makingCost)}
                  </span>
                </div>
              </div>
            </div>

            {hasStones ? (
              <>
                <Separator />
                <div
                  className="px-4"
                  data-estimation-summary-section
                  data-estimation-summary-stones
                >
                  <div className="divide-y divide-border">
                    {stoneCategoryGroups.map((group) => (
                      <div
                        key={group.category}
                        data-estimation-summary-stone-group={group.category}
                      >
                        <div className="divide-y divide-border/70">
                          {group.details.map((stone) => (
                            <div
                              key={stone.id}
                              data-estimation-summary-stone-row
                              className={cn(
                                "flex items-start justify-between gap-4",
                                compact ? "py-2.5" : "py-3",
                              )}
                            >
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-muted-foreground">
                                  {stone.sourceStoneName ||
                                    stone.stoneType?.name ||
                                    "Stone"}
                                </p>
                                <p className="mt-1 text-[11px] text-muted-foreground">
                                  {formatWeight(stone.weight, "ct")} -{" "}
                                  {stone.quantity} pcs
                                  {stone.fixedRatePerCarat
                                    ? ` @ ${formatCurrency(stone.fixedRatePerCarat)}/ct`
                                    : stone.slabInfo
                                      ? ` @ ${formatCurrency(stone.slabInfo.pricePerCarat)}/ct`
                                      : ""}
                                </p>
                              </div>
                              <span className="shrink-0 text-sm text-muted-foreground tabular">
                                {formatCurrency(stone.totalCost)}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div
                          data-estimation-summary-stones-total
                          className={cn(
                            "flex items-center justify-between border-t border-border",
                            compact ? "py-2.5" : "py-3",
                          )}
                        >
                          <div className="flex min-w-0 items-baseline gap-1.5 whitespace-nowrap">
                            <span className="text-sm font-medium">
                              Total {group.label}
                            </span>
                            <span className="shrink-0 text-xs text-muted-foreground tabular">
                              ({formatWeight(group.totalWeight, "ct")})
                            </span>
                          </div>
                          <span className="shrink-0 text-sm font-semibold tabular">
                            {formatCurrency(group.totalCost)}
                          </span>
                        </div>
                      </div>
                    ))}
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
              data-estimation-summary-section
            >
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-medium">Subtotal</span>
                <span className="text-sm font-semibold tabular">
                  {formatCurrency(displaySubtotal)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-medium">
                  GST ({(summary.gstRate * 100).toFixed(1)}%)
                </span>
                <span className="text-sm font-semibold tabular">
                  {formatCurrency(displayGst)}
                </span>
              </div>
            </div>

            <div
              className={cn(
                "flex items-center justify-between gap-4 bg-foreground px-4 text-background",
                compact ? "py-3" : "py-3.5",
              )}
              data-estimation-summary-total
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
          </>
        )}

        <div
          className={cn(
            "border-t border-border bg-muted/20 px-4",
            compact ? "py-2.5" : "py-3",
          )}
          data-estimation-summary-terms
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
          {renderActions(downloadProps)}
        </div>
      ) : null}
    </section>
  );
}
