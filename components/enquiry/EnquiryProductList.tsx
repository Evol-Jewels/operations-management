"use client";

import { ChevronLeft, ChevronRight, Download, Package } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { EnquiryEstimationPrintView } from "@/components/enquiry/EnquiryEstimationPrintView";
import { RequirementDetailsPanel } from "@/components/enquiry/requirements/RequirementDetailsPanel";
import { RequirementMediaPanel } from "@/components/enquiry/requirements/RequirementMediaPanel";
import {
  normalizeRequirementItems,
  type RequirementDisplayItem,
} from "@/components/enquiry/requirements/requirement-display-utils";
import { Button } from "@/components/ui/button";
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
import type {
  CalculatorSettings,
  CalculatorStoneInput,
  EnquiryCustomProduct,
  EnquiryItemStatus,
  EnquirySelectedProduct,
  ProductEstimation,
} from "@/types";

type StatusFilter = "ALL" | EnquiryItemStatus;

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "ESTIMATED", label: "Estimated" },
];

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
          onPrevious={() =>
            setActiveIndex((value) =>
              value === 0 ? filteredItems.length - 1 : value - 1,
            )
          }
          onNext={() =>
            setActiveIndex((value) =>
              value === filteredItems.length - 1 ? 0 : value + 1,
            )
          }
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
  onPrevious,
  onNext,
}: {
  item: RequirementDisplayItem;
  enquiryRefCode: number;
  activeIndex: number;
  totalCount: number;
  settings: CalculatorSettings;
  isFinalized: boolean;
  isSavingEstimation?: boolean;
  onSaveEstimation: (estimation: ProductEstimation) => void;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const hasMany = totalCount > 1;

  function handleDownloadPdf() {
    window.print();
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
            onClick={handleDownloadPdf}
            className="h-8 gap-1.5 text-xs"
          >
            <Download className="size-3.5" />
            <span className="hidden sm:inline">Download PDF</span>
            <span className="sm:hidden">PDF</span>
          </Button>
          {hasMany ? (
            <div className="hidden items-center gap-1.5 sm:flex">
              {Array.from({ length: totalCount }).map((_, index) => (
                <span
                  key={index}
                  className={cn(
                    "h-1.5 rounded-full",
                    index === activeIndex
                      ? "w-6 bg-foreground"
                      : "w-1.5 bg-muted-foreground/30",
                  )}
                />
              ))}
            </div>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onPrevious}
            disabled={!hasMany}
            aria-label="Previous requirement"
            className="size-7 text-muted-foreground hover:bg-transparent hover:text-foreground"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onNext}
            disabled={!hasMany}
            aria-label="Next requirement"
            className="size-7 text-muted-foreground hover:bg-transparent hover:text-foreground"
          >
            <ChevronRight className="size-4" />
          </Button>
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
      <EnquiryEstimationPrintView item={item} enquiryRefCode={enquiryRefCode} />
    </article>
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
