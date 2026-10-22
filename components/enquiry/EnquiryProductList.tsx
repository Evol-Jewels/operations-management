"use client";

import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  FileImage,
  FileText,
  Loader2,
  Package,
} from "lucide-react";
import { type ReactNode, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { EnquiryEstimationPrintView } from "@/components/enquiry/EnquiryEstimationPrintView";
import { EnquiryEstimateSummary } from "@/components/enquiry/EnquiryEstimateSummary";
import { EnquiryEstimationDialog } from "@/components/enquiry/EnquiryEstimationDialog";
import {
  RequirementCard,
  RequirementCardBody,
} from "@/components/enquiry/requirements/RequirementCard";
import {
  type OrderVendorDetailsDisplay,
  RequirementDetailsPanel,
} from "@/components/enquiry/requirements/RequirementDetailsPanel";
import { RequirementMediaPanel } from "@/components/enquiry/requirements/RequirementMediaPanel";
import {
  normalizeRequirementItems,
  type RequirementDisplayItem,
} from "@/components/enquiry/requirements/requirement-display-utils";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
import { useItemEstimations } from "@/hooks/useEnquiries";
import { mapBackendEstimationToProductEstimation } from "@/lib/enquiryMappers";
import { computeEnquiryEstimate } from "@/lib/enquiryEstimation";
import { createPdfFromImage } from "@/lib/pdf-export";
import { sharePngToWhatsApp } from "@/lib/share-image";
import { cn } from "@/lib/utils";
import type {
  CalculatorSettings,
  EnquiryCustomProduct,
  EnquiryItemStatus,
  EnquirySelectedProduct,
  ProductEstimation,
  RecordType,
} from "@/types";

type StatusFilter = "ALL" | EnquiryItemStatus;
type DownloadFormat = "pdf" | "png";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "ESTIMATED", label: "Estimated" },
];
const ENQUIRY_DOWNLOAD_FORMAT_KEY = "evol:enquiry-item-download-format";
const PNG_EXPORT_CONTENT_WIDTH = 680;
const PNG_EXPORT_PADDING = 32;
const PNG_EXPORT_WIDTH = PNG_EXPORT_CONTENT_WIDTH + PNG_EXPORT_PADDING * 2;

interface EnquiryProductListProps {
  enquiryRefCode: number;
  recordType?: RecordType;
  selectedProducts: EnquirySelectedProduct[];
  customProducts: EnquiryCustomProduct[];
  estimations: ProductEstimation[];
  isFinalized: boolean;
  isMarkedEstimated?: boolean;
  isSavingEstimation?: boolean;
  showHeader?: boolean;
  vendorDetails?: OrderVendorDetailsDisplay;
  renderDownloadActions?: (pdf: ItemPdfExport) => ReactNode;
  onSaveEstimation: (estimation: ProductEstimation) => void | Promise<void>;
}

export interface ItemPdfExport {
  itemTitle: string;
  fileName: string;
  preview: () => void;
  createFile: () => Promise<File>;
}

