"use client";

import { Calculator, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { EstimationSummaryCard } from "@/components/calculator/EstimationSummaryCard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createEnquiryEstimateSummary } from "@/lib/enquiryEstimateSummary";
import { queueCalculatorImport } from "@/lib/calculator/import";
import { buildEnquiryCalculatorForm } from "@/lib/enquiryCalculator";
import { formatCurrency } from "@/lib/utils";
import type { CalculatorSettings } from "@/types";
import type { RequirementDisplayItem } from "./requirements/requirement-display-utils";

export function EnquiryEstimateSummary({
  item,
  enquiryRefCode,
  itemNumber,
  settings,
  isLoading,
  hasSettingsError,
  isCalculatorDisabled,
}: {
  item: RequirementDisplayItem;
  enquiryRefCode: number;
  itemNumber: number;
  settings: CalculatorSettings;
  isLoading: boolean;
  hasSettingsError: boolean;
  isCalculatorDisabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const estimate = useMemo(
    () =>
      item.estimation
        ? createEnquiryEstimateSummary({
            estimation: item.estimation,
            settings,
            productName: item.title,
            imageUrls: item.images.flatMap((image) =>
              image.url ? [image.url] : [],
            ),
            reference: `Enquiry #${enquiryRefCode}`,
            itemLabel: `Item ${itemNumber}`,
          })
        : null,
    [item, settings, enquiryRefCode, itemNumber],
  );
  if (!estimate) return null;
  const hasPrice =
    !isLoading && !hasSettingsError && estimate.unpricedItems.length === 0;
  const loadCalculator = (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-8 gap-1.5 text-xs"
      disabled={isCalculatorDisabled}
      onClick={() => {
        try {
          const form = buildEnquiryCalculatorForm({
            settings,
            productId: item.id,
            productName: item.title,
            metalType: item.metalType ?? "Gold",
            purity: item.defaultPurity,
            imageUrls: estimate.summary.imageUrls,
            estimation: item.estimation,
          });
          const url = queueCalculatorImport({
            ...form,
            diamondColor: estimate.summary.diamondColor,
            diamondClarity: estimate.summary.diamondClarity,
          });
          setOpen(false);
          router.push(url);
        } catch {
          toast.error(
            "Could not load the estimate into the calculator. Try again.",
          );
        }
      }}
    >
      <Calculator className="size-3.5" />
      Load into calculator
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={`Open estimation breakup for ${item.title}`}
          className="group w-full cursor-pointer rounded-xl border border-border bg-muted/20 p-4 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex items-start justify-between gap-4">
            <span className="space-y-1">
              <span className="block text-xs font-medium text-muted-foreground">
                Estimated total
              </span>
              <span className="block text-2xl font-semibold tracking-tight tabular-nums">
                {hasPrice
                  ? formatCurrency(estimate.summary.total)
                  : isLoading
                    ? "Loading rates…"
                    : "Pricing incomplete"}
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground group-hover:text-foreground">
              Breakup <ChevronRight className="size-4" />
            </span>
          </span>
          <span className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
            <span>
              {item.estimation?.metalWeight} g ·{" "}
              {item.estimation?.metalType ?? "Gold"} {item.estimation?.purity}
            </span>
            <span>{estimate.summary.documentDetails?.estimatedOn}</span>
          </span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto p-4 sm:max-w-3xl sm:p-6">
        <DialogHeader className="pr-6 text-left">
          <DialogTitle>Customer estimate</DialogTitle>
          <DialogDescription>{`Enquiry #${enquiryRefCode} · Item ${itemNumber} · ${item.title}`}</DialogDescription>
        </DialogHeader>
        {isLoading || hasSettingsError || estimate.unpricedItems.length > 0 ? (
          <div className="flex justify-end">{loadCalculator}</div>
        ) : null}
        {isLoading ? (
          <p
            role="status"
            className="py-8 text-center text-sm text-muted-foreground"
          >
            Loading estimate rates…
          </p>
        ) : hasSettingsError ? (
          <p
            role="alert"
            className="rounded-lg border p-4 text-sm text-muted-foreground"
          >
            Estimate rates could not be loaded. Reload the enquiry to try again.
          </p>
        ) : estimate.unpricedItems.length > 0 ? (
          <div role="alert" className="space-y-2 rounded-lg border p-4 text-sm">
            <p className="font-medium">Pricing is incomplete</p>
            <p className="text-muted-foreground">
              Add a valid rate or correct the estimate to view its complete
              breakup.
            </p>
            <ul className="list-inside list-disc text-muted-foreground">
              {estimate.unpricedItems.map((name, index) => (
                <li key={`${index}-${name}`}>{name}</li>
              ))}
            </ul>
          </div>
        ) : (
          <EstimationSummaryCard
            key={item.estimation?.id}
            title="Breakup"
            className="border-0 p-0 sm:p-0"
            data={{ kind: "summary", summary: estimate.summary }}
            downloadFilename={`enquiry-${enquiryRefCode}-item-${itemNumber}-estimate.png`}
            renderHeaderActions={() => loadCalculator}
          />
        )}
        <p className="text-xs text-muted-foreground">
          Prices use available calculator rates.
        </p>
      </DialogContent>
    </Dialog>
  );
}
