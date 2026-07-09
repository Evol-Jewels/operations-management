"use client";

import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { EnquiryColorStone, EnquiryDiamond } from "@/types";
import {
  compactUrl,
  hasValue,
  type RequirementDisplayItem,
} from "./requirement-display-utils";

export function RequirementDetailsPanel({
  item,
}: {
  item: RequirementDisplayItem;
}) {
  const metal = [item.metalType, item.metalPurity].filter(Boolean).join(" ");

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Tag>{item.kind}</Tag>
          <Tag>{item.status.toLowerCase()}</Tag>
        </div>
        <h3 className="text-xl font-semibold leading-tight text-foreground">
          {item.title}
        </h3>
        {item.subtitle ? (
          <p className="mt-1 text-sm uppercase tracking-wide text-muted-foreground">
            {item.subtitle}
          </p>
        ) : null}
      </div>

      <div className="grid gap-5 border-t border-border pt-5 xl:grid-cols-2">
        <DetailSection title="Overview">
          <DetailRow label="Type of order" value={item.details.orderType} />
          <DetailRow label="Category" value={item.title} />
          <DetailRow label="Subcategory" value={item.details.subcategory} />
          <DetailRow label="Product size" value={item.details.productSize} />
          <DetailRow label="Delivery date" value={item.details.deliveryDate} />
        </DetailSection>

        <DetailSection title="Metal">
          <DetailRow label="Metal" value={metal} />
          <DetailRow label="Metal color" value={item.details.metalColor} />
          <DetailRow label="Certification" value={item.details.certification} />
          <DetailRow label="Polish" value={item.details.polish} />
        </DetailSection>
      </div>

      <MiniCarousel
        title="Diamond details"
        items={item.diamonds.filter(hasRecordValues)}
        emptyLabel="No diamond details added."
        renderItem={(diamond) => <DiamondCard diamond={diamond} />}
      />

      <MiniCarousel
        title="Colour stone details"
        items={item.colorStones.filter(hasRecordValues)}
        emptyLabel="No colour stone details added."
        renderItem={(stone) => <ColorStoneCard stone={stone} />}
      />

      <DetailSection title="Making & Budget">
        <DetailRow label="Setting type" value={item.details.settingType} />
        <DetailRow label="Finding type" value={item.details.findingType} />
        <DetailRow label="Gold weight" value={item.metalWeight} />
        <DetailRow label="Budget range" value={item.details.budgetRange} />
      </DetailSection>

      {item.links.length > 0 || item.notes ? (
        <div className="space-y-3 border-t border-dashed border-border pt-4">
          {item.links.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {item.links.map((reference) =>
                reference.url ? (
                  <a
                    key={reference.id}
                    href={reference.url}
                    target="_blank"
                    rel="noreferrer"
                    title={reference.url}
                    className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground transition-colors hover:border-primary/30 hover:text-primary"
                  >
                    <ExternalLink className="size-3" />
                    <span className="truncate">{compactUrl(reference.url)}</span>
                  </a>
                ) : null,
              )}
            </div>
          ) : null}
          {item.notes ? (
            <p className="text-sm leading-6 text-muted-foreground">
              <span className="font-medium text-foreground">Special notes:</span>{" "}
              {item.notes}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function MiniCarousel<T>({
  title,
  items,
  emptyLabel,
  renderItem,
}: {
  title: string;
  items: T[];
  emptyLabel: string;
  renderItem: (item: T) => ReactNode;
}) {
  const [index, setIndex] = useState(0);
  const hasMany = items.length > 1;
  const selectedItem = items[Math.min(index, items.length - 1)];

  useEffect(() => {
    setIndex(0);
  }, [items.length]);

  if (items.length === 0) {
    return (
      <DetailSection title={title}>
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      </DetailSection>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          {title}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {index + 1} of {items.length}
          </span>
          {hasMany ? (
            <div className="flex gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon-xs"
                onClick={() =>
                  setIndex((value) => (value === 0 ? items.length - 1 : value - 1))
                }
                aria-label={`Previous ${title}`}
              >
                <ChevronLeft className="size-3.5" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon-xs"
                onClick={() =>
                  setIndex((value) => (value === items.length - 1 ? 0 : value + 1))
                }
                aria-label={`Next ${title}`}
              >
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          ) : null}
        </div>
      </div>
      <div className="rounded-xl border border-border bg-muted/10 p-3">
        {selectedItem ? renderItem(selectedItem) : null}
      </div>
    </section>
  );
}

function DiamondCard({ diamond }: { diamond: EnquiryDiamond }) {
  const type = [diamond.type, diamond.growthMethod].filter(Boolean).join(" · ");
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <DetailRow label="Type" value={type} />
      <DetailRow label="Shape" value={diamond.shape} />
      <DetailRow label="Clarity" value={diamond.clarity} />
      <DetailRow label="Colour" value={diamond.colour} />
      <DetailRow label="Size" value={diamond.size} />
      <DetailRow label="Pieces" value={diamond.pieces} />
      <DetailRow label="Approx. weight" value={diamond.weight} />
      <DetailRow label="Notes" value={diamond.notes} />
    </div>
  );
}

function ColorStoneCard({ stone }: { stone: EnquiryColorStone }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <DetailRow label="Type" value={stone.stoneType} />
      <DetailRow label="Nature" value={stone.nature} />
      <DetailRow label="Origin" value={stone.origin} />
      <DetailRow label="Treatment" value={stone.treatment} />
      <DetailRow label="Shape" value={stone.shape} />
      <DetailRow label="Colour" value={stone.colour} />
      <DetailRow label="Size" value={stone.size} />
      <DetailRow label="Pieces" value={stone.pieces} />
      <DetailRow label="Weight" value={stone.weight} />
      <DetailRow label="Notes" value={stone.notes} />
    </div>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {title}
      </p>
      <dl className="grid gap-2">{children}</dl>
    </section>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  if (!hasValue(value)) return null;

  return (
    <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-3 border-b border-dashed border-border/70 pb-2 last:border-b-0 last:pb-0">
      <dt className="text-xs uppercase text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-right text-xs font-medium text-foreground">
        {value}
      </dd>
    </div>
  );
}

function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-border bg-background px-2.5 py-0.5 text-xs uppercase text-muted-foreground">
      {children}
    </span>
  );
}

function hasRecordValues(item: object) {
  return Object.entries(item as Record<string, unknown>).some(
    ([key, value]) => key !== "id" && hasValue(value),
  );
}
