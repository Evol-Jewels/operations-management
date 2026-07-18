"use client";

import {
  AlertCircle,
  ArrowLeft,
  Calculator,
  Columns2,
  Columns3,
  Diamond,
  Download,
  MapPin,
  PackageSearch,
  RefreshCw,
  ScanLine,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { BarcodeScanDialog } from "@/components/calculator/BarcodeScanDialog";
import { EstimationSummaryCard } from "@/components/calculator/EstimationSummaryCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useCalculatorSettings } from "@/hooks/useCalculatorSettings";
import { useMyInternalProfile } from "@/hooks/useInternalProfile";
import {
  useInfiniteInventoryProducts,
  useInventoryProductByCode,
  useSyncInventoryProducts,
} from "@/hooks/useInventoryProducts";
import { useLocations } from "@/hooks/useManageProducts";
import { captureProductEvent } from "@/lib/analytics";
import { normalizeDecodedId } from "@/lib/barcodeScanner";
import {
  getInventoryPrimaryImage,
  normalizeInventoryProductEstimate,
} from "@/lib/inventoryProductMapping";
import { cn, formatCurrency } from "@/lib/utils";
import type { CalculatorSettings } from "@/types";
import type {
  InventoryProduct,
  InventoryProductListQuery,
  ProductColor,
} from "@/types/inventory-api";

type InventoryCategory =
  | "RING"
  | "NECKLACE"
  | "EARRING"
  | "BRACELET"
  | "PENDANT"
  | "BANGLE"
  | "ANKLET"
  | "ACCESSORY"
  | "CHAIN"
  | "OTHER";
type SourceFilter = "ALL" | "CUSTOMER" | "STOCK";
type ColorFilter = "ALL" | ProductColor;
type PurityFilter = "ALL" | "14" | "18" | "24";
type InventoryGridColumns = 2 | 3;
type ActiveFilterChip = {
  key: string;
  label: string;
  onRemove: () => void;
};

function getImageExtension(blob: Blob, imageUrl: string) {
  const typeExtension = blob.type.split("/")[1]?.split("+")[0];
  if (typeExtension) return typeExtension === "jpeg" ? "jpg" : typeExtension;

  const urlExtension = imageUrl.match(/\.([a-z0-9]+)(?:[?#]|$)/i)?.[1];
  return urlExtension?.toLowerCase() || "jpg";
}

function InventoryImageDownloadButton({
  imageUrl,
  productCode,
}: {
  imageUrl: string;
  productCode: string;
}) {
  const [isDownloading, setIsDownloading] = useState(false);

  async function downloadImage() {
    setIsDownloading(true);

    try {
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error("Image request failed");

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const safeProductCode =
        productCode.trim().replace(/[^a-z0-9_-]+/gi, "-") || "product";

      link.href = objectUrl;
      link.download = `${safeProductCode}.${getImageExtension(blob, imageUrl)}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
      toast.success("Product image downloaded");
    } catch {
      toast.error("Unable to download the product image");
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <Button
      type="button"
      size="icon"
      variant="secondary"
      disabled={isDownloading}
      aria-label={`Download image for ${productCode}`}
      onClick={(event) => {
        event.stopPropagation();
        void downloadImage();
      }}
      className="absolute top-2 right-2 z-20 size-9 cursor-pointer border border-border/70 bg-background/90 opacity-100 shadow-sm backdrop-blur-sm transition-opacity duration-200 hover:bg-background focus-visible:opacity-100 sm:opacity-0 sm:group-hover/image:opacity-100"
    >
      {isDownloading ? (
        <RefreshCw className="size-4 animate-spin" />
      ) : (
        <Download className="size-4" />
      )}
    </Button>
  );
}

const CATEGORY_VALUES: readonly InventoryCategory[] = [
  "RING",
  "NECKLACE",
  "EARRING",
  "BRACELET",
  "PENDANT",
  "BANGLE",
  "ANKLET",
  "ACCESSORY",
  "CHAIN",
  "OTHER",
] as const;

const CATEGORY_LABELS: Record<InventoryCategory, string> = {
  RING: "Ring",
  NECKLACE: "Necklace",
  EARRING: "Earring",
  BRACELET: "Bracelet",
  PENDANT: "Pendant",
  BANGLE: "Bangle",
  ANKLET: "Anklet",
  ACCESSORY: "Accessory",
  CHAIN: "Chain",
  OTHER: "Other",
};

const COLOR_LABELS: Record<ProductColor, string> = {
  YELLOW: "Yellow",
  ROSE: "Rose",
  WHITE: "White",
  OTHERS: "Others",
};

const PURITY_LABELS: Record<Exclude<PurityFilter, "ALL">, string> = {
  "14": "14K",
  "18": "18K",
  "24": "24K",
};

const SEARCH_DEBOUNCE_MS = 300;

const QUERY_PARAM_KEYS = {
  search: "q",
  category: "category",
  color: "color",
  purity: "purity",
  source: "source",
  location: "locationId",
  netWeightFrom: "netWeightFrom",
  netWeightTo: "netWeightTo",
  sourceCreatedFrom: "sourceCreatedFrom",
  sourceCreatedTo: "sourceCreatedTo",
  columns: "columns",
} as const;

function formatWeight(value: string | number, unit: string) {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return `- ${unit}`;
  return `${numeric.toFixed(2)} ${unit}`;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong";
}

function formatProductCount(count: number | undefined) {
  return typeof count === "number" ? count.toLocaleString("en-IN") : null;
}

function getQueryValue(params: URLSearchParams, key: string) {
  return params.get(key) ?? "";
}

function getCategoryQueryValue(params: URLSearchParams) {
  const value = params.get(QUERY_PARAM_KEYS.category);
  return value && CATEGORY_VALUES.includes(value as InventoryCategory)
    ? (value as InventoryCategory)
    : "ALL";
}

function getColorQueryValue(params: URLSearchParams) {
  const value = params.get(QUERY_PARAM_KEYS.color);
  return value && Object.keys(COLOR_LABELS).includes(value)
    ? (value as ColorFilter)
    : "ALL";
}

function getPurityQueryValue(params: URLSearchParams) {
  const value = params.get(QUERY_PARAM_KEYS.purity);
  return value && Object.keys(PURITY_LABELS).includes(value)
    ? (value as PurityFilter)
    : "ALL";
}

function getSourceQueryValue(params: URLSearchParams) {
  const value = params.get(QUERY_PARAM_KEYS.source);
  return value === "CUSTOMER" || value === "STOCK" ? value : "ALL";
}

function getColumnsQueryValue(params: URLSearchParams): InventoryGridColumns {
  return params.get(QUERY_PARAM_KEYS.columns) === "2" ? 2 : 3;
}

function getMetalLabel(product: InventoryProduct) {
  const color = product.color.trim().toLowerCase();
  const metalColor = color.includes("rose")
    ? "Rose Gold"
    : color.includes("white")
      ? "White Gold"
      : color.includes("yellow") || color === "gold"
        ? "Yellow Gold"
        : product.color;

  return `${metalColor} ${product.purity}K`;
}

function getTotalStonePieces(product: InventoryProduct) {
  return (product.stones ?? []).reduce((sum, stone) => sum + stone.pieces, 0);
}

function getTotalStoneCarat(product: InventoryProduct) {
  const totalStoneWeight = Number(product.totalStoneWeight);
  if (Number.isFinite(totalStoneWeight) && totalStoneWeight > 0) {
    return totalStoneWeight;
  }

  return (product.stones ?? []).reduce(
    (sum, stone) => sum + (Number(stone.netWeight) || 0),
    0,
  );
}

function InventoryProductImage({
  image,
  sizes,
  className,
  showLabel = false,
}: {
  image: ReturnType<typeof getInventoryPrimaryImage>;
  sizes: string;
  className: string;
  showLabel?: boolean;
}) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [image?.storageKey]);

  if (!image || hasError) {
    return (
      <div
        role="img"
        aria-label="Product image unavailable"
        className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_35%,color-mix(in_oklab,var(--muted-foreground)_10%,transparent),transparent_58%)] text-muted-foreground"
      >
        <div className="absolute inset-3 rounded-[inherit] border border-dashed border-current/10" />
        <div className="relative flex size-11 items-center justify-center rounded-full border border-current/15 bg-background/55 shadow-sm backdrop-blur-sm">
          <Diamond className="size-5 opacity-45" strokeWidth={1.5} />
        </div>
        {showLabel ? (
          <span className="relative mt-3 text-[10px] font-medium uppercase tracking-[0.16em] opacity-55">
            Image unavailable
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <Image
      src={image.storageKey}
      alt={image.altText}
      fill
      unoptimized
      sizes={sizes}
      className={className}
      onError={() => setHasError(true)}
    />
  );
}

function getInventoryGridClass({
  columns,
  hasSelectedProduct,
}: {
  columns: InventoryGridColumns;
  hasSelectedProduct: boolean;
}) {
  if (hasSelectedProduct) return "grid-cols-1";
  return columns === 3 ? "md:grid-cols-2 xl:grid-cols-3" : "md:grid-cols-2";
}

function InventoryStat({
  label,
  value,
  emphasis = false,
  onClick,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
  onClick?: () => void;
}) {
  const className = cn(
    "rounded-xl border px-4 py-3.5 text-left",
    emphasis
      ? "border-foreground bg-foreground"
      : "border-border bg-background",
    onClick &&
      "min-h-20 cursor-pointer transition-colors hover:border-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  );
  const content = (
    <>
      <p
        className={cn(
          "text-[11px] font-semibold uppercase tracking-[0.2em]",
          emphasis ? "text-background/70" : "text-muted-foreground",
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          "mt-2 text-sm font-medium",
          emphasis ? "text-background" : "text-foreground",
        )}
      >
        {value}
      </p>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={className}
        aria-label="View estimation price breakdown"
      >
        {content}
      </button>
    );
  }

  return <div className={className}>{content}</div>;
}

function ProductListItem({
  product,
  selected,
  compact = false,
  onSelect,
}: {
  product: InventoryProduct;
  selected: boolean;
  compact?: boolean;
  onSelect: () => void;
}) {
  const image = getInventoryPrimaryImage(product);
  const stonePieces = getTotalStonePieces(product);
  const stoneCarat = getTotalStoneCarat(product);
  const hasStoneInfo = stonePieces > 0 || stoneCarat > 0;

  return (
    <div
      className={cn(
        "relative flex w-full items-start gap-3 rounded-xl border bg-card p-3 text-left shadow-sm transition-colors hover:border-foreground/25 hover:bg-muted/20 has-[button:focus-visible]:ring-2 has-[button:focus-visible]:ring-ring has-[button:focus-visible]:ring-offset-2",
        compact && "gap-2.5 p-2.5",
        selected
          ? "border-foreground/60 ring-1 ring-foreground/10"
          : "border-border",
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-label={`View ${product.name}`}
        className="absolute inset-0 z-0 cursor-pointer rounded-xl"
      />
      <div
        className={cn(
          "group/image pointer-events-none relative z-10 h-[5.5rem] w-[5.5rem] shrink-0 overflow-hidden rounded-xl border border-border bg-muted/60 sm:h-24 sm:w-24",
          compact && "h-[4.5rem] w-[4.5rem] sm:h-20 sm:w-20",
        )}
      >
        {image ? (
          <>
            <Image
              src={image.storageKey}
              alt={image.altText}
              fill
              unoptimized
              sizes="96px"
              className="object-contain p-1.5"
            />
            <div className="pointer-events-auto">
              <InventoryImageDownloadButton
                imageUrl={image.storageKey}
                productCode={product.productCode}
              />
            </div>
          </>
        ) : null}
      </div>

      <div
        className={cn(
          "pointer-events-none relative z-10 min-w-0 flex-1 space-y-2",
          compact && "space-y-1.5",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-foreground">
              {product.name}
            </h3>
            <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
              {product.productCode}
            </p>
          </div>
          {!compact ? (
            <Badge
              variant={product.isCustomerProduct ? "default" : "outline"}
              className="shrink-0"
            >
              {product.isCustomerProduct ? "Customer" : "Stock"}
            </Badge>
          ) : null}
        </div>

        <p className="line-clamp-1 text-sm text-muted-foreground">
          {getMetalLabel(product)}
        </p>

        {!compact ? (
          <div className="flex flex-wrap gap-1.5">
            <span className="rounded-md border border-border bg-background px-2 py-1 text-xs font-medium text-foreground">
              Net {formatWeight(product.netWeight, "g")}
            </span>
            <span className="rounded-md border border-border bg-background px-2 py-1 text-xs font-medium text-muted-foreground">
              Gross {formatWeight(product.grossWeight, "g")}
            </span>
            {hasStoneInfo ? (
              <span className="rounded-md border border-border bg-background px-2 py-1 text-xs font-medium text-muted-foreground">
                Stones{" "}
                {stoneCarat > 0
                  ? formatWeight(stoneCarat, "ct")
                  : `${stonePieces.toLocaleString("en-IN")} pcs`}
              </span>
            ) : null}
          </div>
        ) : null}

        <div className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">
            {product.location.name}
            {product.location.city ? `, ${product.location.city}` : ""}
          </span>
        </div>
      </div>
    </div>
  );
}

function ProductDetail({
  product,
  settings,
  estimationSectionRef,
}: {
  product: InventoryProduct;
  settings: CalculatorSettings;
  estimationSectionRef: RefObject<HTMLElement | null>;
}) {
  const image = getInventoryPrimaryImage(product);
  const estimateResult = useMemo(
    () => normalizeInventoryProductEstimate(product, settings),
    [product, settings],
  );

  function scrollToEstimation() {
    captureProductEvent("inventory_estimation_viewed", {
      product_code: product.productCode,
      category: product.category,
      product_source: product.isCustomerProduct ? "customer" : "stock",
    });
    estimationSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="grid lg:min-h-[26rem] lg:grid-cols-[minmax(280px,0.95fr)_minmax(300px,1fr)]">
        <div className="group/image relative aspect-[4/3] min-h-72 bg-muted/40 lg:aspect-auto lg:min-h-full">
          {image ? (
            <>
              <Image
                src={image.storageKey}
                alt={image.altText}
                fill
                unoptimized
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="object-cover"
              />
              <InventoryImageDownloadButton
                imageUrl={image.storageKey}
                productCode={product.productCode}
              />
            </>
          ) : (
            <div className="flex h-full min-h-72 items-center justify-center">
              <PackageSearch className="h-8 w-8 text-muted-foreground/40" />
            </div>
          )}
        </div>

        <div className="flex flex-col justify-between p-5 lg:p-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="default"
                className="rounded-full px-3 py-1 text-xs"
              >
                {product.category}
              </Badge>
              <Badge
                variant="outline"
                className="rounded-full px-3 py-1 text-xs"
              >
                {product.color}
              </Badge>
            </div>

            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
              {product.name}
            </h2>
            <p className="mt-1 font-mono text-sm text-muted-foreground">
              {product.productCode}
            </p>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              {product.vendor}
            </p>
          </div>

          <div className="mt-8 space-y-3">
            <div className="grid gap-3 min-[1180px]:grid-cols-2">
              <InventoryStat label="Metal" value={getMetalLabel(product)} />
              <InventoryStat
                label="Net wt"
                value={formatWeight(product.netWeight, "g")}
              />
            </div>
            <div className="grid gap-3 min-[1180px]:grid-cols-2">
              <InventoryStat
                label="Stone wt"
                value={formatWeight(getTotalStoneCarat(product), "ct")}
              />
              <InventoryStat
                label="Gross wt"
                value={formatWeight(product.grossWeight, "g")}
              />
            </div>
            <div className="grid gap-3 min-[1180px]:grid-cols-2">
              <InventoryStat label="Location" value={product.location.city} />
              <InventoryStat
                label="Price"
                value={formatCurrency(estimateResult.pricing.total)}
                emphasis
                onClick={scrollToEstimation}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProductEstimationSection({
  product,
  settings,
  estimationSectionRef,
}: {
  product: InventoryProduct;
  settings: CalculatorSettings;
  estimationSectionRef: RefObject<HTMLElement | null>;
}) {
  const estimateResult = useMemo(
    () => normalizeInventoryProductEstimate(product, settings),
    [product, settings],
  );
  const router = useRouter();

  function loadIntoCalculator() {
    const params = new URLSearchParams({
      tab: "calculate",
      productCode: product.productCode,
    });
    router.push(`/calculator?${params.toString()}`);
  }

  return (
    <section ref={estimationSectionRef} className="scroll-mt-4">
      <EstimationSummaryCard
        title="Product estimation"
        data={{ kind: "estimate", result: estimateResult }}
        renderHeaderActions={() => (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 shrink-0 rounded-md px-2.5 sm:px-3"
            onClick={loadIntoCalculator}
          >
            <Calculator className="h-4 w-4" />
            <span className="hidden sm:inline">Load in Calculator</span>
          </Button>
        )}
      />
    </section>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-sm text-foreground">{value}</dd>
    </div>
  );
}

function ProductSpecification({ product }: { product: InventoryProduct }) {
  const totalStonePieces = getTotalStonePieces(product);
  const totalStoneTypes = product.stones?.length ?? 0;
  const totalStoneCarat = getTotalStoneCarat(product);

  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
            Specification
          </h2>
        </div>
        <Badge variant="outline">{product.category}</Badge>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <dl className="space-y-3">
          <DetailRow label="Code" value={product.productCode} />
          <DetailRow label="Vendor" value={product.vendor} />
        </dl>
        <dl className="space-y-3">
          <DetailRow
            label="Gross wt"
            value={formatWeight(product.grossWeight, "g")}
          />
          <DetailRow
            label="Source"
            value={
              product.isCustomerProduct ? "Customer product" : "Stock product"
            }
          />
        </dl>
      </div>

      <Separator className="my-6" />

      <div>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">
            Inventory position
          </p>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {product.location.name} · {product.location.city} ·{" "}
          {product.location.type}
        </p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {product.location.notes ?? "-"}
        </p>
      </div>

      {(product.stones?.length ?? 0) > 0 ? (
        <>
          <Separator className="my-6" />
          <div>
            <div className="flex items-center gap-2">
              <Diamond className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">
                Stone composition
              </p>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <InventoryStat
                label="Total stones"
                value={totalStoneTypes.toLocaleString("en-IN")}
              />
              <InventoryStat
                label="Total carat"
                value={formatWeight(totalStoneCarat, "ct")}
              />
              <InventoryStat
                label="Total pieces"
                value={`${totalStonePieces.toLocaleString("en-IN")} pcs`}
              />
            </div>
            <div className="mt-4 space-y-3">
              {(product.stones ?? []).map((stone) => (
                <div
                  key={stone.id}
                  className="rounded-xl border border-border bg-background px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {stone.stoneName ?? stone.slabName}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {stone.slabName} · {formatCurrency(stone.ratePerCarat)}
                        /ct
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">
                        {formatCurrency(stone.amount)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatWeight(stone.netWeight, "ct")} ·{" "}
                        {stone.pieces.toLocaleString("en-IN")} pcs
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}

function ProductListSkeleton() {
  const rows = ["row-1", "row-2", "row-3", "row-4", "row-5", "row-6"];

  return (
    <div className="space-y-2.5">
      {rows.map((row) => (
        <div
          key={row}
          className="flex w-full items-start gap-3 rounded-xl border border-border bg-card p-3 shadow-sm"
        >
          <Skeleton className="h-20 w-20 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex justify-between gap-3">
              <div className="space-y-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="h-3 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ProductGridSkeleton({ columns }: { columns: InventoryGridColumns }) {
  const rows = ["row-1", "row-2", "row-3", "row-4", "row-5", "row-6"];

  return (
    <div
      className={cn(
        "grid gap-3",
        getInventoryGridClass({ columns, hasSelectedProduct: false }),
      )}
    >
      {rows.map((row) => (
        <div
          key={row}
          className="flex w-full items-start gap-3 rounded-xl border border-border bg-card p-3 shadow-sm"
        >
          <Skeleton className="h-20 w-20 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex justify-between gap-3">
              <div className="space-y-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="h-3 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ProductDetailSkeleton() {
  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="grid min-h-[26rem] lg:grid-cols-[minmax(320px,0.95fr)_1fr]">
          <Skeleton className="min-h-72 rounded-xl" />
          <div className="space-y-6 p-5 lg:p-6">
            <div className="flex gap-2">
              <Skeleton className="h-7 w-24 rounded-full" />
              <Skeleton className="h-7 w-20 rounded-full" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-7 w-56" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Skeleton className="h-20 rounded-xl" />
              <Skeleton className="h-20 rounded-xl" />
              <Skeleton className="h-20 rounded-xl" />
            </div>
          </div>
        </div>
      </section>
      <Skeleton className="h-80 rounded-xl" />
    </div>
  );
}

function ErrorPanel({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
    </div>
  );
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(handle);
  }, [value, delayMs]);
  return debounced;
}

export function InventoryPageClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedProductCode = searchParams.get("productCode");

  const [searchInput, setSearchInput] = useState(() =>
    getQueryValue(searchParams, QUERY_PARAM_KEYS.search),
  );
  const [categoryFilter, setCategoryFilter] = useState<
    InventoryCategory | "ALL"
  >(() => getCategoryQueryValue(searchParams));
  const [colorFilter, setColorFilter] = useState<ColorFilter>(() =>
    getColorQueryValue(searchParams),
  );
  const [purityFilter, setPurityFilter] = useState<PurityFilter>(() =>
    getPurityQueryValue(searchParams),
  );
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>(() =>
    getSourceQueryValue(searchParams),
  );
  const [locationFilter, setLocationFilter] = useState<string>(
    () => searchParams.get(QUERY_PARAM_KEYS.location) ?? "ALL",
  );

  const [netWeightFrom, setNetWeightFrom] = useState(() =>
    getQueryValue(searchParams, QUERY_PARAM_KEYS.netWeightFrom),
  );
  const [netWeightTo, setNetWeightTo] = useState(() =>
    getQueryValue(searchParams, QUERY_PARAM_KEYS.netWeightTo),
  );
  const [sourceCreatedFrom, setSourceCreatedFrom] = useState(() =>
    getQueryValue(searchParams, QUERY_PARAM_KEYS.sourceCreatedFrom),
  );
  const [sourceCreatedTo, setSourceCreatedTo] = useState(() =>
    getQueryValue(searchParams, QUERY_PARAM_KEYS.sourceCreatedTo),
  );

  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [gridColumns, setGridColumns] = useState<InventoryGridColumns>(() =>
    getColumnsQueryValue(searchParams),
  );
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const estimationSectionRef = useRef<HTMLElement | null>(null);
  const { settings } = useCalculatorSettings();
  const profileQuery = useMyInternalProfile();
  const syncInventoryMutation = useSyncInventoryProducts();

  const debouncedSearch = useDebouncedValue(
    searchInput.trim(),
    SEARCH_DEBOUNCE_MS,
  );

  const listQuery = useInfiniteInventoryProducts(
    useMemo<InventoryProductListQuery>(() => {
      const isCustomerProduct =
        sourceFilter === "ALL" ? undefined : sourceFilter === "CUSTOMER";

      const filters: InventoryProductListQuery = {
        q: debouncedSearch || undefined,
        category: categoryFilter === "ALL" ? undefined : categoryFilter,
        color: colorFilter === "ALL" ? undefined : colorFilter,
        purity: purityFilter === "ALL" ? undefined : Number(purityFilter),
        locationId: locationFilter === "ALL" ? undefined : locationFilter,
        isCustomerProduct,
        netWeightFrom: netWeightFrom ? Number(netWeightFrom) : undefined,
        netWeightTo: netWeightTo ? Number(netWeightTo) : undefined,
        sourceCreatedFrom: sourceCreatedFrom || undefined,
        sourceCreatedTo: sourceCreatedTo || undefined,
      };
      return filters;
    }, [
      categoryFilter,
      colorFilter,
      debouncedSearch,
      locationFilter,
      netWeightFrom,
      netWeightTo,
      purityFilter,
      sourceCreatedFrom,
      sourceCreatedTo,
      sourceFilter,
    ]),
  );

  const detailQuery = useInventoryProductByCode(selectedProductCode);
  const locationsQuery = useLocations({ limit: 100 });

  const products = listQuery.data?.pages.flatMap((page) => page.data) ?? [];
  const totalProducts = listQuery.data?.pages[0]?.total;
  const formattedTotalProducts = formatProductCount(totalProducts);
  const hasSelectedProduct = Boolean(selectedProductCode);
  const selectedProduct = detailQuery.data ?? null;
  const internalRole = profileQuery.data?.profile?.role;
  const canSyncProducts =
    internalRole === "ADMIN" || internalRole === "OPERATIONS";
  const canScanInventory = Boolean(internalRole) && internalRole !== "SALES";

  const updateSearchParams = useCallback(
    (
      updater: (params: URLSearchParams) => void,
      method: "push" | "replace" = "replace",
    ) => {
      const nextParams = new URLSearchParams(searchParams.toString());
      updater(nextParams);
      const query = nextParams.toString();
      const href = query ? `${pathname}?${query}` : pathname;
      if (method === "push") {
        router.push(href);
        return;
      }
      router.replace(href);
    },
    [pathname, router, searchParams],
  );

  const updateQueryParam = useCallback(
    (key: string, value: string, fallbackValue = "ALL") => {
      updateSearchParams((params) => {
        if (!value || value === fallbackValue) {
          params.delete(key);
          return;
        }
        params.set(key, value);
      });
    },
    [updateSearchParams],
  );

  const handleSyncProducts = useCallback(async () => {
    captureProductEvent("inventory_sync_started");
    try {
      await syncInventoryMutation.mutateAsync();
      captureProductEvent("inventory_sync_completed");
      toast.success("Product sync completed");
    } catch (error) {
      captureProductEvent("inventory_sync_failed");
      toast.error(getErrorMessage(error));
    }
  }, [syncInventoryMutation]);

  useEffect(() => {
    setSearchInput(getQueryValue(searchParams, QUERY_PARAM_KEYS.search));
    setCategoryFilter(getCategoryQueryValue(searchParams));
    setColorFilter(getColorQueryValue(searchParams));
    setPurityFilter(getPurityQueryValue(searchParams));
    setSourceFilter(getSourceQueryValue(searchParams));
    setLocationFilter(searchParams.get(QUERY_PARAM_KEYS.location) ?? "ALL");
    setNetWeightFrom(
      getQueryValue(searchParams, QUERY_PARAM_KEYS.netWeightFrom),
    );
    setNetWeightTo(getQueryValue(searchParams, QUERY_PARAM_KEYS.netWeightTo));
    setSourceCreatedFrom(
      getQueryValue(searchParams, QUERY_PARAM_KEYS.sourceCreatedFrom),
    );
    setSourceCreatedTo(
      getQueryValue(searchParams, QUERY_PARAM_KEYS.sourceCreatedTo),
    );
    setGridColumns(getColumnsQueryValue(searchParams));
  }, [searchParams]);

  function selectProduct(productCode: string) {
    const product = products.find((item) => item.productCode === productCode);

    captureProductEvent("inventory_product_selected", {
      product_code: productCode,
      category: product?.category,
      product_source: product
        ? product.isCustomerProduct
          ? "customer"
          : "stock"
        : "unknown",
      location_city: product?.location.city,
    });
    updateSearchParams((params) => {
      params.set("productCode", productCode);
    }, "push");
  }

  function closeProductDetails() {
    captureProductEvent("inventory_product_details_closed", {
      product_code: selectedProductCode,
    });
    updateSearchParams((params) => {
      params.delete("productCode");
    }, "push");
  }

  function resetDialogFilters() {
    captureProductEvent("inventory_filters_cleared", {
      active_filter_count: activeDialogFilterCount,
    });
    setCategoryFilter("ALL");
    setColorFilter("ALL");
    setPurityFilter("ALL");
    setSourceFilter("ALL");
    setLocationFilter("ALL");
    setNetWeightFrom("");
    setNetWeightTo("");
    setSourceCreatedFrom("");
    setSourceCreatedTo("");
    updateSearchParams((params) => {
      params.delete(QUERY_PARAM_KEYS.category);
      params.delete(QUERY_PARAM_KEYS.color);
      params.delete(QUERY_PARAM_KEYS.purity);
      params.delete(QUERY_PARAM_KEYS.source);
      params.delete(QUERY_PARAM_KEYS.location);
      params.delete(QUERY_PARAM_KEYS.netWeightFrom);
      params.delete(QUERY_PARAM_KEYS.netWeightTo);
      params.delete(QUERY_PARAM_KEYS.sourceCreatedFrom);
      params.delete(QUERY_PARAM_KEYS.sourceCreatedTo);
    });
  }

  function handleDecodedBarcode(rawCode: string) {
    const code = normalizeDecodedId(rawCode);
    if (!code) return;

    captureProductEvent("inventory_barcode_scanned", {
      product_code: code,
    });
    setSearchInput(code);
    setIsScannerOpen(false);
    updateSearchParams((params) => {
      params.set(QUERY_PARAM_KEYS.search, code);
      params.set("productCode", code);
    }, "push");
  }

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (
          entry.isIntersecting &&
          listQuery.hasNextPage &&
          !listQuery.isFetchingNextPage
        ) {
          listQuery.fetchNextPage();
        }
      },
      { rootMargin: "360px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [
    listQuery.fetchNextPage,
    listQuery.hasNextPage,
    listQuery.isFetchingNextPage,
  ]);

  const activeDialogFilterCount =
    (categoryFilter !== "ALL" ? 1 : 0) +
    (colorFilter !== "ALL" ? 1 : 0) +
    (purityFilter !== "ALL" ? 1 : 0) +
    (sourceFilter !== "ALL" ? 1 : 0) +
    (locationFilter !== "ALL" ? 1 : 0) +
    (netWeightFrom ? 1 : 0) +
    (netWeightTo ? 1 : 0) +
    (sourceCreatedFrom ? 1 : 0) +
    (sourceCreatedTo ? 1 : 0);

  const hasActiveDialogFilters = activeDialogFilterCount > 0;

  const clearQueryParam = useCallback(
    (key: string) => {
      updateSearchParams((params) => {
        params.delete(key);
      });
    },
    [updateSearchParams],
  );

  const locationLabel =
    locationFilter === "ALL"
      ? null
      : (locationsQuery.data?.data.find(
          (location) => location.id === locationFilter,
        )?.name ?? "Selected location");

  const activeFilterChips = useMemo<ActiveFilterChip[]>(() => {
    const chips: ActiveFilterChip[] = [];

    if (categoryFilter !== "ALL") {
      chips.push({
        key: QUERY_PARAM_KEYS.category,
        label: `Category: ${CATEGORY_LABELS[categoryFilter]}`,
        onRemove: () => {
          setCategoryFilter("ALL");
          clearQueryParam(QUERY_PARAM_KEYS.category);
        },
      });
    }

    if (colorFilter !== "ALL") {
      chips.push({
        key: QUERY_PARAM_KEYS.color,
        label: `Color: ${COLOR_LABELS[colorFilter]}`,
        onRemove: () => {
          setColorFilter("ALL");
          clearQueryParam(QUERY_PARAM_KEYS.color);
        },
      });
    }

    if (purityFilter !== "ALL") {
      chips.push({
        key: QUERY_PARAM_KEYS.purity,
        label: `Purity: ${PURITY_LABELS[purityFilter]}`,
        onRemove: () => {
          setPurityFilter("ALL");
          clearQueryParam(QUERY_PARAM_KEYS.purity);
        },
      });
    }

    if (sourceFilter !== "ALL") {
      chips.push({
        key: QUERY_PARAM_KEYS.source,
        label:
          sourceFilter === "CUSTOMER" ? "Customer product" : "Stock product",
        onRemove: () => {
          setSourceFilter("ALL");
          clearQueryParam(QUERY_PARAM_KEYS.source);
        },
      });
    }

    if (locationFilter !== "ALL") {
      chips.push({
        key: QUERY_PARAM_KEYS.location,
        label: `Location: ${locationLabel}`,
        onRemove: () => {
          setLocationFilter("ALL");
          clearQueryParam(QUERY_PARAM_KEYS.location);
        },
      });
    }

    if (netWeightFrom) {
      chips.push({
        key: QUERY_PARAM_KEYS.netWeightFrom,
        label: `Net wt from: ${netWeightFrom}g`,
        onRemove: () => {
          setNetWeightFrom("");
          clearQueryParam(QUERY_PARAM_KEYS.netWeightFrom);
        },
      });
    }

    if (netWeightTo) {
      chips.push({
        key: QUERY_PARAM_KEYS.netWeightTo,
        label: `Net wt to: ${netWeightTo}g`,
        onRemove: () => {
          setNetWeightTo("");
          clearQueryParam(QUERY_PARAM_KEYS.netWeightTo);
        },
      });
    }

    if (sourceCreatedFrom) {
      chips.push({
        key: QUERY_PARAM_KEYS.sourceCreatedFrom,
        label: `Created from: ${sourceCreatedFrom}`,
        onRemove: () => {
          setSourceCreatedFrom("");
          clearQueryParam(QUERY_PARAM_KEYS.sourceCreatedFrom);
        },
      });
    }

    if (sourceCreatedTo) {
      chips.push({
        key: QUERY_PARAM_KEYS.sourceCreatedTo,
        label: `Created to: ${sourceCreatedTo}`,
        onRemove: () => {
          setSourceCreatedTo("");
          clearQueryParam(QUERY_PARAM_KEYS.sourceCreatedTo);
        },
      });
    }

    return chips;
  }, [
    categoryFilter,
    clearQueryParam,
    colorFilter,
    locationFilter,
    locationLabel,
    netWeightFrom,
    netWeightTo,
    purityFilter,
    sourceCreatedFrom,
    sourceCreatedTo,
    sourceFilter,
  ]);

  function trackFilterChange(filterKey: string, value: string) {
    captureProductEvent("inventory_filter_changed", {
      filter_key: filterKey,
      filter_state: value === "ALL" || !value ? "cleared" : "applied",
    });
  }

  const filterControls = (
    <>
      <Select
        value={categoryFilter}
        onValueChange={(value) => {
          setCategoryFilter(value as InventoryCategory | "ALL");
          updateQueryParam(QUERY_PARAM_KEYS.category, value);
          trackFilterChange(QUERY_PARAM_KEYS.category, value);
        }}
      >
        <SelectTrigger className="h-10 w-full">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All categories</SelectItem>
          {CATEGORY_VALUES.map((category) => (
            <SelectItem key={category} value={category}>
              {CATEGORY_LABELS[category]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={colorFilter}
        onValueChange={(value) => {
          setColorFilter(value as ColorFilter);
          updateQueryParam(QUERY_PARAM_KEYS.color, value);
          trackFilterChange(QUERY_PARAM_KEYS.color, value);
        }}
      >
        <SelectTrigger className="h-10 w-full">
          <SelectValue placeholder="Color" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All colors</SelectItem>
          {(Object.keys(COLOR_LABELS) as ProductColor[]).map((color) => (
            <SelectItem key={color} value={color}>
              {COLOR_LABELS[color]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={purityFilter}
        onValueChange={(value) => {
          setPurityFilter(value as PurityFilter);
          updateQueryParam(QUERY_PARAM_KEYS.purity, value);
          trackFilterChange(QUERY_PARAM_KEYS.purity, value);
        }}
      >
        <SelectTrigger className="h-10 w-full">
          <SelectValue placeholder="Purity" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All purities</SelectItem>
          {(
            Object.keys(PURITY_LABELS) as Array<Exclude<PurityFilter, "ALL">>
          ).map((purity) => (
            <SelectItem key={purity} value={purity}>
              {PURITY_LABELS[purity]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={sourceFilter}
        onValueChange={(value) => {
          setSourceFilter(value as SourceFilter);
          updateQueryParam(QUERY_PARAM_KEYS.source, value);
          trackFilterChange(QUERY_PARAM_KEYS.source, value);
        }}
      >
        <SelectTrigger className="h-10 w-full">
          <SelectValue placeholder="Source" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All sources</SelectItem>
          <SelectItem value="CUSTOMER">Customer product</SelectItem>
          <SelectItem value="STOCK">Stock product</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={locationFilter}
        onValueChange={(value) => {
          setLocationFilter(value);
          updateQueryParam(QUERY_PARAM_KEYS.location, value);
          trackFilterChange(QUERY_PARAM_KEYS.location, value);
        }}
      >
        <SelectTrigger className="h-10 w-full">
          <SelectValue placeholder="Location" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All locations</SelectItem>
          {locationsQuery.data?.data.map((location) => (
            <SelectItem key={location.id} value={location.id}>
              {location.name} · {location.city}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );

  return (
    <div className="flex h-[calc(100svh-5.25rem)] min-h-0 flex-col gap-6 sm:h-[calc(100svh-3rem)]">
      <div className={cn("shrink-0", hasSelectedProduct && "hidden lg:block")}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Product Inventory
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Search products, narrow by inventory attributes, and open any item
              for a full detail view.
            </p>
          </div>
          {canSyncProducts ? (
            <Button
              size="sm"
              type="button"
              variant="outline"
              onClick={handleSyncProducts}
              disabled={syncInventoryMutation.isPending}
              className="w-fit shrink-0 gap-2"
            >
              <RefreshCw
                className={cn(
                  "h-4 w-4",
                  syncInventoryMutation.isPending && "animate-spin",
                )}
              />
              {syncInventoryMutation.isPending
                ? "Syncing..."
                : "Sync from Catalog"}
            </Button>
          ) : null}
        </div>
      </div>

      <section
        className={cn(
          "grid shrink-0 gap-3 lg:grid-cols-[minmax(0,40%)_minmax(0,60%)] lg:items-center",
          hasSelectedProduct && "hidden lg:grid",
        )}
      >
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            All Products
            {formattedTotalProducts ? ` (${formattedTotalProducts})` : null}
          </h2>
        </div>
        <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto] sm:items-center">
          <div className="relative min-w-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(event) => {
                const { value } = event.target;
                setSearchInput(value);
                updateQueryParam(QUERY_PARAM_KEYS.search, value.trim(), "");
              }}
              onBlur={() => {
                const query = searchInput.trim();
                if (!query) return;
                captureProductEvent("inventory_search_used", {
                  query_length: query.length,
                });
              }}
              placeholder="Search code, vendor, location, category"
              className="h-10 pl-9"
            />
          </div>
          {canScanInventory ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsScannerOpen(true)}
              className="h-10 shrink-0 gap-2"
            >
              <ScanLine className="h-4 w-4" />
              Scan
            </Button>
          ) : null}
          <Button
            type="button"
            variant={hasActiveDialogFilters ? "default" : "outline"}
            onClick={() => {
              setIsAdvancedFiltersOpen(true);
              captureProductEvent("inventory_filters_opened", {
                active_filter_count: activeDialogFilterCount,
              });
            }}
            className="h-10 shrink-0 gap-2"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {hasActiveDialogFilters ? (
              <Badge variant="secondary" className="ml-0.5 px-1.5">
                {activeDialogFilterCount}
              </Badge>
            ) : null}
          </Button>
          {!hasSelectedProduct ? (
            <div className="hidden h-10 shrink-0 items-center rounded-md border border-border bg-background p-1 lg:flex">
              <Button
                type="button"
                variant={gridColumns === 2 ? "secondary" : "ghost"}
                size="icon"
                aria-label="Show 2 columns"
                aria-pressed={gridColumns === 2}
                onClick={() => {
                  setGridColumns(2);
                  updateQueryParam(QUERY_PARAM_KEYS.columns, "2", "3");
                }}
                className="size-8"
              >
                <Columns2 className="size-4" />
              </Button>
              <Button
                type="button"
                variant={gridColumns === 3 ? "secondary" : "ghost"}
                size="icon"
                aria-label="Show 3 columns"
                aria-pressed={gridColumns === 3}
                onClick={() => {
                  setGridColumns(3);
                  updateQueryParam(QUERY_PARAM_KEYS.columns, "3", "3");
                }}
                className="size-8"
              >
                <Columns3 className="size-4" />
              </Button>
            </div>
          ) : null}
        </div>
      </section>

      {activeFilterChips.length > 0 ? (
        <ul
          className={cn(
            "shrink-0 flex-wrap items-center gap-2",
            hasSelectedProduct && "hidden lg:flex",
            !hasSelectedProduct && "flex",
          )}
          aria-label="Selected inventory filters"
        >
          {activeFilterChips.map((filter) => (
            <li key={filter.key}>
              <Badge
                variant="secondary"
                className="h-8 gap-1.5 rounded-md border border-border bg-muted/60 px-2.5 text-xs font-medium text-foreground"
              >
                <span>{filter.label}</span>
                <button
                  type="button"
                  onClick={filter.onRemove}
                  className="-mr-1 inline-flex size-5 cursor-pointer items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={`Remove ${filter.label} filter`}
                >
                  <X className="size-3.5" />
                </button>
              </Badge>
            </li>
          ))}
        </ul>
      ) : null}

      <Dialog
        open={isAdvancedFiltersOpen}
        onOpenChange={setIsAdvancedFiltersOpen}
      >
        <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto p-0 sm:max-w-2xl">
          <DialogHeader>
            <div className="px-5 pt-5 sm:px-6 sm:pt-6">
              <DialogTitle>Filters</DialogTitle>
              <DialogDescription className="mt-2">
                Refine inventory results by product attributes, location,
                weight, and source date.
              </DialogDescription>
            </div>
          </DialogHeader>
          <div className="space-y-6 px-5 pb-5 sm:px-6">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Product attributes</Label>
              <div className="grid gap-3 sm:grid-cols-2">{filterControls}</div>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Net weight (g)</Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    value={netWeightFrom}
                    onChange={(event) => {
                      const { value } = event.target;
                      setNetWeightFrom(value);
                      updateQueryParam(
                        QUERY_PARAM_KEYS.netWeightFrom,
                        value,
                        "",
                      );
                    }}
                    placeholder="From"
                  />
                  <Input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    value={netWeightTo}
                    onChange={(event) => {
                      const { value } = event.target;
                      setNetWeightTo(value);
                      updateQueryParam(QUERY_PARAM_KEYS.netWeightTo, value, "");
                    }}
                    placeholder="To"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Source created at</Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <DatePicker
                    value={sourceCreatedFrom}
                    placeholder="From date"
                    onChange={(value) => {
                      setSourceCreatedFrom(value);
                      updateQueryParam(
                        QUERY_PARAM_KEYS.sourceCreatedFrom,
                        value,
                        "",
                      );
                    }}
                  />
                  <DatePicker
                    value={sourceCreatedTo}
                    placeholder="To date"
                    onChange={(value) => {
                      setSourceCreatedTo(value);
                      updateQueryParam(
                        QUERY_PARAM_KEYS.sourceCreatedTo,
                        value,
                        "",
                      );
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="border-t border-border px-5 py-4 sm:px-6">
            <Button
              type="button"
              variant="outline"
              onClick={resetDialogFilters}
              className="w-full sm:w-auto"
            >
              Clear all filters
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div
        className={cn(
          "grid min-h-0 w-full flex-1 gap-3",
          hasSelectedProduct
            ? "lg:grid-cols-[minmax(280px,360px)_minmax(0,1fr)] lg:overflow-hidden"
            : "overflow-hidden",
        )}
      >
        <section
          className={cn(
            "min-h-0 rounded-md",
            hasSelectedProduct &&
              "hidden lg:block lg:h-full lg:min-h-0 lg:overflow-y-auto lg:pr-3",
            !hasSelectedProduct && "overflow-y-auto pr-3",
          )}
        >
          {listQuery.isLoading ? (
            hasSelectedProduct ? (
              <ProductListSkeleton />
            ) : (
              <ProductGridSkeleton columns={gridColumns} />
            )
          ) : listQuery.isError ? (
            <ErrorPanel
              title="Unable to load products"
              message={getErrorMessage(listQuery.error)}
            />
          ) : products.length > 0 ? (
            <div
              className={cn(
                "grid gap-3",
                getInventoryGridClass({
                  columns: gridColumns,
                  hasSelectedProduct,
                }),
              )}
            >
              {products.map((product) => (
                <ProductListItem
                  key={product.id}
                  product={product}
                  selected={product.productCode === selectedProductCode}
                  compact={hasSelectedProduct}
                  onSelect={() => selectProduct(product.productCode)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border py-16 text-center">
              <PackageSearch className="mx-auto h-7 w-7 text-muted-foreground/40" />
              <p className="mt-3 text-sm font-medium text-muted-foreground">
                No products match these filters
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                Clear or adjust your filters to see more products.
              </p>
            </div>
          )}
          <div ref={loadMoreRef} className="h-4" />
          {listQuery.isFetchingNextPage ? (
            <p className="py-2 text-center text-xs text-muted-foreground">
              Fetching more products...
            </p>
          ) : products.length > 0 && !listQuery.hasNextPage ? (
            <p className="py-2 text-center text-xs text-muted-foreground">
              -- End of List --
            </p>
          ) : null}
        </section>

        {hasSelectedProduct ? (
          <div className="min-w-0 space-y-3 lg:h-full lg:min-h-0 lg:overflow-y-auto lg:pr-3">
            <div>
              <Button
                type="button"
                variant="ghost"
                onClick={closeProductDetails}
                className="h-9 gap-2 px-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to inventory
              </Button>
            </div>
            {selectedProductCode &&
            detailQuery.isLoading &&
            !selectedProduct ? (
              <ProductDetailSkeleton />
            ) : selectedProductCode && detailQuery.isError ? (
              <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <ErrorPanel
                  title="Unable to load product details"
                  message={getErrorMessage(detailQuery.error)}
                />
              </section>
            ) : selectedProduct ? (
              <>
                <ProductDetail
                  product={selectedProduct}
                  settings={settings}
                  estimationSectionRef={estimationSectionRef}
                />
                <ProductSpecification product={selectedProduct} />
                <ProductEstimationSection
                  product={selectedProduct}
                  settings={settings}
                  estimationSectionRef={estimationSectionRef}
                />
              </>
            ) : null}
          </div>
        ) : null}
      </div>

      {canScanInventory ? (
        <BarcodeScanDialog
          open={isScannerOpen}
          onOpenChange={setIsScannerOpen}
          onDecoded={handleDecodedBarcode}
        />
      ) : null}
    </div>
  );
}
