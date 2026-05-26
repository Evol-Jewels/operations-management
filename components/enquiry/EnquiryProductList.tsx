"use client";

import { ChevronDown, Package, Palette } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { EnquiryEstimationDialog } from "@/components/enquiry/EnquiryEstimationDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCalculatorSettings } from "@/hooks/useCalculatorSettings";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type {
  CalculatorSettings,
  EnquiryCustomProduct,
  EnquiryItemStatus,
  EnquirySelectedProduct,
  MetalPurity,
  ProductEstimation,
} from "@/types";

type ItemKind = "existing" | "custom";
type StatusFilter = "ALL" | EnquiryItemStatus;

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "ESTIMATED", label: "Estimated" },
  { value: "CONVERTED", label: "Converted" },
  { value: "CLOSED", label: "Closed" },
];

const STATUS_LABELS: Record<EnquiryItemStatus, string> = {
  PENDING: "Pending",
  ESTIMATED: "Estimated",
  CONVERTED: "Converted",
  CLOSED: "Closed",
};

function DetailRow({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  if (!value && value !== 0) return null;

  return (
    <div className="grid grid-cols-[6.5rem_1fr] gap-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-xs text-foreground">{value}</dd>
    </div>
  );
}

function getItemStatus(
  explicitStatus: EnquiryItemStatus | undefined,
  estimation: ProductEstimation | undefined,
): EnquiryItemStatus {
  if (explicitStatus) return explicitStatus;
  return estimation ? "ESTIMATED" : "PENDING";
}

function getDefaultPurity(value: string): MetalPurity {
  return ["14K", "18K", "22K", "24K"].includes(value)
    ? (value as MetalPurity)
    : "22K";
}

function StatusBadge({ status }: { status: EnquiryItemStatus }) {
  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 text-xs font-medium",
        status === "ESTIMATED" && "border-border bg-muted text-foreground",
        status === "PENDING" &&
          "border-border bg-background text-muted-foreground",
        status === "CONVERTED" && "border-border bg-foreground text-background",
        status === "CLOSED" &&
          "border-border bg-muted/60 text-muted-foreground",
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

function ProductVisual({
  imageUrl,
  title,
  kind,
}: {
  imageUrl?: string;
  title: string;
  kind: ItemKind;
}) {
  if (imageUrl) {
    return (
      <Image
        src={imageUrl}
        alt={title}
        width={320}
        height={220}
        className="h-32 w-full rounded-lg border border-border bg-muted object-cover"
        unoptimized
      />
    );
  }

  const Icon = kind === "custom" ? Palette : Package;
  return (
    <div className="flex h-32 w-full items-center justify-center rounded-lg border border-border bg-muted/40">
      <Icon className="size-8 text-muted-foreground/50" />
    </div>
  );
}

function EstimationSummary({ estimation }: { estimation: ProductEstimation }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Estimate
          </p>
          <p className="mt-0.5 text-sm font-semibold text-foreground">
            {formatCurrency(estimation.finalAmount)}
          </p>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <p>
            {estimation.metalWeight}g {estimation.purity}
          </p>
          <p>{formatDate(estimation.createdAt)}</p>
        </div>
      </div>
    </div>
  );
}

interface NormalizedItem {
  id: string;
  kind: ItemKind;
  title: string;
  subtitle: string;
  imageUrl?: string;
  status: EnquiryItemStatus;
  estimation?: ProductEstimation;
  defaultPurity: MetalPurity;
  product: EnquirySelectedProduct | EnquiryCustomProduct;
}

function ProductCard({
  item,
  settings,
  isClosed,
  isSavingEstimation,
  onSaveEstimation,
}: {
  item: NormalizedItem;
  settings: CalculatorSettings;
  isClosed: boolean;
  isSavingEstimation?: boolean;
  onSaveEstimation: (estimation: ProductEstimation) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isExisting = item.kind === "existing";
  const selectedProduct = isExisting
    ? (item.product as EnquirySelectedProduct)
    : null;
  const customProduct = !isExisting
    ? (item.product as EnquiryCustomProduct)
    : null;

  return (
    <article className="flex min-h-full flex-col rounded-xl border border-border bg-card p-3">
      <ProductVisual
        imageUrl={item.imageUrl}
        title={item.title}
        kind={item.kind}
      />

      <div className="flex flex-1 flex-col pt-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-base font-semibold leading-snug text-foreground">
              {item.title}
            </h3>
            <p className="mt-1 line-clamp-2 text-sm leading-5 text-muted-foreground">
              {item.subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={
              expanded ? "Hide product details" : "Show product details"
            }
          >
            <ChevronDown
              className={cn(
                "size-4 transition-transform",
                expanded && "rotate-180",
              )}
            />
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-border bg-background px-2 py-0.5 text-xs text-muted-foreground">
            {isExisting ? "Existing" : "Custom"}
          </span>
          <StatusBadge status={item.status} />
        </div>

        {item.estimation ? (
          <div className="mt-3">
            <EstimationSummary estimation={item.estimation} />
          </div>
        ) : null}

        {expanded ? (
          <dl className="mt-3 grid gap-2 border-t border-border pt-3">
            {selectedProduct ? (
              <>
                <DetailRow label="Code" value={selectedProduct.productCode} />
                <DetailRow label="Category" value={selectedProduct.category} />
                <DetailRow
                  label="Metal"
                  value={`${selectedProduct.metalType === "Gold" ? "Yellow Gold" : selectedProduct.metalType} ${selectedProduct.metalPurity}`}
                />
                <DetailRow
                  label="Description"
                  value={selectedProduct.description}
                />
                {selectedProduct.basePrice ? (
                  <DetailRow
                    label="Base Price"
                    value={formatCurrency(selectedProduct.basePrice)}
                  />
                ) : null}
              </>
            ) : null}

            {customProduct ? (
              <>
                <DetailRow label="Category" value={customProduct.category} />
                <DetailRow
                  label="Metal"
                  value={`${customProduct.metalType} ${customProduct.metalPurity}`}
                />
                <DetailRow label="Polish" value={customProduct.polish} />
                <DetailRow
                  label="Stone"
                  value={customProduct.stoneDescription}
                />
                <DetailRow label="Cut" value={customProduct.stoneCut} />
                <DetailRow label="Quality" value={customProduct.stoneQuality} />
                {customProduct.stoneCaratEstimate ? (
                  <DetailRow
                    label="Carat"
                    value={`~${customProduct.stoneCaratEstimate} ct`}
                  />
                ) : null}
              </>
            ) : null}
          </dl>
        ) : null}

        {!isClosed ? (
          <div className="mt-auto pt-4">
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
      </div>
    </article>
  );
}

interface EnquiryProductListProps {
  selectedProducts: EnquirySelectedProduct[];
  customProducts: EnquiryCustomProduct[];
  estimations: ProductEstimation[];
  isClosed: boolean;
  isSavingEstimation?: boolean;
  onSaveEstimation: (estimation: ProductEstimation) => void;
}

export function EnquiryProductList({
  selectedProducts,
  customProducts,
  estimations,
  isClosed,
  isSavingEstimation,
  onSaveEstimation,
}: EnquiryProductListProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const { settings } = useCalculatorSettings();

  const items = useMemo<NormalizedItem[]>(() => {
    const selectedItems = selectedProducts.map((product) => {
      const estimation = estimations.find(
        (item) => item.productId === product.id,
      );
      const metalLabel = `${product.metalType === "Gold" ? "Yellow Gold" : product.metalType} ${product.metalPurity}`;

      return {
        id: product.id,
        kind: "existing" as const,
        title: product.name,
        subtitle: `${product.productCode} · ${product.category} · ${metalLabel}`,
        imageUrl: product.imageUrl,
        status: getItemStatus(product.status, estimation),
        estimation,
        defaultPurity: product.metalPurity,
        product,
      };
    });

    const customItems = customProducts.map((product) => {
      const estimation = estimations.find(
        (item) => item.productId === product.id,
      );
      const title = [
        product.category || "Custom",
        product.metalType,
        product.metalPurity,
      ]
        .filter(Boolean)
        .join(" · ");
      const subtitle =
        [product.polish, product.stoneDescription, product.stoneCut]
          .filter(Boolean)
          .join(" · ") || "Custom design";

      return {
        id: product.id,
        kind: "custom" as const,
        title,
        subtitle,
        status: getItemStatus(product.status, estimation),
        estimation,
        defaultPurity: getDefaultPurity(product.metalPurity),
        product,
      };
    });

    return [...selectedItems, ...customItems];
  }, [customProducts, estimations, selectedProducts]);

  const filteredItems =
    statusFilter === "ALL"
      ? items
      : items.filter((item) => item.status === statusFilter);

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[0.75rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Products
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {filteredItems.length} of {items.length} item
            {items.length === 1 ? "" : "s"}
          </p>
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as StatusFilter)}
        >
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

      {items.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-5 py-10 text-center">
          <Package className="mx-auto mb-3 size-6 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            No products added to this enquiry.
          </p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-5 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            No products match this status.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredItems.map((item) => (
            <ProductCard
              key={item.id}
              item={item}
              settings={settings}
              isClosed={isClosed}
              isSavingEstimation={isSavingEstimation}
              onSaveEstimation={onSaveEstimation}
            />
          ))}
        </div>
      )}
    </div>
  );
}