export function EnquiryProductList({
  enquiryRefCode,
  recordType = "enquiry",
  selectedProducts,
  customProducts,
  estimations,
  isFinalized,
  isMarkedEstimated = false,
  isSavingEstimation,
  showHeader = true,
  vendorDetails,
  renderDownloadActions,
  onSaveEstimation,
}: EnquiryProductListProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [activeItemId, setActiveItemId] = useState<string>();
  const {
    settings,
    isLoading: isLoadingRates,
    error: ratesError,
  } = useCalculatorSettings();

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
  const activeIndex = Math.max(
    filteredItems.findIndex((item) => item.id === activeItemId),
    0,
  );
  const activeItem = filteredItems[activeIndex];

  return (
    <div className="space-y-4">
      {showHeader ? (
        <Header
          totalCount={items.length}
          statusFilter={statusFilter}
          onStatusFilterChange={(nextFilter) => {
            setStatusFilter(nextFilter);
            setActiveItemId(undefined);
          }}
        />
      ) : null}

      {items.length === 0 ? (
        <EmptyState label="No products added to this enquiry." />
      ) : filteredItems.length === 0 ? (
        <EmptyState label="No products match this status." dashed />
      ) : activeItem ? (
        <RequirementCarouselCard
          key={activeItem.id}
          item={activeItem}
          itemNumber={items.findIndex((item) => item.id === activeItem.id) + 1}
          enquiryRefCode={enquiryRefCode}
          recordType={recordType}
          activeIndex={activeIndex}
          totalCount={filteredItems.length}
          itemIds={filteredItems.map((filteredItem) => filteredItem.id)}
          settings={settings}
          isLoadingRates={isLoadingRates}
          hasRatesError={Boolean(ratesError)}
          isFinalized={isFinalized}
          isMarkedEstimated={isMarkedEstimated}
          isSavingEstimation={isSavingEstimation}
          vendorDetails={vendorDetails}
          renderDownloadActions={renderDownloadActions}
          onSaveEstimation={onSaveEstimation}
          onSelectItem={(index) => setActiveItemId(filteredItems[index]?.id)}
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
    <div className="flex items-center justify-between gap-3">
      <p className="min-w-0 text-sm font-semibold text-muted-foreground">
        <span className="max-sm:hidden">Product </span>Requirements (
        {totalCount}
        <span className="max-sm:hidden">
          {" "}
          item{totalCount === 1 ? "" : "s"}
        </span>
        )
      </p>
      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="w-36 shrink-0 bg-background sm:w-44">
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
  item: initialItem,
  itemNumber,
  enquiryRefCode,
  recordType,
  activeIndex,
  totalCount,
  itemIds,
  settings,
  isLoadingRates,
  hasRatesError,
  isFinalized,
  isMarkedEstimated,
  isSavingEstimation,
  vendorDetails,
  renderDownloadActions,
  onSaveEstimation,
  onSelectItem,
}: {
  item: RequirementDisplayItem;
  itemNumber: number;
  enquiryRefCode: number;
  recordType: RecordType;
  activeIndex: number;
  totalCount: number;
  itemIds: string[];
  settings: CalculatorSettings;
  isLoadingRates: boolean;
  hasRatesError: boolean;
  isFinalized: boolean;
  isMarkedEstimated: boolean;
  isSavingEstimation?: boolean;
  vendorDetails?: OrderVendorDetailsDisplay;
  renderDownloadActions?: (pdf: ItemPdfExport) => ReactNode;
  onSaveEstimation: (estimation: ProductEstimation) => void | Promise<void>;
  onSelectItem: (index: number) => void;
}) {
  const needsEstimationLookup =
    recordType === "enquiry" &&
    (initialItem.status === "ESTIMATED" || isMarkedEstimated) &&
    !initialItem.estimation;
  const estimateQuery = useItemEstimations(
    initialItem.id,
    needsEstimationLookup,
  );
  const item = useMemo(() => {
    const saved =
      recordType === "enquiry" ? estimateQuery.data?.[0] : undefined;
    if (initialItem.estimation || !saved) return initialItem;
    return {
      ...initialItem,
      estimation: recomputeEstimationTotal(
        mapBackendEstimationToProductEstimation(saved, initialItem.id),
        settings,
      ),
    };
  }, [initialItem, recordType, estimateQuery.data, settings]);
  const isLoadingEstimate = needsEstimationLookup && estimateQuery.isPending;
  const hasEstimateError =
    needsEstimationLookup && estimateQuery.isError && !item.estimation;
  const hasMany = totalCount > 1;
  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [hideVendorDetails, setHideVendorDetails] = useState(
    recordType === "enquiry",
  );
  const [downloadFormat, setDownloadFormat] = useState<DownloadFormat>("pdf");
  const printViewRef = useRef<HTMLDivElement>(null);
  const pdfFileName = `${recordType}-${enquiryRefCode}-${slugifyFilePart(item.title)}.pdf`;

  function handleDownloadMenuOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      const storedFormat = localStorage.getItem(ENQUIRY_DOWNLOAD_FORMAT_KEY);
      if (storedFormat === "pdf" || storedFormat === "png") {
        setDownloadFormat(storedFormat);
      }
    }
    setIsDownloadMenuOpen(nextOpen);
  }

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
        `${recordType}-${enquiryRefCode}-${slugifyFilePart(item.title)}.png`,
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
        width: PNG_EXPORT_WIDTH,
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
      const result = await sharePngToWhatsApp({
        blob,
        filename: `${recordType}-${enquiryRefCode}-${slugifyFilePart(item.title)}.png`,
        title: item.title,
      });
      if (result === "whatsapp-clipboard") {
        toast.success("PNG copied. Paste it into the WhatsApp chat (Ctrl+V).", {
          duration: 7000,
        });
      }
      if (result === "whatsapp-download") {
        toast.success("PNG downloaded. Attach it in the WhatsApp chat.", {
          duration: 7000,
        });
      }
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

  function handleWhatsAppShare() {
    setIsDownloadMenuOpen(false);
    void handleSharePng();
  }

  return (
    <RequirementCard>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-border px-3 py-2.5">
        <div className="flex items-center gap-1">
          <p className="text-sm font-medium uppercase tracking-wide text-foreground">
            Item {activeIndex + 1}{" "}
            <span className="font-normal text-muted-foreground">
              of {totalCount}
            </span>
          </p>
          {hasMany ? (
            <div className="ml-2 flex items-center gap-1 pointer-fine:sm:hidden">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-9"
                aria-label="Previous requirement"
                onClick={() =>
                  onSelectItem((activeIndex - 1 + totalCount) % totalCount)
                }
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-9"
                aria-label="Next requirement"
                onClick={() => onSelectItem((activeIndex + 1) % totalCount)}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 max-sm:contents sm:ml-auto">
          {(item.kind === "custom" && vendorDetails) ||
          item.estimation?.vendorName ? (
            <Label className="flex min-h-9 cursor-pointer max-sm:ml-auto items-center gap-2 rounded-md px-1.5 text-xs font-normal text-muted-foreground hover:text-foreground sm:min-h-8">
              <Checkbox
                className="min-h-0"
                checked={hideVendorDetails}
                onCheckedChange={(checked) =>
                  setHideVendorDetails(checked === true)
                }
                aria-label="Hide vendor details"
              />
              <span className="hidden sm:inline">Hide vendor details</span>
              <span className="sm:hidden">Hide vendor</span>
            </Label>
          ) : null}
          <div className="flex flex-wrap items-center gap-2 max-sm:w-full sm:justify-end">
            {isLoadingEstimate ? (
              <span role="status" className="text-xs text-muted-foreground">
                Loading saved estimate…
              </span>
            ) : null}
            {hasEstimateError ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => void estimateQuery.refetch()}
              >
                Retry loading estimate
              </Button>
            ) : null}
            {!isFinalized && !isLoadingEstimate && !hasEstimateError ? (
              <EnquiryEstimationDialog
                productId={item.id}
                productName={item.title}
                defaultPurity={item.defaultPurity}
                defaultMetalType={item.metalType}
                defaultMetalPurity={item.metalPurity}
                imageUrls={item.images.flatMap((image) =>
                  image.url ? [image.url] : [],
                )}
                settings={settings}
                existingEstimation={item.estimation}
                onSave={onSaveEstimation}
                disabled={isSavingEstimation || isLoadingRates || hasRatesError}
                open={calculatorOpen}
                onOpenChange={setCalculatorOpen}
              />
            ) : null}
            <Popover
              open={isDownloadMenuOpen}
              onOpenChange={handleDownloadMenuOpenChange}
            >
              <div className="inline-flex overflow-hidden rounded-md border border-input shadow-xs">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handlePrimaryDownload}
                  disabled={isSharing}
                  className="h-9 gap-1.5 rounded-none border-0 px-2.5 text-xs shadow-none hover:bg-accent sm:h-8"
                >
                  {isSharing ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Download className="size-3.5" />
                  )}
                  <span className="hidden sm:inline">
                    Specification .{downloadFormat}
                  </span>
                  <span className="sm:hidden">Spec .{downloadFormat}</span>
                </Button>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="h-9 w-8 rounded-none border-0 border-l border-input shadow-none hover:bg-accent sm:h-8 sm:w-7"
                    disabled={isSharing}
                    aria-label="Choose specification download or sharing action"
                  >
                    <ChevronDown className="size-3.5 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
              </div>
              <PopoverContent align="end" className="w-56 p-1">
                <button
                  type="button"
                  onClick={() => handleFormatDownload("pdf")}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                >
                  <FileText className="size-4 text-muted-foreground" />
                  <span className="flex-1">Specification as .pdf</span>
                  {downloadFormat === "pdf" ? (
                    <Check className="size-4" />
                  ) : null}
                </button>
                <button
                  type="button"
                  onClick={() => handleFormatDownload("png")}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                >
                  <FileImage className="size-4 text-muted-foreground" />
                  <span className="flex-1">Specification as .png</span>
                  {downloadFormat === "png" ? (
                    <Check className="size-4" />
                  ) : null}
                </button>
                <div className="my-1 h-px bg-border" />
                <button
                  type="button"
                  onClick={handleWhatsAppShare}
                  disabled={isSharing}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
                >
                  {isSharing ? (
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  ) : (
                    <WhatsAppIcon className="size-4 text-[#25D366]" />
                  )}
                  <span className="flex-1">
                    {isSharing
                      ? "Preparing PNG…"
                      : "Share specification on WhatsApp"}
                  </span>
                </button>
              </PopoverContent>
            </Popover>
            {renderDownloadActions?.({
              itemTitle: item.title,
              fileName: pdfFileName,
              preview: () => void handleDownloadPdf(),
              createFile: async () =>
                createPdfFromImage(
                  await createExportPngDataUrl(),
                  pdfFileName,
                  item.title,
                ),
            })}
          </div>
          {hasMany ? (
            <div className="hidden items-center gap-1.5 pointer-fine:sm:flex">
              {itemIds.map((itemId, index) => (
                <button
                  type="button"
                  key={itemId}
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

      {needsEstimationLookup && estimateQuery.isSuccess && !item.estimation ? (
        <p
          role="status"
          className="border-b border-border px-4 py-3 text-sm text-muted-foreground"
        >
          Marked Estimated, but this item has no saved estimate. Add one to view
          its breakup.
        </p>
      ) : null}

      <RequirementCardBody>
        <RequirementMediaPanel
          item={item}
          showEstimation={recordType !== "enquiry"}
        />
        <RequirementDetailsPanel
          item={item}
          vendorDetails={hideVendorDetails ? undefined : vendorDetails}
        />
      </RequirementCardBody>
      {recordType === "enquiry" && item.estimation ? (
        <div className="border-t border-border p-3 @[40rem]/requirement:p-4">
          <EnquiryEstimateSummary
            item={item}
            enquiryRefCode={enquiryRefCode}
            itemNumber={itemNumber}
            settings={settings}
            isLoading={isLoadingRates}
            hasSettingsError={hasRatesError}
            isCalculatorDisabled={
              isSavingEstimation || isLoadingRates || hasRatesError
            }
          />
        </div>
      ) : null}
      <EnquiryEstimationPrintView
        ref={printViewRef}
        item={item}
        enquiryRefCode={enquiryRefCode}
        recordType={recordType}
        vendorDetails={hideVendorDetails ? undefined : vendorDetails}
      />
    </RequirementCard>
  );
}

function prepareExportNode(exportNode: HTMLElement) {
  exportNode.style.background = "#ffffff";
  exportNode.style.boxSizing = "border-box";
  exportNode.style.color = "#111111";
  exportNode.style.display = "block";
  exportNode.style.fontFamily =
    'var(--font-geist-sans), "Segoe UI", sans-serif';
  exportNode.style.maxWidth = `${PNG_EXPORT_WIDTH}px`;
  exportNode.style.padding = `${PNG_EXPORT_PADDING}px`;
  exportNode.style.width = `${PNG_EXPORT_WIDTH}px`;

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
  await document.fonts.ready;
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

function recomputeEstimationTotal(
  estimation: ProductEstimation | undefined,
  settings: CalculatorSettings,
): ProductEstimation | undefined {
  if (!estimation) return undefined;

  const { pricing } = computeEnquiryEstimate(estimation, settings);

  return {
    ...estimation,
    finalAmount: Math.round(pricing.total),
  };
}
