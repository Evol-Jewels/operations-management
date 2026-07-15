"use client";

import {
  ArrowUpRight,
  Check,
  ChevronDown,
  CircleDollarSign,
  Diamond,
  ImageIcon,
  Loader2,
  MapPin,
  Minus,
  Plus,
  RefreshCcw,
  ScanLine,
  Search,
  Trash2,
  X,
} from "lucide-react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { RequireInternalAuth } from "@/components/auth/RequireInternalAuth";
import { StoneTypeCombobox as SharedStoneTypeCombobox } from "@/components/stone-type-combobox";
import { BarcodeScanDialog } from "@/components/calculator/BarcodeScanDialog";
import {
  EstimationSummaryCard,
  EstimationSummaryDownloadButton,
  EstimationSummaryShareButton,
} from "@/components/calculator/EstimationSummaryCard";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCalculatorSettings } from "@/hooks/useCalculatorSettings";
import { normalizeDecodedId } from "@/lib/barcodeScanner";
import { getSessionRole } from "@/lib/auth";
import { authClient } from "@/lib/auth-client";
import {
  calculateGoldRate,
  calculateMakingCharge,
  computeEstimateFromInputs,
  getStoneType,
  resolveAutoSlab,
} from "@/lib/calculator/pricing";
import {
  type CalculatorTab,
  isCalculatorTab,
  writeCalculatorTabCookie,
} from "@/lib/calculatorTab";
import { captureProductEvent } from "@/lib/analytics";
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
const segmentTriggerClassName =
  "h-9 rounded-lg text-foreground hover:text-foreground data-[state=active]:bg-zinc-950 data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-zinc-950";
const MANUAL_CALCULATOR_STORAGE_KEY = "evol-manual-calculator-form-v1";

interface PersistedManualCalculatorForm {
  form: CalculatorFormState;
  isGstEdited: boolean;
  isMakingChargeEdited: boolean;
}

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

function normalizeMetalPurity(value: string): MetalPurity {
  return ["14K", "18K", "22K", "24K", "Other"].includes(value)
    ? (value as MetalPurity)
    : "Other";
}

function createStone(settings: CalculatorSettings): CalculatorStoneInput {
  const defaultStoneType =
    settings.stoneTypes.find(
      (stone) => stone.name.trim().toLowerCase() === "round",
    ) ?? settings.stoneTypes[0];

  return {
    id: generateId(),
    stoneTypeId: defaultStoneType?.stoneId ?? "",
    weight: 0,
    quantity: 0,
  };
}

function createDefaultCalculatorForm(
  settings: CalculatorSettings,
): CalculatorFormState {
  return {
    netGoldWeight: 0,
    purity: "18K",
    stones: [createStone(settings)],
    gstRate: settings.gstRate,
    makingCharge: calculateMakingCharge(
      0,
      settings.makingChargeFlat,
      settings.makingChargePerGram,
    ),
    productName: "",
    productNote: "",
  };
}

