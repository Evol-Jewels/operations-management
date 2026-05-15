"use client";

import {
  Calculator,
  Diamond,
  ImageIcon,
  Loader2,
  MapPin,
  Plus,
  RefreshCcw,
  ScanLine,
  Search,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { RequireInternalAuth } from "@/components/auth/RequireInternalAuth";
import { BarcodeScanDialog } from "@/components/calculator/BarcodeScanDialog";
import { EstimationSummaryCard } from "@/components/calculator/EstimationSummaryCard";
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
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_CALCULATOR_SETTINGS } from "@/lib/calculator/constants";
import {
  calculateGoldRate,
  computeEstimateFromInputs,
  resolveAutoSlab,
} from "@/lib/calculator/pricing";
import { normalizeDecodedId } from "@/lib/barcodeScanner";
import {
  searchCatalogueProductByCode,
  fetchCatalogueProductDetails,
} from "@/lib/catalogApi";
import { normalizeCatalogueProduct } from "@/lib/catalogMapping";
import { cn, formatCurrency } from "@/lib/utils";
import type {
  CalculatorFormState,
  CalculatorStoneInput,
  CatalogueEstimateResult,
  MetalPurity,
} from "@/types";

type CalculatorTab = "search" | "calculate";

const PURITY_OPTIONS: MetalPurity[] = ["24K", "22K", "18K", "14K"];

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

function createStone(): CalculatorStoneInput {
  return {
    id: generateId(),
    stoneTypeId: DEFAULT_CALCULATOR_SETTINGS.stoneTypes[0]?.stoneId ?? "",
    weight: 0,
    quantity: 1,
  };
}

