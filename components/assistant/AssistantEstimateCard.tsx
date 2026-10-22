"use client";

import { Calculator } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { toast } from "sonner";
import { EstimationSummaryCard } from "@/components/calculator/EstimationSummaryCard";
import { Button } from "@/components/ui/button";
import { useCalculatorSettings } from "@/hooks/useCalculatorSettings";
import {
  assistantEstimateImageUrls,
  assistantEstimateToEstimation,
} from "@/lib/assistantEstimate";
import { queueCalculatorImport } from "@/lib/calculator/import";
import { buildEnquiryCalculatorForm } from "@/lib/enquiryCalculator";
import { createEnquiryEstimateSummary } from "@/lib/enquiryEstimateSummary";
import type { AssistantEstimateCard as EstimateCardData } from "@/types/assistant";

/** The calculator's estimate summary for an assistant estimate. */
export function AssistantEstimateCard({ card }: { card: EstimateCardData }) {
  const router = useRouter();
  const { settings, isLoading, error } = useCalculatorSettings();
  const estimation = useMemo(() => assistantEstimateToEstimation(card), [card]);
  const imageUrls = useMemo(() => assistantEstimateImageUrls(card), [card]);
  const estimate = useMemo(() => {
    const result = createEnquiryEstimateSummary({
      estimation,
      settings,
      productName: card.title,
      imageUrls,
      reference: "Assistant estimate",
      itemLabel: card.title,
    });
    return {
      ...result,
      summary: { ...result.summary, code: card.productCode ?? "" },
    };
  }, [estimation, settings, card.title, card.productCode, imageUrls]);

  const loadCalculator = (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-8 gap-1.5 text-xs"
      disabled={isLoading}
      onClick={() => {
        try {
          const form = buildEnquiryCalculatorForm({
            settings,
            productId: estimation.id,
            productName: card.title,
            metalType: card.metal.type,
            purity: card.metal.purity,
            imageUrls,
            estimation,
          });
          router.push(
            queueCalculatorImport(
              {
                ...form,
                diamondColor: estimate.summary.diamondColor,
                diamondClarity: estimate.summary.diamondClarity,
              },
              card.gstPercent !== undefined,
            ),
          );
        } catch {
          toast.error(
            "Could not load the estimate into the calculator. Try again.",
          );
        }
      }}
    >
      <Calculator className="size-3.5" />
      Load in calculator
    </Button>
  );

  if (isLoading)
    return (
      <output className="block py-4 text-sm text-muted-foreground">
        Loading estimate rates…
      </output>
    );
  if (error || estimate.unpricedItems.length > 0)
    return (
      <div role="alert" className="space-y-2 rounded-xl border p-4 text-sm">
        <p className="font-medium">
          {error
            ? "Estimate rates could not be loaded"
            : "Pricing is incomplete"}
        </p>
        {estimate.unpricedItems.length > 0 ? (
          <ul className="list-inside list-disc text-muted-foreground">
            {estimate.unpricedItems.map((name, index) => (
              <li key={`${index}-${name}`}>{name}</li>
            ))}
          </ul>
        ) : null}
        <div className="flex justify-end">{loadCalculator}</div>
      </div>
    );

  return (
    <EstimationSummaryCard
      title={card.title}
      data={{ kind: "summary", summary: estimate.summary }}
      downloadFilename={`${card.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-estimate.png`}
      renderHeaderActions={() => loadCalculator}
    />
  );
}
