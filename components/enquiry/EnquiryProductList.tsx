"use client";

import {
  ChevronDown,
  Check,
  Download,
  FileImage,
  FileText,
  Package,
  Share2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { EnquiryEstimationPrintView } from "@/components/enquiry/EnquiryEstimationPrintView";
import { RequirementDetailsPanel } from "@/components/enquiry/requirements/RequirementDetailsPanel";
import { RequirementMediaPanel } from "@/components/enquiry/requirements/RequirementMediaPanel";
import {
  normalizeRequirementItems,
  type RequirementDisplayItem,
} from "@/components/enquiry/requirements/requirement-display-utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCalculatorSettings } from "@/hooks/useCalculatorSettings";
import { computeEstimateFromInputs } from "@/lib/calculator/pricing";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type {
  CalculatorSettings,
  CalculatorStoneInput,
  EnquiryCustomProduct,
  EnquiryItemStatus,
  EnquirySelectedProduct,
  ProductEstimation,
} from "@/types";

type StatusFilter = "ALL" | EnquiryItemStatus;
type DownloadFormat = "pdf" | "png";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "ESTIMATED", label: "Estimated" },
];
const ENQUIRY_DOWNLOAD_FORMAT_KEY = "evol:enquiry-item-download-format";

interface EnquiryProductListProps {
  enquiryRefCode: number;
  selectedProducts: EnquirySelectedProduct[];
  customProducts: EnquiryCustomProduct[];
  estimations: ProductEstimation[];
  isFinalized: boolean;
  isSavingEstimation?: boolean;
  onSaveEstimation: (estimation: ProductEstimation) => void;
}

export function EnquiryProductList({
  enquiryRefCode,
  selectedProducts,
  customProducts,
  estimations,
  isFinalized,
  isSavingEstimation,
  onSaveEstimation,
}: EnquiryProductListProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [activeIndex, setActiveIndex] = useState(0);
  const { settings } = useCalculatorSettings();

  const items = useMemo(() => {
    const recomputedEstimations = estimations
      .map((estimation) => recomputeEstimationTotal(estimation, settings))
      .filter((item): item is ProductEstimation => Boolean(item));

    return normalizeRequirementItems({
      selectedProducts,
      customProducts,
      estimations: recomputedEstimations,
    });
  }, [customProducts, estimations, selectedProducts, settings]);

  const filteredItems =
    statusFilter === "ALL"
      ? items
      : items.filter((item) => item.status === statusFilter);
  const activeItem = filteredItems[activeIndex];

  useEffect(() => {
    setActiveIndex(0);
  }, [statusFilter]);

  useEffect(() => {
    if (activeIndex > Math.max(filteredItems.length - 1, 0)) {
      setActiveIndex(0);
    }
  }, [activeIndex, filteredItems.length]);

  return (
    <div className="space-y-4">
      <Header
        totalCount={items.length}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      {items.length === 0 ? (
        <EmptyState label="No products added to this enquiry." />
      ) : filteredItems.length === 0 ? (
        <EmptyState label="No products match this status." dashed />
      ) : activeItem ? (
        <RequirementCarouselCard
          item={activeItem}
          enquiryRefCode={enquiryRefCode}
          activeIndex={activeIndex}
          totalCount={filteredItems.length}
          settings={settings}
          isFinalized={isFinalized}
          isSavingEstimation={isSavingEstimation}
          onSaveEstimation={onSaveEstimation}
          onSelectItem={setActiveIndex}
        />
      ) : null}
    </div>
  );
}