function toPersistedNumber(value: unknown, fallback = 0) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function restoreManualCalculatorForm(
  settings: CalculatorSettings,
): PersistedManualCalculatorForm | null {
  try {
    const storedValue = localStorage.getItem(MANUAL_CALCULATOR_STORAGE_KEY);
    if (!storedValue) return null;

    const parsed = JSON.parse(storedValue) as Partial<{
      form: Partial<CalculatorFormState>;
      isGstEdited: boolean;
      isMakingChargeEdited: boolean;
    }>;
    const storedForm = parsed.form;
    if (!storedForm) return null;

    const defaultForm = createDefaultCalculatorForm(settings);
    const stones =
      Array.isArray(storedForm.stones) && storedForm.stones.length > 0
        ? storedForm.stones.map((stone) => ({
            id: typeof stone.id === "string" ? stone.id : generateId(),
            stoneTypeId:
              typeof stone.stoneTypeId === "string"
                ? stone.stoneTypeId
                : settings.stoneTypes[0]?.stoneId ?? "",
            weight: toPersistedNumber(stone.weight),
            quantity: toPersistedNumber(stone.quantity),
            fixedRatePerCarat:
              stone.fixedRatePerCarat === undefined
                ? undefined
                : toPersistedNumber(stone.fixedRatePerCarat),
            sourceStoneName:
              typeof stone.sourceStoneName === "string"
                ? stone.sourceStoneName
                : undefined,
          }))
        : defaultForm.stones;

    return {
      form: {
        ...defaultForm,
        netGoldWeight: toPersistedNumber(storedForm.netGoldWeight),
        purity: normalizeMetalPurity(String(storedForm.purity ?? "18K")),
        stones,
        gstRate: toPersistedNumber(storedForm.gstRate, settings.gstRate),
        makingCharge: toPersistedNumber(storedForm.makingCharge),
        productName:
          typeof storedForm.productName === "string"
            ? storedForm.productName
            : "",
        productNote:
          typeof storedForm.productNote === "string"
            ? storedForm.productNote
            : "",
        productImageUrl:
          typeof storedForm.productImageUrl === "string" &&
          !storedForm.productImageUrl.startsWith("blob:")
            ? storedForm.productImageUrl
            : undefined,
      },
      isGstEdited: Boolean(parsed.isGstEdited),
      isMakingChargeEdited: Boolean(parsed.isMakingChargeEdited),
    };
  } catch {
    return null;
  }
}

