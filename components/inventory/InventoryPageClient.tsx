"use client";

import {
  AlertCircle,
  ArrowLeft,
  Diamond,
  MapPin,
  PackageSearch,
  ScanLine,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type RefObject, useEffect, useMemo, useRef, useState } from "react";
import { BarcodeScanDialog } from "@/components/calculator/BarcodeScanDialog";
import { EstimationSummaryCard } from "@/components/calculator/EstimationSummaryCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  useInfiniteInventoryProducts,
  useInventoryProductByCode,
} from "@/hooks/useInventoryProducts";
import { useLocations } from "@/hooks/useManageProducts";
import { normalizeDecodedId } from "@/lib/barcodeScanner";
import { computeEstimateFromInputs } from "@/lib/calculator/pricing";
import { cn, formatCurrency } from "@/lib/utils";
import type {
  CalculatorFormState,
  CalculatorSettings,
  CalculatorStoneInput,
  MetalPurity,
} from "@/types";
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
  | "OTHER";
type SourceFilter = "ALL" | "CUSTOMER" | "STOCK";
type ColorFilter = "ALL" | ProductColor;
type PurityFilter = "ALL" | "14" | "18" | "24";

const CATEGORY_VALUES: readonly InventoryCategory[] = [
  "RING",
  "NECKLACE",
  "EARRING",
  "BRACELET",
  "PENDANT",
  "BANGLE",
  "ANKLET",
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

function formatWeight(value: string | number, unit: string) {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return `- ${unit}`;
  return `${numeric.toFixed(2)} ${unit}`;
}

function parseNumber(value: string | number | null | undefined) {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong";
}

function getPrimaryImage(product: InventoryProduct) {
  return product.media.find((item) => item.isPrimary) ?? product.media[0];
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
  return (product.stones ?? []).reduce(
    (sum, stone) => sum + stone.totalPieces,
    0,
  );
}

function getTotalStoneCarat(product: InventoryProduct) {
  const totalStoneWeight = Number(product.totalStoneWeight);
  if (Number.isFinite(totalStoneWeight) && totalStoneWeight > 0) {
    return totalStoneWeight;
  }

  return (product.stones ?? []).reduce(
    (sum, stone) => sum + (Number(stone.totalNetWeight) || 0),
    0,
  );
}

function getInventoryPurity(product: InventoryProduct): MetalPurity {
  const purity = `${product.purity}K`;
  return ["14K", "18K", "22K", "24K"].includes(purity)
    ? (purity as MetalPurity)
    : "Other";
}

function findStoneTypeIdBySlabCode(settings: CalculatorSettings, code: string) {
  const normalizedCode = code.trim();

  for (const stoneType of settings.stoneTypes) {
    if (stoneType.slabs.some((slab) => slab.code === normalizedCode)) {
      return stoneType.stoneId;
    }
  }

  return null;
}

function buildInventoryCalculatorStones(
  product: InventoryProduct,
  settings: CalculatorSettings,
): CalculatorStoneInput[] {
  return (product.stones ?? []).flatMap((stone) => {
    const stoneTypeId = findStoneTypeIdBySlabCode(
      settings,
      stone.stoneSlabCode,
    );
    const weight = parseNumber(stone.totalNetWeight);

    if (!stoneTypeId || weight <= 0) return [];

    return [
      {
        id: stone.id,
        stoneTypeId,
        weight,
        quantity: Math.max(1, stone.totalPieces),
      },
    ];
  });
}

function buildInventoryPricingSettings(
  product: InventoryProduct,
  settings: CalculatorSettings,
): CalculatorSettings {
  const stoneTypes = settings.stoneTypes.map((stoneType) => ({
    ...stoneType,
    slabs: [...stoneType.slabs],
  }));

  for (const stone of product.stones ?? []) {
    if (
      findStoneTypeIdBySlabCode(
        { ...settings, stoneTypes },
        stone.stoneSlabCode,
      )
    ) {
      continue;
    }

    const stoneTypeId = stone.slab.stoneType.id;
    const existingStoneType = stoneTypes.find(
      (stoneType) => stoneType.stoneId === stoneTypeId,
    );
    const apiSlab = {
      code: stone.stoneSlabCode,
      fromWeight: parseNumber(stone.slab.rangeFrom),
      toWeight: parseNumber(stone.slab.rangeTo),
      pricePerCarat: parseNumber(stone.slab.pricePerCarat),
    };

    if (existingStoneType) {
      existingStoneType.slabs = [...existingStoneType.slabs, apiSlab];
      continue;
    }

    stoneTypes.push({
      stoneId: stoneTypeId,
      name: stone.slab.stoneType.name,
      category:
        stone.slab.stoneType.category === "Gemstone" ? "Gemstone" : "Diamond",
      clarity: stone.slab.stoneType.clarity,
      color: stone.slab.stoneType.color ?? undefined,
      slabs: [apiSlab],
    });
  }

  return { ...settings, stoneTypes };
}

function buildInventoryCalculatorForm(
  product: InventoryProduct,
  settings: CalculatorSettings,
): CalculatorFormState {
  return {
    netGoldWeight: parseNumber(product.netWeight),
    purity: getInventoryPurity(product),
    stones: buildInventoryCalculatorStones(product, settings),
    productName: product.name,
    productNote: product.description ?? "",
    productImageUrl: getPrimaryImage(product)?.storageKey,
  };
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
  onSelect,
}: {
  product: InventoryProduct;
  selected: boolean;
  onSelect: () => void;
}) {
  const image = getPrimaryImage(product);
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-start gap-3 rounded-xl border bg-card p-3 text-left shadow-sm transition-colors cursor-pointer hover:border-foreground/25 hover:bg-muted/20",
        selected
          ? "border-foreground/60 ring-1 ring-foreground/10"
          : "border-border",
      )}
    >
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
        {image ? (
          <Image
            src={image.storageKey}
            alt={image.altText}
            fill
            unoptimized
            sizes="80px"
            className="object-cover"
          />
        ) : null}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-foreground">
              {product.name}
            </h3>
            <p className="mt-0.5 font-mono text-xs text-muted-foreground">
              {product.productCode}
            </p>
          </div>
          <Badge variant={product.isCustomerProduct ? "default" : "outline"}>
            {product.isCustomerProduct ? "Customer" : "Stock"}
          </Badge>
        </div>

        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
          {getMetalLabel(product)}
        </p>
        <p className="mt-2 text-sm text-foreground">
          Net wt {formatWeight(product.netWeight, "g")}
        </p>
      </div>
    </button>
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
  const image = getPrimaryImage(product);
  const pricingSettings = useMemo(
    () => buildInventoryPricingSettings(product, settings),
    [product, settings],
  );
  const form = useMemo(
    () => buildInventoryCalculatorForm(product, pricingSettings),
    [product, pricingSettings],
  );
  const breakdown = useMemo(
    () =>
      computeEstimateFromInputs(
        pricingSettings,
        form.netGoldWeight,
        form.purity,
        form.stones,
      ),
    [form.netGoldWeight, form.purity, form.stones, pricingSettings],
  );

  function scrollToEstimation() {
    estimationSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="grid lg:min-h-[26rem] lg:grid-cols-[minmax(280px,0.95fr)_minmax(300px,1fr)]">
        <div className="relative aspect-[4/3] min-h-72 bg-muted/40 lg:aspect-auto lg:min-h-full">
          {image ? (
            <Image
              src={image.storageKey}
              alt={image.altText}
              fill
              unoptimized
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="object-cover"
            />
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
                value={formatCurrency(Math.round(breakdown.total))}
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
  const pricingSettings = useMemo(
    () => buildInventoryPricingSettings(product, settings),
    [product, settings],
  );
  const form = useMemo(
    () => buildInventoryCalculatorForm(product, pricingSettings),
    [product, pricingSettings],
  );
  const breakdown = useMemo(
    () =>
      computeEstimateFromInputs(
        pricingSettings,
        form.netGoldWeight,
        form.purity,
        form.stones,
      ),
    [form.netGoldWeight, form.purity, form.stones, pricingSettings],
  );

  return (
    <section ref={estimationSectionRef} className="scroll-mt-4">
      <EstimationSummaryCard
        title="Product estimation"
        data={{
          kind: "calculator",
          form,
          breakdown,
          gstRate: settings.gstRate,
        }}
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
                        {stone.slab.stoneType.name}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {stone.stoneSlabCode} · {stone.slab.rangeFrom} -{" "}
                        {stone.slab.rangeTo} ct
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">
                        {formatWeight(stone.totalNetWeight, "ct")}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {stone.totalPieces.toLocaleString("en-IN")} pcs
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

function ProductGridSkeleton() {
  const rows = ["row-1", "row-2", "row-3", "row-4", "row-5", "row-6"];

  return (
    <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
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

  const [searchInput, setSearchInput] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<
    InventoryCategory | "ALL"
  >("ALL");
  const [colorFilter, setColorFilter] = useState<ColorFilter>("ALL");
  const [purityFilter, setPurityFilter] = useState<PurityFilter>("ALL");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("ALL");
  const [locationFilter, setLocationFilter] = useState<string>("ALL");

  const [netWeightFrom, setNetWeightFrom] = useState("");
  const [netWeightTo, setNetWeightTo] = useState("");
  const [sourceCreatedFrom, setSourceCreatedFrom] = useState("");
  const [sourceCreatedTo, setSourceCreatedTo] = useState("");

  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const estimationSectionRef = useRef<HTMLElement | null>(null);
  const { settings } = useCalculatorSettings();

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
  const hasSelectedProduct = Boolean(selectedProductCode);
  const selectedProduct = detailQuery.data ?? null;

  function updateSearchParams(updater: (params: URLSearchParams) => void) {
    const nextParams = new URLSearchParams(searchParams.toString());
    updater(nextParams);
    const query = nextParams.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  function selectProduct(productCode: string) {
    updateSearchParams((params) => {
      params.set("productCode", productCode);
    });
  }

  function closeProductDetails() {
    updateSearchParams((params) => {
      params.delete("productCode");
    });
  }

  function resetDialogFilters() {
    setCategoryFilter("ALL");
    setColorFilter("ALL");
    setPurityFilter("ALL");
    setSourceFilter("ALL");
    setLocationFilter("ALL");
    setNetWeightFrom("");
    setNetWeightTo("");
    setSourceCreatedFrom("");
    setSourceCreatedTo("");
  }

  function handleDecodedBarcode(rawCode: string) {
    const code = normalizeDecodedId(rawCode);
    if (!code) return;

    setSearchInput(code);
    setIsScannerOpen(false);
    selectProduct(code);
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

  const filterControls = (
    <>
      <Select
        value={categoryFilter}
        onValueChange={(value) =>
          setCategoryFilter(value as InventoryCategory | "ALL")
        }
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
        onValueChange={(value) => setColorFilter(value as ColorFilter)}
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
        onValueChange={(value) => setPurityFilter(value as PurityFilter)}
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
        onValueChange={(value) => setSourceFilter(value as SourceFilter)}
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

      <Select value={locationFilter} onValueChange={setLocationFilter}>
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
    <div className="space-y-6">
      <div className={cn(hasSelectedProduct && "hidden lg:block")}>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Browse product inventory
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Search products, narrow by inventory attributes, and open any item for
          a full detail view.
        </p>
      </div>

      <section
        className={cn(
          "grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center lg:flex lg:flex-wrap lg:gap-3",
          hasSelectedProduct && "hidden lg:flex",
        )}
      >
        <div className="min-w-0 flex-1 lg:min-w-[320px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search code, vendor, location, category"
              className="h-10 pl-9"
            />
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsScannerOpen(true)}
          className="h-10 shrink-0 gap-2"
        >
          <ScanLine className="h-4 w-4" />
          Scan Barcode
        </Button>
        <Button
          type="button"
          variant={hasActiveDialogFilters ? "default" : "outline"}
          onClick={() => setIsAdvancedFiltersOpen(true)}
          className="h-10 shrink-0 gap-2"
        >
          <SlidersHorizontal className="h-4 w-4" />
          More filters
          {hasActiveDialogFilters ? (
            <Badge variant="secondary" className="ml-0.5 px-1.5">
              {activeDialogFilterCount}
            </Badge>
          ) : null}
        </Button>
      </section>

      <Dialog
        open={isAdvancedFiltersOpen}
        onOpenChange={setIsAdvancedFiltersOpen}
      >
        <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto p-0 sm:max-w-2xl">
          <DialogHeader>
            <div className="px-5 pt-5 sm:px-6 sm:pt-6">
              <DialogTitle>More filters</DialogTitle>
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
                    onChange={(event) => setNetWeightFrom(event.target.value)}
                    placeholder="From"
                  />
                  <Input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    value={netWeightTo}
                    onChange={(event) => setNetWeightTo(event.target.value)}
                    placeholder="To"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Source created at</Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    type="date"
                    value={sourceCreatedFrom}
                    onChange={(event) =>
                      setSourceCreatedFrom(event.target.value)
                    }
                  />
                  <Input
                    type="date"
                    value={sourceCreatedTo}
                    onChange={(event) => setSourceCreatedTo(event.target.value)}
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
          "grid w-full gap-3",
          hasSelectedProduct
            ? "lg:h-[calc(100svh-12rem)] lg:min-h-[32rem] lg:grid-cols-[minmax(320px,420px)_minmax(0,1fr)] lg:overflow-hidden"
            : "",
        )}
      >
        <section
          className={cn(
            "rounded-md",
            hasSelectedProduct &&
              "hidden lg:block lg:h-full lg:min-h-0 lg:overflow-y-auto lg:pr-3",
          )}
        >
          {listQuery.isLoading ? (
            hasSelectedProduct ? (
              <ProductListSkeleton />
            ) : (
              <ProductGridSkeleton />
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
                hasSelectedProduct
                  ? "grid-cols-1"
                  : "md:grid-cols-2 2xl:grid-cols-3",
              )}
            >
              {products.map((product) => (
                <ProductListItem
                  key={product.id}
                  product={product}
                  selected={product.productCode === selectedProductCode}
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

      <BarcodeScanDialog
        open={isScannerOpen}
        onOpenChange={setIsScannerOpen}
        onDecoded={handleDecodedBarcode}
      />
    </div>
  );
}
