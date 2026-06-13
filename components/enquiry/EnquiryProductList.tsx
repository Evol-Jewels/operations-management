"use client";

import {
  ChevronDown,
  LayoutGrid,
  Package,
  Palette,
  TableIcon,
} from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { EnquiryEstimationDialog } from "@/components/enquiry/EnquiryEstimationDialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
type ViewMode = "grid" | "table";

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
  if (value === null || value === undefined || value === "") return null;

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

function getCustomProductStones(product: EnquiryCustomProduct) {
  if (product.stones.length > 0) return product.stones;
  if (!product.stoneDescription) return [];

  return [
    {
      id: `${product.id}-legacy-stone`,
      stoneType: product.stoneDescription,
      weight: product.stoneCaratEstimate,
    },
  ];
}

function formatCustomStoneSummary(product: EnquiryCustomProduct) {
  return getCustomProductStones(product)
    .map((stone) => {
      const meta = [
        stone.pieces ? `${stone.pieces} pcs` : null,
        stone.weight ? `~${stone.weight} ct` : null,
      ]
        .filter(Boolean)
        .join(", ");
      return meta ? `${stone.stoneType} (${meta})` : stone.stoneType;
    })
    .join(" · ");
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
        className="h-36 w-full rounded-xl border border-border bg-muted object-cover"
        unoptimized
      />
    );
  }

  const Icon = kind === "custom" ? Palette : Package;
  return (
    <div className="flex h-36 w-full items-center justify-center rounded-xl border border-border bg-muted/40">
      <Icon className="size-8 text-muted-foreground/50" />
    </div>
  );
}

function EstimationSummary({ estimation }: { estimation: ProductEstimation }) {
  return (
    <div className="rounded-xl border border-border bg-muted/25 px-3 py-2.5">
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
    <article className="flex min-h-full flex-col rounded-xl border border-border bg-card p-3.5 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
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
                  value={[customProduct.metalType, customProduct.metalPurity]
                    .filter(Boolean)
                    .join(" ")}
                />
                <DetailRow label="Polish" value={customProduct.polish} />
                {getCustomProductStones(customProduct).map((stone, index) => (
                  <DetailRow
                    key={stone.id}
                    label={index === 0 ? "Stone" : `Stone ${index + 1}`}
                    value={[
                      stone.stoneType,
                      stone.pieces ? `${stone.pieces} pcs` : null,
                      stone.weight ? `~${stone.weight} ct` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  />
                ))}
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

function ProductTable({
  items,
  settings,
  isClosed,
  isSavingEstimation,
  onSaveEstimation,
}: {
  items: NormalizedItem[];
  settings: CalculatorSettings;
  isClosed: boolean;
  isSavingEstimation?: boolean;
  onSaveEstimation: (estimation: ProductEstimation) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/35 hover:bg-muted/35">
            <TableHead className="pl-5">Product</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Estimate</TableHead>
            {!isClosed ? (
              <TableHead className="pr-5 text-right">Action</TableHead>
            ) : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="max-w-[320px] py-4 pl-5">
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">
                    {item.title}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {item.subtitle}
                  </p>
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {item.kind === "existing" ? "Existing" : "Custom"}
              </TableCell>
              <TableCell>
                <StatusBadge status={item.status} />
              </TableCell>
              <TableCell className="text-right text-sm tabular-nums">
                {item.estimation ? (
                  <span className="font-medium text-foreground">
                    {formatCurrency(item.estimation.finalAmount)}
                  </span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              {!isClosed ? (
                <TableCell className="pr-5 text-right">
                  <EnquiryEstimationDialog
                    productId={item.id}
                    productName={item.title}
                    defaultPurity={item.defaultPurity}
                    settings={settings}
                    existingEstimation={item.estimation}
                    onSave={onSaveEstimation}
                    disabled={isSavingEstimation}
                  />
                </TableCell>
              ) : null}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
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
  const [viewMode, setViewMode] = useState<ViewMode>("table");
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
        subtitle: [product.productCode, product.category, metalLabel]
          .filter(Boolean)
          .join(" · "),
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
        [product.polish, formatCustomStoneSummary(product)]
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[0.75rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Products
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {filteredItems.length} of {items.length} item
            {items.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-border bg-background p-1">
            <Button
              type="button"
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon-sm"
              aria-label="Grid view"
              aria-pressed={viewMode === "grid"}
              className="size-8"
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="size-4" />
            </Button>
            <Button
              type="button"
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="icon-sm"
              aria-label="Table view"
              aria-pressed={viewMode === "table"}
              className="size-8"
              onClick={() => setViewMode("table")}
            >
              <TableIcon className="size-4" />
            </Button>
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
      ) : viewMode === "table" ? (
        <ProductTable
          items={filteredItems}
          settings={settings}
          isClosed={isClosed}
          isSavingEstimation={isSavingEstimation}
          onSaveEstimation={onSaveEstimation}
        />
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
