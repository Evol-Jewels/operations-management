"use client";

import {
  Calculator,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Mic,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { EnquiryEstimationDialog } from "@/components/enquiry/EnquiryEstimationDialog";
import { AudioPreviewPlayer } from "@/components/requirements/AudioPreviewPlayer";
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
      <RequirementImageCarousel key={item.id} item={item} />
      <RequirementRecordedMedia item={item} />
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
  const images = item.images.filter(
    (image): image is typeof image & { url: string } => Boolean(image.url),
  );
  const hasMany = images.length > 1;
  const safeIndex = Math.min(index, Math.max(images.length - 1, 0));
  const image = images[safeIndex];

  if (!image?.url) {
    if (item.videos.length > 0 || item.audios.length > 0) return null;
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
      {hasMany ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((imageItem, imageIndex) => (
            <button
              key={imageItem.id}
              type="button"
              onClick={() => setIndex(imageIndex)}
              className={cn(
                "relative size-12 shrink-0 overflow-hidden rounded-md border transition-all",
                imageIndex === safeIndex
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

function RequirementRecordedMedia({ item }: { item: RequirementDisplayItem }) {
  const videos = item.videos.filter(
    (reference): reference is typeof reference & { url: string } =>
      Boolean(reference.url),
  );
  const audios = item.audios.filter(
    (reference): reference is typeof reference & { url: string } =>
      Boolean(reference.url),
  );

  if (videos.length === 0 && audios.length === 0) return null;

  return (
    <div className="space-y-3">
      {videos.map((reference) => (
        <div
          key={reference.id}
          className="overflow-hidden rounded-xl border border-border bg-black"
        >
          <video
            src={reference.url}
            controls
            playsInline
            preload="metadata"
            className="aspect-video w-full object-contain"
          >
            <track kind="captions" />
          </video>
        </div>
      ))}
      {audios.map((reference) => (
        <div
          key={reference.id}
          className="space-y-2 rounded-xl border border-border bg-muted/20 p-3"
        >
          <div className="flex min-w-0 items-center gap-2 text-xs font-medium">
            <Mic className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate">
              {reference.name || "Audio recording"}
            </span>
          </div>
          <AudioPreviewPlayer
            src={reference.url}
            durationSeconds={reference.durationSeconds}
            className="border-0 bg-background"
          />
        </div>
      ))}
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
      <dl className="mt-3 grid gap-1.5 border-t border-dashed border-border pt-3 text-xs">
        {estimation.makingCost !== undefined ? (
          <EstimateDetail
            label="Making charge"
            value={formatCurrency(estimation.makingCost)}
          />
        ) : null}
        {estimation.stoneDetails.map((stone, index) => (
          <EstimateDetail
            key={stone.id}
            label={`Stone ${index + 1}`}
            value={`${stone.type} · ${stone.netWeight} ct · ${stone.pieces} pcs`}
          />
        ))}
      </dl>
      <Calculator className="mt-3 size-4 text-muted-foreground/50" />
    </div>
  );
}

function EstimateDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-right font-medium text-foreground">
        {value}
      </dd>
    </div>
  );
}
