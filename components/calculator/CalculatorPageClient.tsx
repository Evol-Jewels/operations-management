"use client";

import {
  ArrowUpRight,
  CircleDollarSign,
  Diamond,
  ImageIcon,
  Loader2,
  MapPin,
  Plus,
  RefreshCcw,
  ScanLine,
  Search,
  Settings2,
  Trash2,
  X,
} from "lucide-react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RequireInternalAuth } from "@/components/auth/RequireInternalAuth";
import { BarcodeScanDialog } from "@/components/calculator/BarcodeScanDialog";
import { EstimationSummaryCard } from "@/components/calculator/EstimationSummaryCard";
import { SettingsView } from "@/components/calculator/SettingsView";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCalculatorSettings } from "@/hooks/useCalculatorSettings";
import { normalizeDecodedId } from "@/lib/barcodeScanner";
import {
  calculateGoldRate,
  computeEstimateFromInputs,
  getStoneType,
  resolveAutoSlab,
} from "@/lib/calculator/pricing";
import {
  type CalculatorTab,
  writeCalculatorTabCookie,
} from "@/lib/calculatorTab";
import {
  fetchInventoryProductByCode,
  fetchInventoryProducts,
} from "@/lib/inventoryApi";
import { normalizeInventoryProductEstimate } from "@/lib/inventoryProductMapping";
import {
  createRecentProductEstimate,
  fetchRecentProductEstimates,
} from "@/lib/recentProductEstimatesApi";
import { cn, formatCurrency } from "@/lib/utils";
import type {
  CalculatorFormState,
  CalculatorSettings,
  CalculatorStoneInput,
  MetalPurity,
  ProductEstimateResult,
  RecentProductEstimate,
} from "@/types";
import type { InventoryProduct } from "@/types/inventory-api";

const PURITY_OPTIONS: MetalPurity[] = ["24K", "22K", "18K", "14K"];
const RECENT_ESTIMATE_SKELETON_IDS = [
  "recent-skeleton-1",
  "recent-skeleton-2",
  "recent-skeleton-3",
  "recent-skeleton-4",
];

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

function normalizeMetalPurity(value: string): MetalPurity {
  return ["14K", "18K", "22K", "24K", "Other"].includes(value)
    ? (value as MetalPurity)
    : "Other";
}

function createStone(settings: CalculatorSettings): CalculatorStoneInput {
  return {
    id: generateId(),
    stoneTypeId: settings.stoneTypes[0]?.stoneId ?? "",
    weight: 0,
    quantity: 1,
  };
}

function formatWeight(value: number, decimals = 3) {
  return value.toFixed(decimals).replace(/\.?0+$/, "");
}