function persistManualCalculatorForm(
  form: CalculatorFormState,
  isGstEdited: boolean,
  isMakingChargeEdited: boolean,
) {
  try {
    const formToPersist: CalculatorFormState = {
      ...form,
      productImageUrl: form.productImageUrl?.startsWith("blob:")
        ? undefined
        : form.productImageUrl,
    };

    localStorage.setItem(
      MANUAL_CALCULATOR_STORAGE_KEY,
      JSON.stringify({
        form: formToPersist,
        isGstEdited,
        isMakingChargeEdited,
      }),
    );
  } catch {
    // Persistence is best effort; the calculator should continue to work.
  }
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
  const [inputValue, setInputValue] = useState(value ? String(value) : "");

  useEffect(() => {
    const parsedInput = inputValue === "" ? 0 : Number(inputValue);

    if (parsedInput !== value) {
      setInputValue(value ? String(value) : "");
    }
  }, [inputValue, value]);

  function handleChange(nextValue: string) {
    if (!/^\d*(?:\.\d*)?$/.test(nextValue)) return;

    setInputValue(nextValue);
    const numericValue = nextValue === "" ? 0 : Number(nextValue);

    if (Number.isFinite(numericValue)) {
      onChange(numericValue);
    }
  }

  return (
    <div className="flex h-9 items-end gap-2 border-b border-border pb-1.5 focus-within:border-foreground">
      <input
        type="text"
        inputMode="decimal"
        value={inputValue}
        onChange={(event) => handleChange(event.target.value)}
        placeholder={placeholder}
        aria-valuemin={min}
        data-step={step}
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

function StoneTypeCombobox({
  stoneTypes,
  value,
  onChange,
}: {
  stoneTypes: CalculatorSettings["stoneTypes"];
  value: string;
  onChange: (stoneTypeId: string) => void;
}) {
  return (
    <SharedStoneTypeCombobox
      options={stoneTypes.map((item) => ({
        value: item.stoneId,
        label: item.name,
        category: item.category,
        metadata: `${item.category} · ${item.slabs.length} slabs`,
        searchText: [item.clarity, item.color, ...item.slabs.map((slab) => slab.code)].filter(Boolean).join(" "),
      }))}
      value={value}
      onValueChange={onChange}
      showMetadata
      className="border-0 border-b bg-transparent px-0 shadow-none hover:bg-transparent"
    />
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
      <TabsList className="grid h-11 w-full grid-cols-2 rounded-xl p-1">
        <TabsTrigger value="search" className={segmentTriggerClassName}>
          <Search className="h-4 w-4" />
          Search
        </TabsTrigger>
        <TabsTrigger value="calculate" className={segmentTriggerClassName}>
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
                "mt-0.5 text-[10px] leading-none",
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
  const hasFixedRate = stone.fixedRatePerCarat !== undefined;
  const hasUnmatchedWeight = stone.weight > 0 && !resolvedSlab && !hasFixedRate;
  const ratePerCarat =
    stone.fixedRatePerCarat ?? resolvedSlab?.pricePerCarat ?? 0;
  const stoneTotal = ratePerCarat * stone.weight;
  const priceValue = hasFixedRate
    ? stone.fixedRatePerCarat || ""
    : resolvedSlab?.pricePerCarat || "";

  function updatePricePerCarat(value: string) {
    onChange({
      fixedRatePerCarat: value.trim()
        ? Math.max(0, Number(value) || 0)
        : undefined,
    });
  }

  function updatePieces(quantity: number) {
    onChange({ quantity: Math.max(0, quantity) });
  }

  function updatePiecesInput(value: string) {
    const digits = value.replace(/\D/g, "");
    updatePieces(digits ? Number(digits) : 0);
  }

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
          ) : hasFixedRate ? (
            <span className="text-[11px] text-muted-foreground">
              Manual rate
            </span>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <span className="text-sm font-semibold tabular">
            {formatCurrency(stoneTotal)}
          </span>
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
      </div>

      <div className="grid grid-cols-1 gap-4 min-[430px]:grid-cols-2 min-[430px]:gap-5">
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Stone Type
          </p>
          <StoneTypeCombobox
            stoneTypes={settings.stoneTypes}
            value={stone.stoneTypeId}
            onChange={(stoneTypeId) =>
              onChange({
                stoneTypeId,
                fixedRatePerCarat: undefined,
                sourceStoneName: undefined,
              })
            }
          />
        </div>
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
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 min-[430px]:grid-cols-2 min-[430px]:gap-5">
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Pieces
          </p>
          <div className="grid h-9 grid-cols-[32px_minmax(0,1fr)_32px] items-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-md"
              onClick={() => updatePieces(Math.max(0, stone.quantity - 1))}
              aria-label={`Decrease pieces for stone ${index + 1}`}
            >
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <input
              type="text"
              inputMode="numeric"
              value={stone.quantity || ""}
              onChange={(event) => updatePiecesInput(event.target.value)}
              placeholder="pieces"
              className="h-8 min-w-0 border-b border-border bg-transparent px-0 text-center text-sm outline-none placeholder:text-muted-foreground/35 focus:border-foreground"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-md"
              onClick={() => updatePieces(stone.quantity + 1)}
              aria-label={`Increase pieces for stone ${index + 1}`}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Price / Carat
          </p>
          <div className="flex h-9 items-end gap-2 border-b border-border pb-1.5 focus-within:border-foreground">
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step={1}
              value={priceValue}
              onChange={(event) => updatePricePerCarat(event.target.value)}
              onFocus={(event) => event.target.select()}
              placeholder={
                hasUnmatchedWeight
                  ? "Enter price per carat"
                  : "Auto match after weight + pieces"
              }
              className="min-w-0 flex-1 bg-transparent px-0 text-sm outline-none placeholder:text-muted-foreground/35"
            />
            <span className="shrink-0 pb-0.5 text-sm text-muted-foreground">
              /ct
            </span>
          </div>
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

function RequirementItem({
  complete,
  children,
}: {
  complete: boolean;
  children: React.ReactNode;
}) {
  return (
    <li
      className={cn(
        "flex items-center gap-2 whitespace-nowrap text-sm",
        complete ? "text-foreground" : "text-muted-foreground",
      )}
    >
      {complete ? (
        <Check className="h-4 w-4 shrink-0" />
      ) : (
        <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-current" />
      )}
      <span>{children}</span>
    </li>
  );
}

function EstimateRequirementsCard({
  requirements,
  className,
}: {
  requirements: { label: string; complete: boolean }[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center text-start justify-center gap-2 flex-col py-2 h-full w-full",
        className,
      )}
    >
      {/*<ul className="flex flex-col items-center justify-center gap-3">*/}
        {requirements.map((requirement) => (
          <RequirementItem
            key={requirement.label}
            complete={requirement.complete}
          >
            {requirement.label}
          </RequirementItem>
        ))}
      {/*</ul>*/}
    </div>
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
          {result.issues?.map((issue) => (
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
      <div className="flex items-center justify-between gap-4">
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
    if (!result) return;
    onLoadProduct(result);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[92vh] gap-0 overflow-hidden rounded-xl p-0 sm:max-w-2xl"
        showCloseButton={false}
      >
        <div className="relative border-b border-border px-5 py-4 pr-14">
          <DialogTitle className="text-lg font-semibold tracking-tight">
            Summary
          </DialogTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Review the estimate before downloading or loading it into the
            calculator.
          </p>
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
        ) : result ? (
          <>
            <div className="max-h-[76vh] overflow-y-auto p-3 sm:p-4">
              <EstimationSummaryCard
                data={{ kind: "estimate", result }}
                downloadFilename={`evol-estimate-${result.product.productCode}-${new Date()
                  .toISOString()
                  .slice(0, 10)}.png`}
                compact
                className="border-0 bg-transparent p-0 shadow-none"
                showHeader={false}
                showDownloadButton={false}
                title="Summary"
                renderActions={({
                  downloadSummaryPdf,
                  downloadSummaryPng,
                  shareSummaryPng,
                  isDownloading,
                  isSharing,
                }) => (
                  <div className="flex flex-wrap items-center justify-end gap-2.5">
                    <EstimationSummaryShareButton
                      shareSummaryPng={shareSummaryPng}
                      isSharing={isSharing}
                      isDownloading={isDownloading}
                      className="h-11 justify-center rounded-lg"
                    />
                    <EstimationSummaryDownloadButton
                      downloadSummaryPdf={downloadSummaryPdf}
                      downloadSummaryPng={downloadSummaryPng}
                      isDownloading={isDownloading}
                      className="h-11 justify-center rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 rounded-lg"
                      onClick={loadIntoCalculator}
                    >
                      <ArrowUpRight className="h-4 w-4" />
                      Load into Calculator
                    </Button>
                  </div>
                )}
              />
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
  canUseRecentEstimates,
}: {
  settings: CalculatorSettings;
  onLoadProduct: (result: ProductEstimateResult) => void;
  canUseRecentEstimates: boolean;
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

  async function loadInventoryProduct(product: InventoryProduct) {
    captureProductEvent("calculator_inventory_product_load_started", {
      product_code: product.productCode,
      category: product.category,
      product_source: product.isCustomerProduct ? "customer" : "stock",
    });
    setIsLoading(true);
    setError(null);
    setBlockedResult(null);

    try {
      const detailProduct =
        product.estimation !== undefined
          ? product
          : await fetchInventoryProductByCode(product.productCode);
      if (!detailProduct) {
        setError(`Product details unavailable for ${product.productCode}.`);
        return;
      }

      const normalized = normalizeInventoryProductEstimate(
        detailProduct,
        settings,
      );

      if (canUseRecentEstimates) {
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
      }

      onLoadProduct(normalized);
      captureProductEvent("calculator_inventory_product_loaded", {
        product_code: normalized.product.productCode,
        category: normalized.product.categoryLabel,
        location: normalized.product.location,
      });
    } catch (err) {
      captureProductEvent("calculator_inventory_product_load_failed", {
        product_code: product.productCode,
      });
      setError(err instanceof Error ? err.message : "Failed to load product");
    } finally {
      setIsLoading(false);
    }
  }

  async function searchInventoryProducts(
    rawCode: string,
    autoLoadExact = false,
  ) {
    const code = normalizeDecodedId(rawCode);
    if (!code) return;

    captureProductEvent("calculator_inventory_search_started", {
      product_code: code,
      auto_load_exact: autoLoadExact,
    });
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
        captureProductEvent("calculator_inventory_search_completed", {
          product_code: code,
          result_count: 0,
          exact_match: false,
        });
        setNotFoundCode(code);
        return;
      }

      const exactMatch = products.data.find(
        (product) => product.productCode.toUpperCase() === code.toUpperCase(),
      );

      if (autoLoadExact && (products.data.length === 1 || exactMatch)) {
        captureProductEvent("calculator_inventory_search_completed", {
          product_code: code,
          result_count: products.data.length,
          exact_match: Boolean(exactMatch),
          auto_loaded: true,
        });
        loadInventoryProduct(exactMatch ?? products.data[0]);
        return;
      }

      captureProductEvent("calculator_inventory_search_completed", {
        product_code: code,
        result_count: products.data.length,
        exact_match: Boolean(exactMatch),
        auto_loaded: false,
      });
      setSearchResults(products.data);
    } catch (err) {
      captureProductEvent("calculator_inventory_search_failed", {
        product_code: code,
      });
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
          captureProductEvent("calculator_barcode_scanned", {
            product_code: normalizedCode,
          });
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
        onOpen={(estimate) => {
          setSelectedRecent(estimate);
          captureProductEvent("calculator_recent_estimate_opened", {
            product_code: estimate.productCode,
          });
        }}
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
  updateNetGoldWeight,
  updateStone,
  addStone,
  removeStone,
  resetForm,
  fileInputRef,
  onImageChange,
  onAdvancedGstChange,
  onAdvancedMakingChange,
}: {
  settings: CalculatorSettings;
  form: CalculatorFormState;
  updateForm: <K extends keyof CalculatorFormState>(
    key: K,
    value: CalculatorFormState[K],
  ) => void;
  updateNetGoldWeight: (value: number) => void;
  updateStone: (stoneId: string, patch: Partial<CalculatorStoneInput>) => void;
  addStone: () => void;
  removeStone: (stoneId: string) => void;
  resetForm: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onImageChange: (file: File | null) => void;
  onAdvancedGstChange: (gstRate: number) => void;
  onAdvancedMakingChange: (makingCharge: number) => void;
}) {
  const [advancedOpen, setAdvancedOpen] = useState(false);

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
            onChange={updateNetGoldWeight}
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
      </section>

      <Separator />

      <section>
        <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg text-left text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <span>Advanced</span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 transition-transform",
                  advancedOpen && "rotate-180",
                )}
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 min-[430px]:grid-cols-2 min-[430px]:gap-5">
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    GST
                  </p>
                  <NumericLineInput
                    value={Number((form.gstRate * 100).toFixed(2))}
                    onChange={(gstPercentage) =>
                      onAdvancedGstChange(Math.max(0, gstPercentage) / 100)
                    }
                    placeholder="0"
                    suffix="%"
                    step={0.1}
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Making Charges
                  </p>
                  <NumericLineInput
                    value={form.makingCharge}
                    onChange={(makingCharge) =>
                      onAdvancedMakingChange(Math.max(0, makingCharge))
                    }
                    placeholder="0"
                    suffix="Rs."
                    step={1}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Note
                </p>
                <textarea
                  value={form.productNote}
                  onChange={(event) =>
                    updateForm("productNote", event.target.value)
                  }
                  placeholder="Any notes for the customer (optional)"
                  rows={2}
                  className="w-full resize-none border-b border-border bg-transparent pb-2 text-sm leading-6 outline-none placeholder:text-muted-foreground/40 focus:border-foreground"
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </section>
    </div>
  );
}

export function CalculatorPageClient({
  initialTab = "search",
}: {
  initialTab?: CalculatorTab;
}) {
  const {
    settings,
  } = useCalculatorSettings();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const summaryCardRef = useRef<HTMLDivElement | null>(null);
  const shouldScrollToSummaryRef = useRef(false);
  const loadedProductCodeRef = useRef<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session } = authClient.useSession();
  const canUseRecentEstimates = getSessionRole(session) === "SALES";
  const [activeTab, setActiveTab] = useState<CalculatorTab>(() => {
    const queryTab = searchParams.get("tab");
    return isCalculatorTab(queryTab) ? queryTab : initialTab;
  });
  const [isGstEdited, setIsGstEdited] = useState(false);
  const [isMakingChargeEdited, setIsMakingChargeEdited] = useState(false);
  const [hasRestoredPersistedForm, setHasRestoredPersistedForm] =
    useState(false);
  const [form, setForm] = useState<CalculatorFormState>(() =>
    createDefaultCalculatorForm(settings),
  );

  const breakdown = useMemo(() => {
    return computeEstimateFromInputs(
      settings,
      form.netGoldWeight,
      form.purity,
      form.stones,
      {
        gstRateOverride: form.gstRate,
        makingCostOverride: form.makingCharge,
      },
    );
  }, [
    settings,
    form.netGoldWeight,
    form.purity,
    form.stones,
    form.gstRate,
    form.makingCharge,
  ]);
  const estimateRequirements = useMemo(() => {
    const hasNetWeight = form.netGoldWeight > 0;
    const hasStoneRows = form.stones.length > 0;
    const hasStoneType = form.stones.every((stone) =>
      Boolean(getStoneType(settings, stone.stoneTypeId)),
    );
    const hasStoneWeight = form.stones.every((stone) => stone.weight > 0);
    const hasStoneQuantity = form.stones.every((stone) => stone.quantity > 0);
    const hasStoneRates = breakdown.stoneDetails.every(
      (stone) =>
        stone.weight > 0 &&
        (stone.fixedRatePerCarat !== undefined || stone.slabInfo !== null),
    );

    return [
      { label: "Select correct metal net weight and purity", complete: hasNetWeight },
      {
        label: "Select stone type and weight for each stone",
        complete: hasStoneRows && hasStoneType && hasStoneWeight,
      },
      {
        label: "Enter pieces and match slab for each stone",
        complete:
          hasStoneRows && hasStoneQuantity && hasStoneRates,
      },
    ];
  }, [settings, form.netGoldWeight, form.stones, breakdown.stoneDetails]);
  const canShowSummary = estimateRequirements.every(
    (requirement) => requirement.complete,
  );

  useEffect(() => {
    if (hasRestoredPersistedForm) return;
    const persistedForm = restoreManualCalculatorForm(settings);
    if (persistedForm) {
      setForm(persistedForm.form);
      setIsGstEdited(persistedForm.isGstEdited);
      setIsMakingChargeEdited(persistedForm.isMakingChargeEdited);
    }
    setHasRestoredPersistedForm(true);
  }, [hasRestoredPersistedForm, settings]);

  useEffect(() => {
    if (!hasRestoredPersistedForm) return;
    persistManualCalculatorForm(form, isGstEdited, isMakingChargeEdited);
  }, [form, hasRestoredPersistedForm, isGstEdited, isMakingChargeEdited]);

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
    if (!hasRestoredPersistedForm) return;
    setForm((current) => {
      const nextMakingCharge = isMakingChargeEdited
        ? current.makingCharge
        : calculateMakingCharge(
            current.netGoldWeight,
            settings.makingChargeFlat,
            settings.makingChargePerGram,
          );

      return {
        ...current,
        gstRate: isGstEdited ? current.gstRate : settings.gstRate,
        makingCharge: nextMakingCharge,
      };
    });
  }, [
    hasRestoredPersistedForm,
    settings.gstRate,
    settings.makingChargeFlat,
    settings.makingChargePerGram,
    isGstEdited,
    isMakingChargeEdited,
  ]);

  useEffect(() => {
    return () => {
      if (form.productImageUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(form.productImageUrl);
      }
    };
  }, [form.productImageUrl]);

  function handleActiveTabChange(tab: CalculatorTab) {
    if (activeTab === tab) return;

    setActiveTab(tab);

    const next = new URLSearchParams(searchParams.toString());
    next.set("tab", tab);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }

  useEffect(() => {
    writeCalculatorTabCookie(activeTab);
  }, [activeTab]);

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

  function updateNetGoldWeight(netGoldWeight: number) {
    setForm((current) => ({
      ...current,
      netGoldWeight,
      makingCharge: isMakingChargeEdited
        ? current.makingCharge
        : calculateMakingCharge(
            netGoldWeight,
            settings.makingChargeFlat,
            settings.makingChargePerGram,
          ),
    }));
  }

  function updateAdvancedGst(gstRate: number) {
    setIsGstEdited(true);
    updateForm("gstRate", gstRate);
  }

  function updateAdvancedMakingCharge(makingCharge: number) {
    setIsMakingChargeEdited(true);
    updateForm("makingCharge", makingCharge);
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
    captureProductEvent("calculator_stone_added", {
      stone_count_before: form.stones.length,
    });
    setForm((current) => ({
      ...current,
      stones: [...current.stones, createStone(settings)],
    }));
  }

  function removeStone(stoneId: string) {
    captureProductEvent("calculator_stone_removed", {
      stone_count_before: form.stones.length,
    });
    setForm((current) => ({
      ...current,
      stones:
        current.stones.length === 1
          ? current.stones
          : current.stones.filter((stone) => stone.id !== stoneId),
    }));
  }

  function resetForm() {
    captureProductEvent("calculator_form_reset", {
      stone_count: form.stones.length,
      has_product_name: Boolean(form.productName.trim()),
      has_image: Boolean(form.productImageUrl),
    });
    if (form.productImageUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(form.productImageUrl);
    }

    setForm(createDefaultCalculatorForm(settings));
    setIsGstEdited(false);
    setIsMakingChargeEdited(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleImageChange(file: File | null) {
    if (!file || !file.type.startsWith("image/")) return;

    captureProductEvent("calculator_product_image_added", {
      file_type: file.type,
      file_size_kb: Math.round(file.size / 1024),
    });
    if (form.productImageUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(form.productImageUrl);
    }

    updateForm("productImageUrl", URL.createObjectURL(file));
  }

  function loadInventoryProduct(result: ProductEstimateResult) {
    captureProductEvent("calculator_estimate_loaded", {
      product_code: result.product.productCode,
      category: result.product.categoryLabel,
      stone_count: result.stones.length,
    });
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
      gstRate: result.pricing.gstRate,
      makingCharge: result.pricing.makingCost,
      productName: result.product.productName,
      productNote: result.product.note || "",
      productImageUrl: result.product.imageUrl || undefined,
    });
    setIsGstEdited(true);
    setIsMakingChargeEdited(true);
    shouldScrollToSummaryRef.current = true;
    handleActiveTabChange("calculate");
  }

  useEffect(() => {
    if (!hasRestoredPersistedForm) return;

    const productCode = normalizeDecodedId(searchParams?.get("productCode"));
    if (!productCode || loadedProductCodeRef.current === productCode) return;

    loadedProductCodeRef.current = productCode;
    const codeToLoad = productCode;

    async function loadProductFromQuery() {
      try {
        const product = await fetchInventoryProductByCode(codeToLoad);
        if (!product) return;

        loadInventoryProduct(
          normalizeInventoryProductEstimate(product, settings),
        );
      } catch {
        loadedProductCodeRef.current = null;
      }
    }

    loadProductFromQuery();
  }, [hasRestoredPersistedForm, searchParams, settings]);

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
          <TabsSwitcher
            activeTab={activeTab}
            onTabChange={handleActiveTabChange}
          />
        </div>

        {activeTab === "search" ? (
          <div className="">
            <SearchPanel
              settings={settings}
              onLoadProduct={loadInventoryProduct}
              canUseRecentEstimates={canUseRecentEstimates}
            />
          </div>
        ) : (
          <div className="grid items-start gap-5 lg:grid-cols-[minmax(380px,520px)_minmax(420px,760px)] xl:grid-cols-[minmax(420px,560px)_minmax(460px,760px)]">
            <CalculatorForm
              settings={settings}
              form={form}
              updateForm={updateForm}
              updateNetGoldWeight={updateNetGoldWeight}
              updateStone={updateStone}
              addStone={addStone}
              removeStone={removeStone}
              resetForm={resetForm}
              fileInputRef={fileInputRef}
              onImageChange={handleImageChange}
              onAdvancedGstChange={updateAdvancedGst}
              onAdvancedMakingChange={updateAdvancedMakingCharge}
            />
            <div ref={summaryCardRef} className="min-w-0 h-full w-full max-w-[760px]">
              {canShowSummary ? (
                <EstimationSummaryCard
                  data={{
                    kind: "calculator",
                    form,
                    breakdown,
                    gstRate: form.gstRate,
                  }}
                  className="lg:sticky lg:top-6 lg:self-start"
                />
              ) : (
                <EstimateRequirementsCard
                  requirements={estimateRequirements}
                  className="lg:sticky lg:top-6 lg:self-start"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </RequireInternalAuth>
  );
}
