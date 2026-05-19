"use client";

import {
  Calculator,
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
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { RequireInternalAuth } from "@/components/auth/RequireInternalAuth";
import { BarcodeScanDialog } from "@/components/calculator/BarcodeScanDialog";
import { EstimationSummaryCard } from "@/components/calculator/EstimationSummaryCard";
import { SettingsView } from "@/components/calculator/SettingsView";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCalculatorSettings } from "@/hooks/useCalculatorSettings";
import { normalizeDecodedId } from "@/lib/barcodeScanner";
import {
  calculateGoldRate,
  computeEstimateFromInputs,
  getStoneType,
  resolveAutoSlab,
} from "@/lib/calculator/pricing";
import {
  fetchCatalogueProductDetails,
  searchCatalogueProductByCode,
} from "@/lib/catalogApi";
import { normalizeCatalogueProduct } from "@/lib/catalogMapping";
import { cn, formatCurrency } from "@/lib/utils";
import type {
  CalculatorFormState,
  CalculatorSettings,
  CalculatorStoneInput,
  CatalogueEstimateResult,
  MetalPurity,
} from "@/types";

type CalculatorTab = "search" | "calculate";

const PURITY_OPTIONS: MetalPurity[] = ["24K", "22K", "18K", "14K"];

function generateId() {
  return Math.random().toString(36).slice(2, 9);
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
    <div className="flex items-end gap-2 border-b border-border pb-2 focus-within:border-foreground">
      <input
        type="number"
        inputMode="decimal"
        min={min}
        step={step}
        value={value || ""}
        onChange={(event) => onChange(Number(event.target.value) || 0)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground/40"
      />
      {suffix ? (
        <span className="shrink-0 text-xs text-muted-foreground">{suffix}</span>
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
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
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
    <div className="grid h-11 grid-cols-2 rounded-xl bg-muted p-1">
      <button
        type="button"
        onClick={() => onTabChange("search")}
        className={cn(
          "flex items-center justify-center gap-2 rounded-lg text-sm transition-all",
          activeTab === "search"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Search className="h-4 w-4" />
        Search
      </button>
      <button
        type="button"
        onClick={() => onTabChange("calculate")}
        className={cn(
          "flex items-center justify-center gap-2 rounded-lg text-sm transition-all",
          activeTab === "calculate"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <CircleDollarSign className="h-4 w-4" />
        Calculate
      </button>
    </div>
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
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
      {purityCards.map((card) => {
        const selected = value === card.purity;

        return (
          <button
            key={card.purity}
            type="button"
            onClick={() => onChange(card.purity)}
            className={cn(
              "rounded-xl border px-3 py-3 text-center transition-colors",
              selected
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-background hover:border-foreground/30",
            )}
          >
            <span className="text-sm font-semibold">{card.purity}</span>
            <span
              className={cn(
                "mt-1 block text-[10px]",
                selected ? "text-background/70" : "text-muted-foreground",
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
    <div className="space-y-3 border-b border-border pb-5 last:border-b-0 last:pb-0">
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
        <SelectTrigger className="h-10 w-full rounded-none border-0 border-b bg-transparent px-0 shadow-none focus:ring-0">
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

      <div className="grid grid-cols-2 gap-6">
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
        className="flex h-14 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border text-sm text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
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

function BlockedLookupCard({ result }: { result: CatalogueEstimateResult }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
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
            className="flex items-start justify-between gap-4 rounded-xl bg-muted/30 px-3 py-3"
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

function SearchPanel({
  settings,
  onLoadProduct,
}: {
  settings: CalculatorSettings;
  onLoadProduct: (result: CatalogueEstimateResult) => void;
}) {
  const [searchInput, setSearchInput] = useState("");
  const [submittedCode, setSubmittedCode] = useState("");
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blockedResult, setBlockedResult] =
    useState<CatalogueEstimateResult | null>(null);
  const [notFoundCode, setNotFoundCode] = useState("");

  async function submitLookupCode(rawCode: string) {
    const code = normalizeDecodedId(rawCode);
    if (!code) return;

    setSearchInput(code);
    setSubmittedCode(code);
    setError(null);
    setNotFoundCode("");
    setBlockedResult(null);
    setIsLoading(true);

    try {
      const searchItem = await searchCatalogueProductByCode(code);
      if (!searchItem) {
        setNotFoundCode(code);
        return;
      }

      const details = await fetchCatalogueProductDetails(searchItem.slug);
      const normalized = normalizeCatalogueProduct(details, settings);

      if (normalized.issues.length > 0) {
        setBlockedResult(normalized);
        return;
      }

      onLoadProduct(normalized);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-4 pt-6">
      <div className="grid gap-4 md:grid-cols-[minmax(180px,1fr)_2fr]">
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsScannerOpen(true)}
          className="h-11 rounded-xl"
        >
          <ScanLine className="h-4 w-4" />
          Search Barcode
        </Button>
        <div className="flex min-w-0 gap-3">
          <input
            value={searchInput}
            onChange={(event) =>
              setSearchInput(event.target.value.toUpperCase())
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") void submitLookupCode(searchInput);
            }}
            placeholder="Enter barcode"
            className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-background px-4 text-sm uppercase outline-none transition-shadow focus:ring-2 focus:ring-ring/20"
          />
          <Button
            type="button"
            onClick={() => void submitLookupCode(searchInput)}
            disabled={!searchInput.trim() || isLoading}
            className="h-11 w-11 shrink-0 rounded-xl px-0"
            aria-label="Search"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <BarcodeScanDialog
        open={isScannerOpen}
        onOpenChange={setIsScannerOpen}
        onDecoded={(code) => {
          void submitLookupCode(code);
        }}
      />

      {error ? (
        <div className="rounded-xl border border-destructive/35 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {notFoundCode ? (
        <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          No product found for code{" "}
          <span className="font-semibold text-foreground">{notFoundCode}</span>.
        </div>
      ) : null}

      {blockedResult ? <BlockedLookupCard result={blockedResult} /> : null}

      {!blockedResult &&
      !error &&
      !notFoundCode &&
      submittedCode &&
      !isLoading ? (
        <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          Search completed. Valid products open in the calculate tab.
        </div>
      ) : null}
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
    <div className="bg-card border border-border rounded-xl shadow-md p-4 min-w-0 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-base font-semibold">Calculator</h1>
        <div className="flex items-center gap-2">
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

      <section className="space-y-4">
        <SectionLabel title="Metal Details" />
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
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
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
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

      <section className="space-y-4">
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
        <div className="space-y-5">
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

      <section className="space-y-4">
        <SectionLabel title="Product Details (Optional)" />
        <ProductImageInput
          imageUrl={form.productImageUrl}
          fileInputRef={fileInputRef}
          onImageChange={onImageChange}
        />
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Product Name
          </p>
          <input
            value={form.productName}
            onChange={(event) => updateForm("productName", event.target.value)}
            placeholder="Emerald Halo Ring"
            className="w-full border-b border-border bg-transparent pb-2 text-sm outline-none placeholder:text-muted-foreground/40 focus:border-foreground"
          />
        </div>
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Note
          </p>
          <textarea
            value={form.productNote}
            onChange={(event) => updateForm("productNote", event.target.value)}
            placeholder="Customer estimate prepared from the latest synced rates."
            rows={3}
            className="w-full resize-none border-b border-border bg-transparent pb-2 text-sm leading-6 outline-none placeholder:text-muted-foreground/40 focus:border-foreground"
          />
        </div>
      </section>
    </div>
  );
}

export function CalculatorPageClient() {
  const {
    settings,
    lastSynced,
    isSyncing,
    syncError,
    setSettings,
    syncFromSheet,
  } = useCalculatorSettings();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [activeTab, setActiveTab] = useState<CalculatorTab>("calculate");
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

  function loadCatalogueProduct(result: CatalogueEstimateResult) {
    const purityMap: Record<string, MetalPurity> = {
      "24": "24K",
      "22": "22K",
      "18": "18K",
      "14": "14K",
    };

    if (form.productImageUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(form.productImageUrl);
    }

    setForm({
      netGoldWeight: result.product.netGoldWeight,
      purity: purityMap[result.product.purity] || "22K",
      stones:
        result.stones.length > 0
          ? result.stones.map((stone) => ({
              ...stone,
              id: stone.id || generateId(),
            }))
          : [createStone(settings)],
      productName: result.product.productName,
      productNote:
        result.product.description ||
        "Customer estimate prepared from the latest synced rates.",
      productImageUrl: result.product.imageUrl || undefined,
    });
    setActiveTab("calculate");
  }

  return (
    <RequireInternalAuth>
      <div className="mx-auto w-full">
        <div className="rounded-3xl p-4">
          <TabsSwitcher activeTab={activeTab} onTabChange={setActiveTab} />

          {activeTab === "search" ? (
            <SearchPanel
              settings={settings}
              onLoadProduct={loadCatalogueProduct}
            />
          ) : (
            <div className="grid gap-4 pt-7 lg:grid-cols-[380px_minmax(0,1fr)] xl:grid-cols-[380px_475px] xl:justify-center">
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
              <EstimationSummaryCard
                form={form}
                breakdown={breakdown}
                gstRate={settings.gstRate}
                className="lg:sticky lg:top-8 lg:self-start"
              />
            </div>
          )}
        </div>
      </div>

      {/* Settings Drawer */}
      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-xl overflow-y-auto p-0"
        >
          <SheetHeader className="px-5 pt-5 pb-4 border-b border-border sticky top-0 bg-background z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 bg-foreground rounded-md flex items-center justify-center shrink-0">
                  <Settings2 className="w-3 h-3 text-background" />
                </div>
                <SheetTitle className="text-base font-semibold text-foreground">
                  Settings
                </SheetTitle>
              </div>
              <button
                onClick={() => setSettingsOpen(false)}
                aria-label="Close settings"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <SheetDescription className="text-xs text-muted-foreground mt-1">
              Adjust gold rates, making charges, tax, and stone pricing
            </SheetDescription>
          </SheetHeader>

          <div className="px-5 py-5">
            <SettingsView
              settings={settings}
              onChange={setSettings}
              lastSynced={lastSynced}
              onSync={syncFromSheet}
              isSyncing={isSyncing}
              syncError={syncError}
            />
          </div>
        </SheetContent>
      </Sheet>
    </RequireInternalAuth>
  );
}