function NumericLineInput({
  value,
  onChange,
  placeholder,
  suffix,
  min = 0,
  step = 0.001,
}: {
  value: number;
  onChange: (value: number) => void;
  placeholder: string;
  suffix?: string;
  min?: number;
  step?: number;
}) {
  return (
    <div className="flex h-9 items-end gap-2 border-b border-border pb-1.5 focus-within:border-foreground">
      <input
        type="number"
        inputMode="decimal"
        min={min}
        step={step}
        value={value || ""}
        onChange={(event) => onChange(Number(event.target.value) || 0)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent px-0 text-sm outline-none placeholder:text-muted-foreground/35"
      />
      {suffix ? (
        <span className="shrink-0 pb-0.5 text-sm text-muted-foreground">
          {suffix}
        </span>
      ) : null}
    </div>
  );
}

function SectionLabel({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {title}
      </p>
      {action}
    </div>
  );
}

function TabsSwitcher({
  activeTab,
  onTabChange,
}: {
  activeTab: CalculatorTab;
  onTabChange: (tab: CalculatorTab) => void;
}) {
  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => onTabChange(value as CalculatorTab)}
      className="w-full sm:w-[300px]"
    >
      <TabsList className="grid h-11 w-full grid-cols-2 rounded-xl border border-border bg-muted/50 p-1">
        <TabsTrigger
          value="search"
          className="h-9 rounded-lg data-[state=active]:bg-foreground data-[state=active]:text-background"
        >
          <Search className="h-4 w-4" />
          Search
        </TabsTrigger>
        <TabsTrigger
          value="calculate"
          className="h-9 rounded-lg data-[state=active]:bg-foreground data-[state=active]:text-background"
        >
          <CircleDollarSign className="h-4 w-4" />
          Calculate
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

function PurityCards({
  settings,
  value,
  onChange,
}: {
  settings: CalculatorSettings;
  value: MetalPurity;
  onChange: (value: MetalPurity) => void;
}) {
  const purityCards = useMemo(() => {
    return PURITY_OPTIONS.map((purity) => ({
      purity,
      rate: calculateGoldRate(
        settings.goldRate24k,
        purity,
        settings.purityPercentages,
      ),
    }));
  }, [settings.goldRate24k, settings.purityPercentages]);

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {purityCards.map((card) => {
        const selected = value === card.purity;

        return (
          <button
            key={card.purity}
            type="button"
            onClick={() => onChange(card.purity)}
            className={cn(
              "flex h-12 flex-col items-center justify-center rounded-lg border px-2 text-center transition-colors",
              selected
                ? "border-foreground bg-muted text-foreground"
                : "border-border bg-background hover:border-foreground/30",
            )}
          >
            <span className="text-sm font-semibold">{card.purity}</span>
            <span
              className={cn(
                "mt-0.5 hidden text-[10px] sm:block",
                "text-muted-foreground",
              )}
            >
              {formatCurrency(card.rate)}/g
            </span>
          </button>
        );
      })}
    </div>
  );
}