function Header({
  totalCount,
  statusFilter,
  onStatusFilterChange,
}: {
  totalCount: number;
  statusFilter: StatusFilter;
  onStatusFilterChange: (value: StatusFilter) => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-semibold text-muted-foreground">
        Product Requirements ({totalCount} item{totalCount === 1 ? "" : "s"})
      </p>
      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="w-full bg-background sm:w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function RequirementCarouselCard({
  item,
  enquiryRefCode,
  activeIndex,
  totalCount,
  settings,
  isFinalized,
  isSavingEstimation,
  onSaveEstimation,
  onSelectItem,
}: {
  item: RequirementDisplayItem;
  enquiryRefCode: number;
  activeIndex: number;
  totalCount: number;
  settings: CalculatorSettings;
  isFinalized: boolean;
  isSavingEstimation?: boolean;
  onSaveEstimation: (estimation: ProductEstimation) => void;
  onSelectItem: (index: number) => void;
}) {
  const hasMany = totalCount > 1;
  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<DownloadFormat>("pdf");
  const printViewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedFormat = localStorage.getItem(ENQUIRY_DOWNLOAD_FORMAT_KEY);
    if (storedFormat === "pdf" || storedFormat === "png") {
      setDownloadFormat(storedFormat);
    }
  }, []);

  async function handleDownloadPdf() {
    const printView = printViewRef.current;
    const printableContent = printView?.firstElementChild;

    if (!printableContent) {
      toast.error("Could not prepare the PDF export.");
      return;
    }

    setIsDownloadMenuOpen(false);

    const existingPrintRoot = document.getElementById("enquiry-print-root");
    existingPrintRoot?.remove();

    const printRoot = document.createElement("div");
    printRoot.id = "enquiry-print-root";

    const exportNode = printableContent.cloneNode(true) as HTMLElement;
    exportNode.style.display = "block";
    exportNode.style.maxWidth = "680px";
    exportNode.style.width = "680px";
    printRoot.appendChild(exportNode);
    document.body.appendChild(printRoot);

    try {
      await waitForImages(printRoot);
      window.print();
    } finally {
      window.setTimeout(() => printRoot.remove(), 500);
    }
  }

  async function handleDownloadPng() {
    try {
      const dataUrl = await createExportPngDataUrl();
      downloadDataUrl(
        dataUrl,
        `enquiry-${enquiryRefCode}-${slugifyFilePart(item.title)}.png`,
      );
      toast.success("PNG downloaded");
    } catch {
      toast.error("Could not download PNG. Try again after images load.");
    }
  }

  async function createExportPngDataUrl() {
    const printView = printViewRef.current;
    const printableContent = printView?.firstElementChild;

    if (!printableContent) {
      throw new Error("Could not prepare the PNG export.");
    }

    setIsDownloadMenuOpen(false);

    const exportNode = printableContent.cloneNode(true) as HTMLElement;
    prepareExportNode(exportNode);

    const container = document.createElement("div");
    container.style.background = "#ffffff";
    container.style.left = "0";
    container.style.pointerEvents = "none";
    container.style.position = "absolute";
    container.style.top = "0";
    container.style.zIndex = "-1";
    container.appendChild(exportNode);
    document.body.appendChild(container);

    try {
      await waitForImages(container);
      const { toPng } = await import("html-to-image");
      return await toPng(exportNode, {
        backgroundColor: "#ffffff",
        cacheBust: true,
        pixelRatio: 2,
        width: 680,
      });
    } finally {
      container.remove();
    }
  }

  async function handleSharePng() {
    setIsSharing(true);
    try {
      const dataUrl = await createExportPngDataUrl();
      const blob = dataUrlToBlob(dataUrl);
      await sharePngBlob(
        blob,
        `enquiry-${enquiryRefCode}-${slugifyFilePart(item.title)}.png`,
        item.title,
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;

      toast.error(
        error instanceof Error
          ? error.message
          : "Could not share PNG from this device.",
      );
    } finally {
      setIsSharing(false);
    }
  }

  function selectDownloadFormat(format: DownloadFormat) {
    setDownloadFormat(format);
    localStorage.setItem(ENQUIRY_DOWNLOAD_FORMAT_KEY, format);
  }

  function handlePrimaryDownload() {
    if (downloadFormat === "pdf") {
      void handleDownloadPdf();
      return;
    }

    void handleDownloadPng();
  }

  function handleFormatDownload(format: DownloadFormat) {
    selectDownloadFormat(format);

    if (format === "pdf") {
      void handleDownloadPdf();
      return;
    }

    void handleDownloadPng();
  }

  return (
    <article className="overflow-hidden rounded-lg border border-border">
      <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2.5">
        <p className="text-sm font-medium uppercase tracking-wide text-foreground">
          Item {activeIndex + 1}{" "}
          <span className="font-normal text-muted-foreground">
            of {totalCount}
          </span>
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void handleSharePng()}
            disabled={isSharing}
            className="h-8 gap-1.5 rounded-md px-2.5 text-xs sm:hidden"
          >
            <Share2 className="size-3.5" />
            <span className="hidden sm:inline">
              {isSharing ? "Sharing..." : "Share PNG"}
            </span>
          </Button>
          <Popover
            open={isDownloadMenuOpen}
            onOpenChange={setIsDownloadMenuOpen}
          >
            <div className="inline-flex overflow-hidden rounded-md border border-input shadow-xs">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handlePrimaryDownload}
                className="h-8 gap-1.5 rounded-none border-0 px-2.5 text-xs shadow-none hover:bg-accent"
              >
                <Download className="size-3.5" />
                <span className="hidden sm:inline">
                  Download .{downloadFormat}
                </span>
                <span className="sm:hidden">.{downloadFormat}</span>
              </Button>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="h-8 w-7 rounded-none border-0 border-l border-input shadow-none hover:bg-accent"
                  aria-label="Choose download format"
                >
                  <ChevronDown className="size-3.5 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
            </div>
            <PopoverContent align="end" className="w-48 p-1">
              <button
                type="button"
                onClick={() => handleFormatDownload("pdf")}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
              >
                <FileText className="size-4 text-muted-foreground" />
                <span className="flex-1">Download as .pdf</span>
                {downloadFormat === "pdf" ? <Check className="size-4" /> : null}
              </button>
              <button
                type="button"
                onClick={() => handleFormatDownload("png")}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
              >
                <FileImage className="size-4 text-muted-foreground" />
                <span className="flex-1">Download as .png</span>
                {downloadFormat === "png" ? <Check className="size-4" /> : null}
              </button>
            </PopoverContent>
          </Popover>
          {hasMany ? (
            <div className="hidden items-center gap-1.5 sm:flex">
              {Array.from({ length: totalCount }).map((_, index) => (
                <button
                  type="button"
                  key={index}
                  onClick={() => onSelectItem(index)}
                  aria-label={`Show requirement ${index + 1}`}
                  className={cn(
                    "h-1.5 rounded-full transition-colors",
                    index === activeIndex
                      ? "w-6 bg-foreground"
                      : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60",
                  )}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 p-3 lg:grid-cols-[minmax(15rem,1fr)_minmax(0,2fr)] lg:p-4">
        <RequirementMediaPanel
          item={item}
          settings={settings}
          isFinalized={isFinalized}
          isSavingEstimation={isSavingEstimation}
          onSaveEstimation={onSaveEstimation}
        />
        <RequirementDetailsPanel item={item} />
      </div>
      <EnquiryEstimationPrintView
        ref={printViewRef}
        item={item}
        enquiryRefCode={enquiryRefCode}
      />
    </article>
  );
}

function prepareExportNode(exportNode: HTMLElement) {
  exportNode.style.background = "#ffffff";
  exportNode.style.color = "#111111";
  exportNode.style.display = "block";
  exportNode.style.maxWidth = "680px";
  exportNode.style.width = "680px";

  exportNode.querySelectorAll<HTMLElement>("*").forEach((node) => {
    const computedColor = window.getComputedStyle(node).color;
    if (!computedColor || computedColor === "rgba(0, 0, 0, 0)") {
      node.style.color = "#111111";
    }
  });
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

function dataUrlToBlob(dataUrl: string) {
  const [header, base64Data] = dataUrl.split(",");
  const mimeType = header.match(/data:(.*);base64/)?.[1] ?? "image/png";
  const binary = atob(base64Data);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type: mimeType });
}

async function sharePngBlob(blob: Blob, filename: string, title: string) {
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

function slugifyFilePart(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "item"
  );
}

async function waitForImages(container: HTMLElement) {
  const images = Array.from(container.querySelectorAll("img"));

  await Promise.all(
    images.map(
      (image) =>
        new Promise<void>((resolve) => {
          if (image.complete) {
            resolve();
            return;
          }

          image.onload = () => resolve();
          image.onerror = () => resolve();
        }),
    ),
  );
}

function EmptyState({ label, dashed }: { label: string; dashed?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-xl border px-5 py-10 text-center",
        dashed ? "border-dashed border-border" : "border-border bg-card",
      )}
    >
      <Package className="mx-auto mb-3 size-6 text-muted-foreground/40" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function getStoneTypeIdByName(settings: CalculatorSettings, name: string) {
  const normalizedName = name.trim().toLowerCase();
  return (
    settings.stoneTypes.find(
      (stone) => stone.name.trim().toLowerCase() === normalizedName,
    )?.stoneId ??
    settings.stoneTypes[0]?.stoneId ??
    ""
  );
}

function estimationToCalculatorStones(
  estimation: ProductEstimation,
  settings: CalculatorSettings,
): CalculatorStoneInput[] {
  return estimation.stoneDetails.map((stone) => ({
    id: stone.id,
    stoneTypeId: getStoneTypeIdByName(settings, stone.type),
    weight: stone.netWeight,
    quantity: stone.pieces,
  }));
}

function recomputeEstimationTotal(
  estimation: ProductEstimation | undefined,
  settings: CalculatorSettings,
): ProductEstimation | undefined {
  if (!estimation) return undefined;

  const breakdown = computeEstimateFromInputs(
    settings,
    estimation.metalWeight,
    estimation.purity,
    estimationToCalculatorStones(estimation, settings),
    { makingCostOverride: estimation.makingCost ?? 0 },
  );

  return {
    ...estimation,
    finalAmount: Math.round(breakdown.total),
  };
}