function SearchSection({
  onLoadProduct,
}: {
  onLoadProduct: (result: CatalogueEstimateResult) => void;
}) {
  const [searchInput, setSearchInput] = useState("");
  const [submittedCode, setSubmittedCode] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResult, setSearchResult] =
    useState<CatalogueEstimateResult | null>(null);

  const submitLookupCode = async (rawCode: string) => {
    const code = normalizeDecodedId(rawCode);
    if (!code) return false;

    setSearchInput(code);
    setError(null);
    setSearchResult(null);
    setIsLoading(true);
    setHasSearched(true);

    try {
      const searchItem = await searchCatalogueProductByCode(code);
      if (!searchItem) {
        setError(`No product found for code "${code}"`);
        setSubmittedCode(code);
        return true;
      }

      const details = await fetchCatalogueProductDetails(searchItem.slug);
      const normalized = normalizeCatalogueProduct(
        details,
        DEFAULT_CALCULATOR_SETTINGS,
      );

      setSubmittedCode(code);
      setSearchResult(normalized);
      onLoadProduct(normalized);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Search failed";
      setError(message);
      setSubmittedCode(code);
      return true;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchInput.trim()) {
      void submitLookupCode(searchInput.trim());
    }
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden py-0">
        <CardHeader className="border-b border-border/70 px-5 py-5">
          <CardTitle className="text-xl">Product Lookup</CardTitle>
          <CardDescription className="mt-1">
            Search by product code or scan barcode to fetch product details and
            compute estimate.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 px-5 py-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsScannerOpen(true)}
              className="h-12 gap-2"
            >
              <ScanLine className="h-4 w-4" />
              Scan Barcode
            </Button>
            <div className="flex flex-1 gap-2">
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch();
                }}
                placeholder="Enter product code"
                className="h-12 flex-1 uppercase"
              />
              <Button
                type="button"
                onClick={handleSearch}
                disabled={!searchInput.trim() || isLoading}
                className="h-12 px-5"
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

          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {hasSearched && !isLoading && !searchResult && !error && (
            <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              No product found for code{" "}
              <span className="font-semibold text-foreground">
                {submittedCode}
              </span>
              .
            </div>
          )}

          {searchResult && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-border overflow-hidden bg-card">
                <div className="flex items-center gap-4 p-4">
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-muted shrink-0">
                    {searchResult.product.imageUrl ? (
                      <img
                        src={searchResult.product.imageUrl}
                        alt={searchResult.product.productName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-5 h-5 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate">
                      {searchResult.product.productName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {searchResult.product.purity}K
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>{searchResult.product.productCode}</span>
                      <span>•</span>
                      <span>{searchResult.product.categoryLabel}</span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {searchResult.product.location}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="px-4 pb-4 space-y-2 text-sm">
                  {searchResult.product.sourcePrice != null && (
                    <div className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2">
                      <span className="text-muted-foreground">
                        Catalogue Price
                      </span>
                      <span className="font-semibold tabular">
                        {new Intl.NumberFormat("en-IN", {
                          style: "currency",
                          currency: searchResult.product.sourceCurrency,
                          maximumFractionDigits: 0,
                        }).format(searchResult.product.sourcePrice)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gross Weight</span>
                    <span className="font-medium tabular">
                      {searchResult.product.grossWeight.toFixed(2)} g
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gold</span>
                    <span className="font-medium tabular">
                      {formatCurrency(searchResult.pricing.goldCost)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Making</span>
                    <span className="font-medium tabular">
                      {formatCurrency(searchResult.pricing.makingCost)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Stones</span>
                    <span className="font-medium tabular">
                      {formatCurrency(searchResult.pricing.totalStoneCost)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      GST (
                      {(DEFAULT_CALCULATOR_SETTINGS.gstRate * 100).toFixed(1)}%)
                    </span>
                    <span className="font-medium tabular">
                      {formatCurrency(searchResult.pricing.gst)}
                    </span>
                  </div>
                </div>

                <div className="bg-foreground text-background px-4 py-3 flex items-center justify-between">
                  <span className="text-sm font-medium">Local Estimate</span>
                  <span className="text-xl font-bold tabular">
                    {formatCurrency(searchResult.pricing.total)}
                  </span>
                </div>
              </div>

              {searchResult.product.stones.length > 0 && (
                <div className="rounded-2xl border border-border p-4 space-y-3">
                  <p className="text-sm font-semibold">Stone Mapping</p>
                  <div className="space-y-2">
                    {searchResult.product.stones.map((stone) => (
                      <div
                        key={stone.id}
                        className="flex items-start justify-between gap-3 rounded-xl bg-muted/35 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{stone.code}</p>
                          <p className="text-xs text-muted-foreground">
                            {stone.weight.toFixed(3)} ct • {stone.quantity} pcs
                            {stone.stoneName !== "Unknown"
                              ? ` • ${stone.stoneName}`
                              : ""}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-muted-foreground">
                            Source
                          </p>
                          <p className="text-sm font-medium tabular">
                            {formatCurrency(stone.sourceAmount)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {searchResult.issues.length > 0 && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-3">
                  <p className="text-sm font-semibold text-destructive">
                    Estimate blocked
                  </p>
                  <div className="mt-1 space-y-1">
                    {searchResult.issues.map((issue) => (
                      <p
                        key={`${issue.code}:${issue.reason}`}
                        className="text-xs text-destructive"
                      >
                        {issue.code}: {issue.reason}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function CalculatorPageClient() {
  const settings = DEFAULT_CALCULATOR_SETTINGS;
  const summaryRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [activeTab, setActiveTab] = useState<CalculatorTab>("calculate");
  const [form, setForm] = useState<CalculatorFormState>({
    netGoldWeight: 0,
    purity: "22K",
    stones: [createStone()],
    productName: "",
    productNote: "",
  });
  const [loadedProduct, setLoadedProduct] =
    useState<CatalogueEstimateResult | null>(null);

  const handleLoadProduct = (result: CatalogueEstimateResult) => {
    setLoadedProduct(result);
    const purityMap: Record<string, MetalPurity> = {
      "24": "24K",
      "22": "22K",
      "18": "18K",
      "14": "14K",
    };
    setForm({
      netGoldWeight: result.product.netGoldWeight,
      purity: purityMap[result.product.purity] || "22K",
      stones: result.stones.map((s, i) => ({
        ...s,
        id: s.id || `stone-${i}`,
      })),
      productName: result.product.productName,
      productNote: result.product.description || "",
      productImageUrl: result.product.imageUrl || undefined,
    });
    setActiveTab("calculate");
  };

  useEffect(() => {
    return () => {
      if (form.productImageUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(form.productImageUrl);
      }
    };
  }, [form.productImageUrl]);

  const purityCards = useMemo(() => {
    return PURITY_OPTIONS.map((purity) => ({
      purity,
      rate: calculateGoldRate(
        settings.goldRate24k,
        purity,
        settings.purityPercentages,
      ),
    }));
  }, [settings]);

  const breakdown = useMemo(() => {
    return computeEstimateFromInputs(
      settings,
      form.netGoldWeight,
      form.purity,
      form.stones,
    );
  }, [form.netGoldWeight, form.purity, form.stones, settings]);

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
      stones: [...current.stones, createStone()],
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
      stones: [createStone()],
      productName: "",
      productNote: "",
    });

    setLoadedProduct(null);

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

  function scrollToSummary() {
    summaryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <RequireInternalAuth>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              Calculator
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Estimate jewellery pricing with a reusable manual workflow
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              This first build adds the `/calculator` route, a structured manual
              estimate form, and a live summary card that search and scanner
              results can plug into next.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm">
            <button
              type="button"
              onClick={() => setActiveTab("search")}
              className={cn(
                "flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-medium transition-colors",
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
              onClick={() => setActiveTab("calculate")}
              className={cn(
                "flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-medium transition-colors",
                activeTab === "calculate"
                  ? "bg-black text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Calculator className="h-4 w-4" />
              Calculate
            </button>
          </div>
        </div>

        {activeTab === "search" ? (
          <SearchSection onLoadProduct={handleLoadProduct} />
        ) : (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_400px]">
            <div className="space-y-6">
              <Card className="overflow-hidden py-0">
                <CardHeader className="border-b border-border/70 px-5 py-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-xl">
                        Manual Calculation
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Fill in metal details, add stone specifications, and
                        review the final estimate live.
                      </CardDescription>
                    </div>
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
                </CardHeader>

                <CardContent className="space-y-8 px-5 py-6">
                  <section className="space-y-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted">
                        <Sparkles className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                          Gold
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Net weight and purity decide the base metal cost.
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                      <div className="space-y-2">
                        <Label htmlFor="net-weight">Gold Net Weight</Label>
                        <div className="relative">
                          <Input
                            id="net-weight"
                            type="number"
                            min="0"
                            step="0.001"
                            value={form.netGoldWeight || ""}
                            onChange={(event) =>
                              updateForm(
                                "netGoldWeight",
                                Number(event.target.value) || 0,
                              )
                            }
                            placeholder="Enter net gold weight"
                            className="h-14 rounded-2xl border-border/80 bg-muted/15 pr-12 text-xl font-medium"
                          />
                          <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm text-muted-foreground">
                            g
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {purityCards.map((card) => (
                          <button
                            key={card.purity}
                            type="button"
                            onClick={() => updateForm("purity", card.purity)}
                            className={cn(
                              "rounded-2xl border p-4 text-left transition-all",
                              form.purity === card.purity
                                ? "border-black bg-black text-white shadow-lg shadow-black/10"
                                : "border-border bg-card hover:border-foreground/30",
                            )}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <span className="text-lg font-semibold">
                                {card.purity}
                              </span>
                              {form.purity === card.purity ? (
                                <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/80">
                                  Active
                                </span>
                              ) : null}
                            </div>
                            <p
                              className={cn(
                                "mt-2 text-sm",
                                form.purity === card.purity
                                  ? "text-white/70"
                                  : "text-muted-foreground",
                              )}
                            >
                              {formatCurrency(card.rate)}/g
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </section>

                  <Separator />

                  <section className="space-y-5">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted">
                          <Diamond className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                            Stones
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Each stone line resolves against a slab-based rate
                            card.
                          </p>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addStone}
                      >
                        <Plus className="h-4 w-4" />
                        Add Stone
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {form.stones.map((stone, index) => {
                        const stoneType = settings.stoneTypes.find(
                          (item) => item.stoneId === stone.stoneTypeId,
                        );
                        const resolvedSlab = resolveAutoSlab(
                          stoneType?.slabs ?? [],
                          stone.weight,
                          stone.quantity,
                        );

                        return (
                          <div
                            key={stone.id}
                            className="rounded-3xl border border-border/80 bg-muted/15 p-4"
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                                  Stone {index + 1}
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                  {resolvedSlab
                                    ? `${formatCurrency(resolvedSlab.pricePerCarat)}/ct • slab ${resolvedSlab.code}`
                                    : "Pick a type and weight to resolve pricing"}
                                </p>
                              </div>

                              {form.stones.length > 1 ? (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => removeStone(stone.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              ) : null}
                            </div>

                            <div className="mt-4 grid gap-4 md:grid-cols-3">
                              <div className="space-y-2">
                                <Label>Type</Label>
                                <Select
                                  value={stone.stoneTypeId}
                                  onValueChange={(value) =>
                                    updateStone(stone.id, {
                                      stoneTypeId: value,
                                    })
                                  }
                                >
                                  <SelectTrigger className="h-11 w-full rounded-xl bg-background">
                                    <SelectValue placeholder="Select type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {settings.stoneTypes.map((item) => (
                                      <SelectItem
                                        key={item.stoneId}
                                        value={item.stoneId}
                                      >
                                        {item.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label>Stone Net Weight</Label>
                                <div className="relative">
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.001"
                                    value={stone.weight || ""}
                                    onChange={(event) =>
                                      updateStone(stone.id, {
                                        weight: Number(event.target.value) || 0,
                                      })
                                    }
                                    placeholder="0.000"
                                    className="h-11 rounded-xl bg-background pr-10"
                                  />
                                  <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground">
                                    ct
                                  </span>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label>Total Pieces</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  step="1"
                                  value={stone.quantity || ""}
                                  onChange={(event) =>
                                    updateStone(stone.id, {
                                      quantity: Math.max(
                                        1,
                                        Number(event.target.value) || 1,
                                      ),
                                    })
                                  }
                                  placeholder="1"
                                  className="h-11 rounded-xl bg-background"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  <Separator />

                  <section className="space-y-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                          Product
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Optional image and product note for a richer estimate
                          summary.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex min-h-36 w-full flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border bg-muted/15 px-6 text-center transition-colors hover:bg-muted/25"
                      >
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                          <Upload className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {form.productImageUrl
                              ? "Replace product image"
                              : "Drag, paste, or click to upload"}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Add a product visual for the estimate card.
                          </p>
                        </div>
                      </button>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) =>
                          handleImageChange(event.target.files?.[0] ?? null)
                        }
                      />

                      <div className="grid gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="product-name">Product Name</Label>
                          <Input
                            id="product-name"
                            value={form.productName}
                            onChange={(event) =>
                              updateForm("productName", event.target.value)
                            }
                            placeholder="Emerald Halo Ring"
                            className="h-11 rounded-xl bg-background"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="product-note">Note</Label>
                          <Textarea
                            id="product-note"
                            value={form.productNote}
                            onChange={(event) =>
                              updateForm("productNote", event.target.value)
                            }
                            placeholder="Customer estimate prepared from the latest synced rates."
                            rows={4}
                            className="rounded-2xl bg-background text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </section>

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-4">
                    <p className="text-sm text-muted-foreground">
                      The estimate updates live as you edit gold, purity, and
                      stones.
                    </p>
                    <Button
                      type="button"
                      onClick={scrollToSummary}
                      className="gap-2"
                    >
                      <Calculator className="h-4 w-4" />
                      Review Summary
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div ref={summaryRef} className="xl:sticky xl:top-20 xl:self-start">
              <EstimationSummaryCard form={form} breakdown={breakdown} />
            </div>
          </div>
        )}
      </div>
    </RequireInternalAuth>
  );
}