function StoneRow({
  settings,
  stone,
  index,
  canRemove,
  onChange,
  onRemove,
}: {
  settings: CalculatorSettings;
  stone: CalculatorStoneInput;
  index: number;
  canRemove: boolean;
  onChange: (patch: Partial<CalculatorStoneInput>) => void;
  onRemove: () => void;
}) {
  const stoneType = getStoneType(settings, stone.stoneTypeId);
  const resolvedSlab = resolveAutoSlab(
    stoneType?.slabs ?? [],
    stone.weight,
    stone.quantity,
  );
  const hasUnmatchedWeight = stone.weight > 0 && !resolvedSlab;

  return (
    <div className="space-y-3 border-b border-border pb-3.5 last:border-b-0 last:pb-0">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Stone {index + 1}
          </p>
          {resolvedSlab ? (
            <span className="text-[11px] text-muted-foreground">
              {formatWeight(resolvedSlab.fromWeight)}-
              {formatWeight(resolvedSlab.toWeight)} ct
            </span>
          ) : null}
        </div>
        {canRemove ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={onRemove}
            aria-label={`Remove stone ${index + 1}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        ) : null}
      </div>

      <Select
        value={stone.stoneTypeId}
        onValueChange={(stoneTypeId) => onChange({ stoneTypeId })}
      >
        <SelectTrigger className="h-9 w-full border-0 border-b bg-transparent px-0 text-sm shadow-none focus:ring-0">
          <SelectValue placeholder="Select stone" />
        </SelectTrigger>
        <SelectContent>
          {settings.stoneTypes.map((item) => (
            <SelectItem key={item.stoneId} value={item.stoneId}>
              <span className="flex items-center gap-2">
                {item.category === "Diamond" ? (
                  <Diamond className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <span className="h-3 w-3 rounded-full bg-muted-foreground/40" />
                )}
                {item.name}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="grid grid-cols-1 gap-4 min-[430px]:grid-cols-2 min-[430px]:gap-5">
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Weight
          </p>
          <NumericLineInput
            value={stone.weight}
            onChange={(weight) => onChange({ weight })}
            placeholder="0.000"
            suffix="ct"
          />
          {hasUnmatchedWeight ? (
            <p className="text-xs text-destructive">No matching slab</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Pieces
          </p>
          <NumericLineInput
            value={stone.quantity}
            onChange={(quantity) =>
              onChange({ quantity: Math.max(1, quantity) })
            }
            placeholder="1"
            min={1}
            step={1}
          />
        </div>
      </div>
    </div>
  );
}

function ProductImageInput({
  imageUrl,
  fileInputRef,
  onImageChange,
}: {
  imageUrl?: string;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onImageChange: (file: File | null) => void;
}) {
  return (
    <>
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border text-sm text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
      >
        <ImageIcon className="h-4 w-4" />
        {imageUrl ? "Change image" : "Add image"}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => onImageChange(event.target.files?.[0] ?? null)}
      />
    </>
  );
}

function BlockedLookupCard({ result }: { result: ProductEstimateResult }) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-semibold">{result.product.productName}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <span>{result.product.productCode}</span>
            <span>-</span>
            <span>{result.product.categoryLabel}</span>
            <span>-</span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {result.product.location}
            </span>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-muted px-3 py-1 text-[10px] text-muted-foreground">
          {result.product.stones.length} stone lines
        </span>
      </div>

      <div className="mt-4 rounded-xl border border-destructive/35 px-4 py-3 text-sm text-destructive">
        <p className="font-semibold">Estimate blocked</p>
        <div className="mt-1 space-y-1 text-xs">
          {result.issues.map((issue) => (
            <p key={`${issue.code}:${issue.reason}`}>
              {issue.code}: {issue.reason}
            </p>
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {result.product.stones.map((stone) => (
          <div
            key={stone.id}
            className="flex items-start justify-between gap-4 rounded-md bg-muted/25 px-3 py-2"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium">{stone.code}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatWeight(stone.weight)} ct - {stone.quantity} pcs
                {stone.stoneName !== "Unknown" ? ` - ${stone.stoneName}` : ""}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs text-muted-foreground">Source</p>
              <p className="text-sm font-medium tabular">
                {formatCurrency(stone.sourceAmount)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatEstimateDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

function SearchCountLabel({ count }: { count: number }) {
  return (
    <span>
      {count} {count === 1 ? "search" : "searches"}
    </span>
  );
}

function RecentEstimateRow({
  estimate,
  onOpen,
}: {
  estimate: RecentProductEstimate;
  onOpen: (estimate: RecentProductEstimate) => void;
}) {
  const imageUrl = estimate.imageUrl ?? undefined;
  const hasImage = Boolean(imageUrl);

  return (
    <button
      type="button"
      onClick={() => onOpen(estimate)}
      className={cn(
        "group grid min-h-14 w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-muted/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
        hasImage
          ? "grid-cols-[auto_minmax(0,1fr)_auto]"
          : "grid-cols-[minmax(0,1fr)_auto]",
      )}
    >
      {hasImage && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
          <Image
            src={imageUrl as string}
            alt={estimate.productCode}
            width={36}
            height={36}
            className="h-full w-full object-cover"
            unoptimized
          />
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{estimate.productCode}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          <SearchCountLabel count={estimate.totalSearches} />
        </p>
      </div>
      <span className="text-xs text-muted-foreground">
        {formatEstimateDate(estimate.updatedAt)}
      </span>
    </button>
  );
}

function RecentEstimatesList({
  refreshKey,
  onOpen,
}: {
  refreshKey: number;
  onOpen: (estimate: RecentProductEstimate) => void;
}) {
  const [estimates, setEstimates] = useState<RecentProductEstimate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [manualRefreshKey, setManualRefreshKey] = useState(0);

  useEffect(() => {
    async function loadRecentEstimates(_requestKey: string) {
      setIsLoading(true);
      setError(null);

      try {
        const items = await fetchRecentProductEstimates({
          limit: 10,
          offset: 0,
        });
        setEstimates(items);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load recents");
      } finally {
        setIsLoading(false);
      }
    }

    loadRecentEstimates(`${refreshKey}:${manualRefreshKey}`);
  }, [refreshKey, manualRefreshKey]);

  return (
    <section className="my-5 space-y-2">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-base font-semibold">Recent Estimates</h2>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5"
          onClick={() => setManualRefreshKey((current) => current + 1)}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCcw className="h-4 w-4" />
          )}
          Refresh
        </Button>
      </div>

      <div>
        {isLoading ? (
          RECENT_ESTIMATE_SKELETON_IDS.map((id) => (
            <div key={id} className="flex min-h-16 items-center gap-4 px-3">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-32 rounded bg-muted" />
                <div className="h-3 w-20 rounded bg-muted" />
              </div>
              <div className="h-3 w-12 rounded bg-muted" />
            </div>
          ))
        ) : error ? (
          <div className="rounded-xl border border-destructive/35 px-4 py-3 text-sm text-destructive">
            <p>{error}</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-2 h-8 px-0 text-destructive hover:text-destructive"
              onClick={() => setManualRefreshKey((current) => current + 1)}
            >
              Try again
            </Button>
          </div>
        ) : estimates.length === 0 ? (
          <div className="rounded-md border border-dashed border-border px-4 py-5 text-center text-sm text-muted-foreground">
            No recent estimates yet.
          </div>
        ) : (
          estimates.map((estimate) => (
            <RecentEstimateRow
              key={estimate.id}
              estimate={estimate}
              onOpen={onOpen}
            />
          ))
        )}
      </div>
    </section>
  );
}

function RecentEstimateSummaryDialog({
  open,
  onOpenChange,
  estimate,
  settings,
  onLoadProduct,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  estimate: RecentProductEstimate | null;
  settings: CalculatorSettings;
  onLoadProduct: (result: ProductEstimateResult) => void;
}) {
  const [result, setResult] = useState<ProductEstimateResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !estimate) return;

    async function loadEstimateDetails() {
      if (!estimate) return;

      setIsLoading(true);
      setError(null);
      setResult(null);

      try {
        const product = await fetchInventoryProductByCode(estimate.productCode);
        if (!product) {
          setError(`Product details unavailable for ${estimate.productCode}.`);
          return;
        }

        setResult(normalizeInventoryProductEstimate(product, settings));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load summary");
      } finally {
        setIsLoading(false);
      }
    }

    loadEstimateDetails();
  }, [estimate, open, settings]);

  function loadIntoCalculator() {
    if (!result || result.issues.length > 0) return;
    onLoadProduct(result);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[92vh] gap-0 overflow-hidden rounded-xl p-0 sm:max-w-2xl"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">
          Estimate summary for {estimate?.productCode ?? "product"}
        </DialogTitle>
        <div className="flex items-center justify-center border-b border-border px-5 py-4">
          <Image
            src="/evol-logo-white.webp"
            alt="Evol"
            width={82}
            height={30}
            className="h-7 w-auto object-contain dark:brightness-0 dark:invert"
            priority
          />
          <button
            type="button"
            aria-label="Close summary"
            onClick={() => onOpenChange(false)}
            className="absolute right-5 top-4 flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex min-h-96 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        ) : result?.issues.length ? (
          <div className="max-h-[75vh] overflow-y-auto p-5">
            <BlockedLookupCard result={result} />
          </div>
        ) : result ? (
          <>
            <div className="max-h-[72vh] overflow-y-auto p-5">
              <EstimationSummaryCard
                data={{ kind: "estimate", result }}
                downloadFilename={`evol-estimate-${result.product.productCode}-${new Date()
                  .toISOString()
                  .slice(0, 10)}.png`}
                className="border-0 bg-transparent p-0 shadow-none"
                title="Summary"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 border-t border-border bg-background px-5 py-4 sm:grid-cols-2">
              <Button
                type="button"
                className="h-12 rounded-xl"
                onClick={loadIntoCalculator}
              >
                <ArrowUpRight className="h-4 w-4" />
                Load into Calculator
              </Button>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function SearchPanel({
  settings,
  onLoadProduct,
}: {
  settings: CalculatorSettings;
  onLoadProduct: (result: ProductEstimateResult) => void;
}) {
  const [searchInput, setSearchInput] = useState("");
  const [searchedCode, setSearchedCode] = useState("");
  const [searchResults, setSearchResults] = useState<InventoryProduct[]>([]);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blockedResult, setBlockedResult] =
    useState<ProductEstimateResult | null>(null);
  const [notFoundCode, setNotFoundCode] = useState("");
  const [recentRefreshKey, setRecentRefreshKey] = useState(0);
  const [selectedRecent, setSelectedRecent] =
    useState<RecentProductEstimate | null>(null);
  const searchRequestRef = useRef(0);
  const skipNextDebouncedSearchRef = useRef(false);
  const searchInventoryProductsRef = useRef<
    (rawCode: string, autoLoadExact?: boolean) => Promise<void>
  >(async () => {});

  function loadInventoryProduct(product: InventoryProduct) {
    const normalized = normalizeInventoryProductEstimate(product, settings);

    if (normalized.issues.length > 0) {
      setBlockedResult(normalized);
      return;
    }

    createRecentProductEstimate({
      productCode: normalized.product.productCode,
      imageUrl: normalized.product.imageUrl ?? undefined,
    })
      .then(() => {
        setRecentRefreshKey((current) => current + 1);
      })
      .catch(() => {
        // Recording recents should not block a successful calculator load.
      });

    onLoadProduct(normalized);
  }

  async function searchInventoryProducts(
    rawCode: string,
    autoLoadExact = false,
  ) {
    const code = normalizeDecodedId(rawCode);
    if (!code) return;

    const requestId = searchRequestRef.current + 1;
    searchRequestRef.current = requestId;
    setSearchedCode(code);
    setError(null);
    setNotFoundCode("");
    setBlockedResult(null);
    setSearchResults([]);
    setIsLoading(true);

    try {
      const products = await fetchInventoryProducts({ code, limit: 5 });
      if (requestId !== searchRequestRef.current) return;

      if (products.data.length === 0) {
        setNotFoundCode(code);
        return;
      }

      const exactMatch = products.data.find(
        (product) => product.productCode.toUpperCase() === code.toUpperCase(),
      );

      if (autoLoadExact && (products.data.length === 1 || exactMatch)) {
        loadInventoryProduct(exactMatch ?? products.data[0]);
        return;
      }

      setSearchResults(products.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      if (requestId === searchRequestRef.current) setIsLoading(false);
    }
  }

  searchInventoryProductsRef.current = searchInventoryProducts;

  useEffect(() => {
    if (skipNextDebouncedSearchRef.current) {
      skipNextDebouncedSearchRef.current = false;
      return;
    }

    const code = searchInput.trim();
    if (!code) {
      searchRequestRef.current += 1;
      setSearchedCode("");
      setSearchResults([]);
      setNotFoundCode("");
      setError(null);
      setBlockedResult(null);
      setIsLoading(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      searchInventoryProductsRef.current(code);
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  return (
    <div className="space-y-4 py-4">
      <div className="grid gap-4 sm:grid-cols-[minmax(180px,2fr)_1fr]">
        <div className="relative min-w-0">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={searchInput}
            onChange={(event) =>
              setSearchInput(event.target.value.toUpperCase())
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") searchInventoryProducts(searchInput);
            }}
            placeholder="Search product code"
            className="h-9 w-full min-w-0 rounded-lg border border-border bg-background px-3 pl-10 text-sm uppercase outline-none transition-shadow focus:ring-2 focus:ring-ring/20"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsScannerOpen(true)}
          className="h-9 rounded-lg"
        >
          <ScanLine className="h-4 w-4" />
          Scan Barcode
        </Button>
      </div>

      <BarcodeScanDialog
        open={isScannerOpen}
        onOpenChange={setIsScannerOpen}
        onDecoded={(code) => {
          const normalizedCode = normalizeDecodedId(code);
          if (!normalizedCode) return;
          skipNextDebouncedSearchRef.current = true;
          setSearchInput(normalizedCode);
          searchInventoryProducts(normalizedCode, true);
        }}
      />

      {isLoading ? (
        <div className="rounded-md border border-border bg-muted/25 px-3 py-2 text-sm text-muted-foreground">
          Searching inventory...
        </div>
      ) : null}

      {error ? (
        <div className="rounded-md border border-destructive/35 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {notFoundCode ? (
        <div className="rounded-md border border-border bg-muted/25 px-3 py-2 text-sm text-muted-foreground">
          No product found for code{" "}
          <span className="font-semibold text-foreground">{notFoundCode}</span>.
        </div>
      ) : null}

      {blockedResult ? <BlockedLookupCard result={blockedResult} /> : null}

      {!blockedResult && searchResults.length > 0 ? (
        <div className="max-h-80 overflow-y-auto rounded-lg border border-border bg-background">
          {searchResults.map((product) => {
            const imageUrl =
              product.media.find((item) => item.isPrimary)?.storageKey ??
              product.media[0]?.storageKey;

            return (
              <button
                key={product.id}
                type="button"
                onClick={() => loadInventoryProduct(product)}
                className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={product.productCode}
                      width={40}
                      height={40}
                      className="h-full w-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {product.name || product.productCode}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {product.productCode} - {product.color} {product.purity}K
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {product.location.name}
                </span>
              </button>
            );
          })}
        </div>
      ) : searchedCode && !isLoading && !error && !notFoundCode ? (
        <div className="rounded-md border border-border bg-muted/25 px-3 py-2 text-sm text-muted-foreground">
          Select a product from the suggestions to load the calculator.
        </div>
      ) : null}

      <RecentEstimatesList
        refreshKey={recentRefreshKey}
        onOpen={setSelectedRecent}
      />

      <RecentEstimateSummaryDialog
        open={selectedRecent !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedRecent(null);
        }}
        estimate={selectedRecent}
        settings={settings}
        onLoadProduct={onLoadProduct}
      />
    </div>
  );
}

function CalculatorForm({
  settings,
  form,
  updateForm,
  updateStone,
  addStone,
  removeStone,
  resetForm,
  fileInputRef,
  onImageChange,
  onOpenSettings,
}: {
  settings: CalculatorSettings;
  form: CalculatorFormState;
  updateForm: <K extends keyof CalculatorFormState>(
    key: K,
    value: CalculatorFormState[K],
  ) => void;
  updateStone: (stoneId: string, patch: Partial<CalculatorStoneInput>) => void;
  addStone: () => void;
  removeStone: (stoneId: string) => void;
  resetForm: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onImageChange: (file: File | null) => void;
  onOpenSettings: () => void;
}) {
  return (
    <div className="min-w-0 space-y-4 rounded-lg border border-border bg-background p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Inputs</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Metal, stones and product details
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1 sm:gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={onOpenSettings}
          >
            <Settings2 className="h-4 w-4" />
            Settings
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={resetForm}
          >
            <RefreshCcw className="h-4 w-4" />
            Reset
          </Button>
        </div>
      </div>

      <Separator />

      <section className="space-y-3.5">
        <SectionLabel title="Metal Details" />
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Net Weight
          </p>
          <NumericLineInput
            value={form.netGoldWeight}
            onChange={(netGoldWeight) =>
              updateForm("netGoldWeight", netGoldWeight)
            }
            placeholder="0.000"
            suffix="g"
          />
        </div>

        <div className="space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Purity
          </p>
          <PurityCards
            settings={settings}
            value={form.purity}
            onChange={(purity) => updateForm("purity", purity)}
          />
        </div>
      </section>

      <Separator />

      <section className="space-y-3.5">
        <SectionLabel
          title="Stone Details"
          action={
            <Button
              type="button"
              variant="ghost"
              size="xs"
              className="gap-1"
              onClick={addStone}
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </Button>
          }
        />
        <div className="space-y-3.5">
          {form.stones.map((stone, index) => (
            <StoneRow
              key={stone.id}
              settings={settings}
              stone={stone}
              index={index}
              canRemove={form.stones.length > 1}
              onChange={(patch) => updateStone(stone.id, patch)}
              onRemove={() => removeStone(stone.id)}
            />
          ))}
        </div>
      </section>

      <Separator />

      <section className="space-y-3.5">
        <SectionLabel title="Product Details (Optional)" />
        <ProductImageInput
          imageUrl={form.productImageUrl}
          fileInputRef={fileInputRef}
          onImageChange={onImageChange}
        />
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Product Name
          </p>
          <input
            value={form.productName}
            onChange={(event) => updateForm("productName", event.target.value)}
            placeholder="Please enter a product name"
            className="w-full border-b border-border bg-transparent pb-2 text-sm outline-none placeholder:text-muted-foreground/40 focus:border-foreground"
          />
        </div>
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Note
          </p>
          <textarea
            value={form.productNote}
            onChange={(event) => updateForm("productNote", event.target.value)}
            placeholder="Any notes for the customer (optional)"
            rows={2}
            className="w-full resize-none border-b border-border bg-transparent pb-2 text-sm leading-6 outline-none placeholder:text-muted-foreground/40 focus:border-foreground"
          />
        </div>
      </section>
    </div>
  );
}

export function CalculatorPageClient({
  initialTab = "search",
}: {
  initialTab?: CalculatorTab;
}) {
  const { settings, lastSynced, isSyncingStones, syncError, syncStones } =
    useCalculatorSettings();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const summaryCardRef = useRef<HTMLDivElement | null>(null);
  const shouldScrollToSummaryRef = useRef(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTabState] = useState<CalculatorTab>(initialTab);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [form, setForm] = useState<CalculatorFormState>({
    netGoldWeight: 0,
    purity: "22K",
    stones: [createStone(settings)],
    productName: "",
    productNote: "",
  });

  const breakdown = useMemo(() => {
    return computeEstimateFromInputs(
      settings,
      form.netGoldWeight,
      form.purity,
      form.stones,
    );
  }, [settings, form.netGoldWeight, form.purity, form.stones]);

  useEffect(() => {
    setForm((current) => {
      if (current.stones.some((stone) => stone.stoneTypeId)) return current;
      return {
        ...current,
        stones: current.stones.map((stone) => ({
          ...stone,
          stoneTypeId: settings.stoneTypes[0]?.stoneId ?? "",
        })),
      };
    });
  }, [settings.stoneTypes]);

  useEffect(() => {
    return () => {
      if (form.productImageUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(form.productImageUrl);
      }
    };
  }, [form.productImageUrl]);

  const setActiveTab = useCallback(
    (tab: CalculatorTab) => {
      setActiveTabState((current) => {
        if (current === tab) return current;
        writeCalculatorTabCookie(tab);
        const next = new URLSearchParams(searchParams?.toString() ?? "");
        next.set("tab", tab);
        const query = next.toString();
        router.replace(query ? `${pathname}?${query}` : pathname, {
          scroll: false,
        });
        return tab;
      });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    if (activeTab !== "calculate" || !shouldScrollToSummaryRef.current) {
      return;
    }

    shouldScrollToSummaryRef.current = false;

    if (window.matchMedia("(min-width: 640px)").matches) {
      return;
    }

    window.requestAnimationFrame(() => {
      summaryCardRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, [activeTab]);

  function updateForm<K extends keyof CalculatorFormState>(
    key: K,
    value: CalculatorFormState[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateStone(stoneId: string, patch: Partial<CalculatorStoneInput>) {
    setForm((current) => ({
      ...current,
      stones: current.stones.map((stone) =>
        stone.id === stoneId ? { ...stone, ...patch } : stone,
      ),
    }));
  }

  function addStone() {
    setForm((current) => ({
      ...current,
      stones: [...current.stones, createStone(settings)],
    }));
  }

  function removeStone(stoneId: string) {
    setForm((current) => ({
      ...current,
      stones:
        current.stones.length === 1
          ? current.stones
          : current.stones.filter((stone) => stone.id !== stoneId),
    }));
  }

  function resetForm() {
    if (form.productImageUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(form.productImageUrl);
    }

    setForm({
      netGoldWeight: 0,
      purity: "22K",
      stones: [createStone(settings)],
      productName: "",
      productNote: "",
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleImageChange(file: File | null) {
    if (!file || !file.type.startsWith("image/")) return;

    if (form.productImageUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(form.productImageUrl);
    }

    updateForm("productImageUrl", URL.createObjectURL(file));
  }

  function loadInventoryProduct(result: ProductEstimateResult) {
    if (form.productImageUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(form.productImageUrl);
    }

    setForm({
      netGoldWeight: result.product.netGoldWeight,
      purity: normalizeMetalPurity(result.product.purity),
      stones:
        result.stones.length > 0
          ? result.stones.map((stone) => ({
              ...stone,
              id: stone.id || generateId(),
            }))
          : [createStone(settings)],
      productName: result.product.productName,
      productNote: result.product.description || "",
      productImageUrl: result.product.imageUrl || undefined,
    });
    shouldScrollToSummaryRef.current = true;
    setActiveTab("calculate");
  }

  return (
    <RequireInternalAuth>
      <div className="mx-auto w-full">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-2xl">
              Calculator
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter metal and stone details to build a customer-ready price
              estimate.
            </p>
          </div>
          <TabsSwitcher activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {activeTab === "search" ? (
          <div className="">
            <SearchPanel
              settings={settings}
              onLoadProduct={loadInventoryProduct}
            />
          </div>
        ) : (
          <div className="grid items-start gap-5 lg:grid-cols-[minmax(380px,520px)_minmax(420px,1fr)] xl:grid-cols-[minmax(420px,560px)_minmax(460px,1fr)]">
            <CalculatorForm
              settings={settings}
              form={form}
              updateForm={updateForm}
              updateStone={updateStone}
              addStone={addStone}
              removeStone={removeStone}
              resetForm={resetForm}
              fileInputRef={fileInputRef}
              onImageChange={handleImageChange}
              onOpenSettings={() => setSettingsOpen(true)}
            />
            <div ref={summaryCardRef} className="min-w-0">
              <EstimationSummaryCard
                data={{
                  kind: "calculator",
                  form,
                  breakdown,
                  gstRate: settings.gstRate,
                }}
                className="lg:sticky lg:top-6 lg:self-start"
              />
            </div>
          </div>
        )}
      </div>

      {/* Settings Drawer */}
      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetContent
          side="right"
          className="h-dvh w-full overflow-y-auto p-0 sm:h-full sm:max-w-xl"
        >
          <SheetHeader className="sticky top-0 z-10 border-b border-border bg-background px-4 py-4 sm:px-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-foreground">
                  <Settings2 className="h-3 w-3 text-background" />
                </div>
                <SheetTitle className="text-base font-semibold text-foreground">
                  Settings
                </SheetTitle>
              </div>
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                aria-label="Close settings"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <SheetDescription className="mt-1 max-w-sm text-left text-xs text-muted-foreground">
              Adjust gold rates, making charges, tax, and stone pricing
            </SheetDescription>
          </SheetHeader>

          <div className="px-4 py-4 sm:px-5">
            <SettingsView
              settings={settings}
              lastSynced={lastSynced}
              onSyncStones={syncStones}
              isSyncingStones={isSyncingStones}
              syncError={syncError}
            />
          </div>
        </SheetContent>
      </Sheet>
    </RequireInternalAuth>
  );
}
