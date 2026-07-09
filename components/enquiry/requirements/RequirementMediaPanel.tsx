"use client";

import { Calculator, ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { EnquiryEstimationDialog } from "@/components/enquiry/EnquiryEstimationDialog";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { CalculatorSettings, ProductEstimation } from "@/types";
import type { RequirementDisplayItem } from "./requirement-display-utils";

export function RequirementMediaPanel({
  item,
  settings,
  isFinalized,
  isSavingEstimation,
  onSaveEstimation,
}: {
  item: RequirementDisplayItem;
  settings: CalculatorSettings;
  isFinalized: boolean;
  isSavingEstimation?: boolean;
  onSaveEstimation: (estimation: ProductEstimation) => void;
}) {
  return (
    <div className="space-y-4">
      <RequirementImageCarousel item={item} />
      {!isFinalized ? (
        <div className="flex justify-center">
          <EnquiryEstimationDialog
            productId={item.id}
            productName={item.title}
            defaultPurity={item.defaultPurity}
            settings={settings}
            existingEstimation={item.estimation}
            onSave={onSaveEstimation}
            disabled={isSavingEstimation}
          />
        </div>
      ) : null}
      {item.estimation ? <EstimateCard estimation={item.estimation} /> : null}
    </div>
  );
}

function RequirementImageCarousel({ item }: { item: RequirementDisplayItem }) {
  const [index, setIndex] = useState(0);
  const images = item.images.filter((image) => image.url);
  const hasMany = images.length > 1;
  const image = images[index];

  useEffect(() => {
    setIndex(0);
  }, [item.id]);

  useEffect(() => {
    if (index > Math.max(images.length - 1, 0)) setIndex(0);
  }, [images.length, index]);

  if (!image?.url) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-xl border border-border bg-muted/30">
        <div className="text-center text-muted-foreground">
          <ImageIcon className="mx-auto mb-2 size-7 opacity-60" />
          <p className="text-xs">No image added</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted/30">
        <Image
          src={image.url}
          alt={image.name || item.title}
          fill
          sizes="(max-width: 1024px) 100vw, 320px"
          className="object-contain"
          unoptimized
        />
        {hasMany ? (
          <div className="absolute right-2 bottom-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
            <ImageButton
              icon={ChevronLeft}
              label="Previous image"
              onClick={() =>
                setIndex((value) =>
                  value === 0 ? images.length - 1 : value - 1,
                )
              }
            />
            <ImageButton
              icon={ChevronRight}
              label="Next image"
              onClick={() =>
                setIndex((value) =>
                  value === images.length - 1 ? 0 : value + 1,
                )
              }
            />
          </div>
        ) : null}
      </div>
      {images.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((imageItem, imageIndex) => (
            <button
              key={imageItem.id}
              type="button"
              onClick={() => setIndex(imageIndex)}
              className={cn(
                "relative size-12 shrink-0 overflow-hidden rounded-md border transition-all",
                imageIndex === index
                  ? "border-foreground"
                  : "border-border opacity-65 hover:opacity-100",
              )}
              aria-label={`Show image ${imageIndex + 1}`}
            >
              <Image
                src={imageItem.url}
                alt={imageItem.name || `Reference ${imageIndex + 1}`}
                fill
                sizes="48px"
                className="object-contain"
                unoptimized
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ImageButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof ChevronLeft;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon-xs"
      onClick={onClick}
      className="size-6 border-transparent bg-transparent text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] shadow-none hover:bg-black/20 hover:text-white"
      aria-label={label}
    >
      <Icon className="size-3" />
    </Button>
  );
}

function EstimateCard({ estimation }: { estimation: ProductEstimation }) {
  return (
    <div className="rounded-xl border border-border bg-background px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Estimate
          </p>
          <p className="mt-1 text-xl font-semibold text-foreground">
            {formatCurrency(estimation.finalAmount)}
          </p>
        </div>
        <div className="text-right text-xs leading-5 text-muted-foreground">
          <p>
            {estimation.metalWeight}g {estimation.purity}
          </p>
          <p>{formatDate(estimation.createdAt)}</p>
        </div>
      </div>
      {estimation.vendorName || estimation.notes ? (
        <div className="mt-3 border-t border-dashed border-border pt-3 text-xs text-muted-foreground">
          {estimation.vendorName ? <p>{estimation.vendorName}</p> : null}
          {estimation.notes ? <p className="mt-1">{estimation.notes}</p> : null}
        </div>
      ) : null}
      <Calculator className="mt-3 size-4 text-muted-foreground/50" />
    </div>
  );
}
