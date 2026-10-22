"use client";

import {
  AlertCircle,
  ArrowLeft,
  Grid2x2,
  PackageSearch,
  RefreshCw,
  ScanLine,
  Search,
  SlidersHorizontal,
  Square,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { BarcodeScanDialog } from "@/components/calculator/BarcodeScanDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCalculatorSettings } from "@/hooks/useCalculatorSettings";
import { useMyInternalProfile } from "@/hooks/useInternalProfile";
import {
  useInfiniteInventoryProducts,
  useInventoryProductByCode,
  useSyncInventoryProducts,
} from "@/hooks/useInventoryProducts";
import { useLocations } from "@/hooks/useManageProducts";
import { useVendorAccess, useVendors } from "@/hooks/useVendors";
import { captureProductEvent } from "@/lib/analytics";
import { normalizeDecodedId } from "@/lib/barcodeScanner";
import { cn, formatCurrency } from "@/lib/utils";
import { getVendorFilterLabel, type Vendor } from "@/lib/vendors";
import type { InventoryProductListQuery } from "@/types/inventory-api";
import {
  type ActiveFilterChip,
  ActiveFilterChips,
  InventoryFiltersPanel,
} from "./InventoryFilters";
import {
  CATEGORY_LABELS,
  COLOR_LABELS,
  EMPTY_FILTERS,
  FILTER_KEYS,
  FILTER_PARAM_KEYS,
  getErrorMessage,
  type InventoryFilterKey,
  type InventoryFilters,
  isFilterActive,
  PURITY_LABELS,
  readFiltersFromParams,
  SEARCH_PARAM_KEY,
} from "./inventory-utils";
import {
  PRODUCT_GRID_CLASS,
  PRODUCT_RAIL_CLASS,
  ProductCard,
  ProductGridSkeleton,
} from "./ProductCard";
import {
  ProductDetail,
  ProductDetailSkeleton,
  ProductEstimationSection,
  ProductShareButton,
  ProductSpecification,
} from "./ProductDetail";

const SEARCH_DEBOUNCE_MS = 300;
const NO_VENDORS: Vendor[] = [];
const TRACKED_FILTER_KEYS = new Set<InventoryFilterKey>([
  "category",
  "color",
  "purity",
  "source",
  "location",
  "vendor",
]);

function formatProductCount(count: number | undefined) {
  return typeof count === "number" ? count.toLocaleString("en-IN") : null;
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

  const [searchInput, setSearchInput] = useState(
    () => searchParams.get(SEARCH_PARAM_KEY) ?? "",
  );
  const [filters, setFilters] = useState<InventoryFilters>(() =>
    readFiltersFromParams(searchParams),
  );
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [showTwoPerRow, setShowTwoPerRow] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const estimationSectionRef = useRef<HTMLElement | null>(null);
  const { settings } = useCalculatorSettings();
  const profileQuery = useMyInternalProfile();
  const syncInventoryMutation = useSyncInventoryProducts();

  const canViewVendor = useVendorAccess();
  const vendorsQuery = useVendors();
  const vendors = vendorsQuery.data ?? NO_VENDORS;

  const debouncedSearch = useDebouncedValue(
    searchInput.trim(),
    SEARCH_DEBOUNCE_MS,
  );

  const listQuery = useInfiniteInventoryProducts(
    useMemo<InventoryProductListQuery>(
      () => ({
        q: debouncedSearch || undefined,
        category: filters.category === "ALL" ? undefined : filters.category,
        color: filters.color === "ALL" ? undefined : filters.color,
        purity: filters.purity === "ALL" ? undefined : Number(filters.purity),
        locationId: filters.location === "ALL" ? undefined : filters.location,
        vendorId:
          canViewVendor && filters.vendor !== "ALL"
            ? filters.vendor
            : undefined,
        isCustomerProduct:
          filters.source === "ALL" ? undefined : filters.source === "CUSTOMER",
        netWeightFrom: filters.netWeightFrom
          ? Number(filters.netWeightFrom)
          : undefined,
        netWeightTo: filters.netWeightTo
          ? Number(filters.netWeightTo)
          : undefined,
        priceFrom: filters.priceFrom ? Number(filters.priceFrom) : undefined,
        priceTo: filters.priceTo ? Number(filters.priceTo) : undefined,
        sourceCreatedFrom: filters.sourceCreatedFrom || undefined,
        sourceCreatedTo: filters.sourceCreatedTo || undefined,
      }),
      [canViewVendor, debouncedSearch, filters],
    ),
  );

  const detailQuery = useInventoryProductByCode(selectedProductCode);
  const locationsQuery = useLocations({ limit: 100 });
  const locations = locationsQuery.data?.data;

  const products = listQuery.data?.pages.flatMap((page) => page.data) ?? [];
  const formattedTotalProducts = formatProductCount(
    listQuery.data?.pages[0]?.total,
  );
  const hasSelectedProduct = Boolean(selectedProductCode);
  const selectedProduct = detailQuery.data ?? null;
  const internalRole = profileQuery.data?.profile?.role;
  const canSyncProducts =
    internalRole === "ADMIN" || internalRole === "OPERATIONS";
  const canScanInventory = canSyncProducts;

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

  useEffect(() => {
    setSearchInput(searchParams.get(SEARCH_PARAM_KEY) ?? "");
    setFilters(readFiltersFromParams(searchParams));
  }, [searchParams]);

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

  const activeFilterChips = useMemo<ActiveFilterChip[]>(() => {
    const locationName =
      locations?.find((location) => location.id === filters.location)?.name ??
      "Selected location";
    const labels: Record<InventoryFilterKey, () => string> = {
      category: () =>
        `Category: ${filters.category === "ALL" ? "" : CATEGORY_LABELS[filters.category]}`,
      color: () =>
        `Color: ${filters.color === "ALL" ? "" : COLOR_LABELS[filters.color]}`,
      purity: () =>
        `Purity: ${filters.purity === "ALL" ? "" : PURITY_LABELS[filters.purity]}`,
      source: () =>
        filters.source === "CUSTOMER" ? "Customer product" : "Stock product",
      location: () => `Location: ${locationName}`,
      vendor: () => `Vendor: ${getVendorFilterLabel(filters.vendor, vendors)}`,
      netWeightFrom: () => `Net wt from: ${filters.netWeightFrom}g`,
      netWeightTo: () => `Net wt to: ${filters.netWeightTo}g`,
      priceFrom: () =>
        `Price from: ${formatCurrency(Number(filters.priceFrom))}`,
      priceTo: () => `Price to: ${formatCurrency(Number(filters.priceTo))}`,
      sourceCreatedFrom: () => `Created from: ${filters.sourceCreatedFrom}`,
      sourceCreatedTo: () => `Created to: ${filters.sourceCreatedTo}`,
    };

    return FILTER_KEYS.filter(
      (key) =>
        (key !== "vendor" || canViewVendor) && isFilterActive(filters[key]),
    ).map((key) => ({ key, label: labels[key]() }));
  }, [canViewVendor, filters, locations, vendors]);
  const activeFilterCount = activeFilterChips.length;

  function setFilter(key: InventoryFilterKey, value: string) {
    setFilters((current) => ({ ...current, [key]: value }));
    updateSearchParams((params) => {
      if (isFilterActive(value)) params.set(FILTER_PARAM_KEYS[key], value);
      else params.delete(FILTER_PARAM_KEYS[key]);
    });
    if (TRACKED_FILTER_KEYS.has(key)) {
      captureProductEvent("inventory_filter_changed", {
        filter_key: FILTER_PARAM_KEYS[key],
        filter_state: isFilterActive(value) ? "applied" : "cleared",
      });
    }
  }

  const productGridClass = cn(
    hasSelectedProduct ? PRODUCT_RAIL_CLASS : PRODUCT_GRID_CLASS,
    !showTwoPerRow && "max-sm:grid-cols-1 max-sm:gap-3",
  );

  function resetFilters() {
    captureProductEvent("inventory_filters_cleared", {
      active_filter_count: activeFilterCount,
    });
    setFilters(EMPTY_FILTERS);
    updateSearchParams((params) => {
      for (const key of FILTER_KEYS) params.delete(FILTER_PARAM_KEYS[key]);
    });
  }

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

  function handleDecodedBarcode(rawCode: string) {
    const code = normalizeDecodedId(rawCode);
    if (!code) return;

    captureProductEvent("inventory_barcode_scanned", {
      product_code: code,
    });
    setSearchInput(code);
    setIsScannerOpen(false);
    updateSearchParams((params) => {
      params.set(SEARCH_PARAM_KEY, code);
      params.set("productCode", code);
    }, "push");
  }

  async function handleSyncProducts() {
    captureProductEvent("inventory_sync_started");
    try {
      await syncInventoryMutation.mutateAsync();
      captureProductEvent("inventory_sync_completed");
      toast.success("Product sync completed");
    } catch (error) {
      captureProductEvent("inventory_sync_failed");
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-3 sm:gap-4 lg:h-[calc(100svh-3rem)] lg:min-h-0 lg:gap-6">
      <div
        className={cn(
          "flex shrink-0 items-start justify-between gap-3",
          hasSelectedProduct && "hidden lg:flex",
        )}
      >
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Product Inventory
          </h1>
          <p className="mt-1 hidden max-w-2xl text-sm text-muted-foreground sm:block">
            Search products, narrow by inventory attributes, and open any item
            for a full detail view.
          </p>
          {formattedTotalProducts ? (
            <p className="mt-0.5 text-sm text-muted-foreground lg:hidden">
              {formattedTotalProducts} products
            </p>
          ) : null}
        </div>
        {canSyncProducts ? (
          <Button
            type="button"
            variant="outline"
            onClick={handleSyncProducts}
            disabled={syncInventoryMutation.isPending}
            className="h-10 shrink-0 gap-2 sm:h-9"
          >
            <RefreshCw
              className={cn(
                "h-4 w-4",
                syncInventoryMutation.isPending && "animate-spin",
              )}
            />
            {syncInventoryMutation.isPending ? (
              "Syncing..."
            ) : (
              <>
                <span className="sm:hidden">Sync</span>
                <span className="hidden sm:inline">Sync from Catalog</span>
              </>
            )}
          </Button>
        ) : null}
      </div>

      <section
        className={cn(
          "sticky top-[var(--mobile-top-h,0px)] z-20 -mx-4 shrink-0 bg-background/95 px-4 py-2 backdrop-blur-md sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:grid lg:grid-cols-[minmax(0,40%)_minmax(0,60%)] lg:items-center lg:gap-3 lg:bg-transparent lg:p-0 lg:backdrop-blur-none",
          hasSelectedProduct && "hidden lg:grid",
        )}
      >
        <h2 className="hidden min-w-0 text-lg font-semibold tracking-tight text-foreground lg:block">
          All Products
          {formattedTotalProducts ? ` (${formattedTotalProducts})` : null}
        </h2>
        <div className="flex min-w-0 items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={searchInput}
              onChange={(event) => {
                const { value } = event.target;
                setSearchInput(value);
                updateSearchParams((params) => {
                  if (value.trim()) params.set(SEARCH_PARAM_KEY, value.trim());
                  else params.delete(SEARCH_PARAM_KEY);
                });
              }}
              onBlur={() => {
                const query = searchInput.trim();
                if (!query) return;
                captureProductEvent("inventory_search_used", {
                  query_length: query.length,
                });
              }}
              placeholder={
                canViewVendor
                  ? "Search code, vendor, location, category"
                  : "Search code, location, category"
              }
              aria-label="Search products"
              className="h-10 pl-9"
            />
          </div>
          {canScanInventory ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsScannerOpen(true)}
              aria-label="Scan barcode"
              className="size-10 shrink-0 gap-2 sm:w-auto sm:px-3"
            >
              <ScanLine className="h-4 w-4" />
              <span className="hidden sm:inline">Scan</span>
            </Button>
          ) : null}
          <Button
            type="button"
            variant={activeFilterCount > 0 ? "default" : "outline"}
            onClick={() => {
              setIsFiltersOpen(true);
              captureProductEvent("inventory_filters_opened", {
                active_filter_count: activeFilterCount,
              });
            }}
            aria-label="Filters"
            className="h-10 shrink-0 gap-2 px-3"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 ? (
              <Badge variant="secondary" className="px-1.5">
                {activeFilterCount}
              </Badge>
            ) : null}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowTwoPerRow((value) => !value)}
            aria-label={
              showTwoPerRow ? "Show one product per row" : "Show two per row"
            }
            className="size-10 shrink-0 sm:hidden"
          >
            {showTwoPerRow ? (
              <Square className="h-4 w-4" />
            ) : (
              <Grid2x2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </section>

      <ActiveFilterChips
        chips={activeFilterChips}
        onRemove={(key) => setFilter(key, EMPTY_FILTERS[key])}
        className={cn(
          "scrollbar-none -mx-4 -mt-1 flex shrink-0 items-center gap-2 overflow-x-auto px-4 sm:mx-0 sm:mt-0 sm:flex-wrap sm:px-0",
          hasSelectedProduct && "hidden lg:flex",
        )}
      />

      <InventoryFiltersPanel
        open={isFiltersOpen}
        onOpenChange={setIsFiltersOpen}
        filters={filters}
        activeCount={activeFilterCount}
        onFilterChange={setFilter}
        onReset={resetFilters}
        locations={locations ?? []}
        canViewVendor={canViewVendor}
        vendors={vendors}
        vendorsLoading={vendorsQuery.isLoading}
      />

      <div
        className={cn(
          "grid min-w-0 gap-6 lg:min-h-0 lg:flex-1 lg:gap-3 lg:overflow-hidden",
          hasSelectedProduct && "lg:grid-cols-[minmax(0,1fr)_17rem]",
        )}
      >
        <section
          className={cn(
            "min-w-0 pb-10 lg:min-h-0 lg:overflow-y-auto lg:pb-0",
            hasSelectedProduct ? "order-2 lg:pl-1" : "lg:pr-3",
          )}
        >
          {hasSelectedProduct ? (
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">
                More products
              </h2>
              {formattedTotalProducts ? (
                <span className="text-xs text-muted-foreground">
                  {formattedTotalProducts} items
                </span>
              ) : null}
            </div>
          ) : null}
          {listQuery.isLoading ? (
            <ProductGridSkeleton className={productGridClass} />
          ) : listQuery.isError ? (
            <ErrorPanel
              title="Unable to load products"
              message={getErrorMessage(listQuery.error)}
            />
          ) : products.length > 0 ? (
            <div className={productGridClass}>
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  selected={product.productCode === selectedProductCode}
                  rowOnLg={hasSelectedProduct}
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
          <div className="order-1 min-w-0 space-y-3 lg:min-h-0 lg:overflow-y-auto lg:pr-3">
            <div className="flex items-center justify-between gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={closeProductDetails}
                className="-ml-2 h-10 gap-2 px-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to inventory
              </Button>
              {selectedProduct ? (
                <ProductShareButton product={selectedProduct} />
              ) : null}
            </div>
            {detailQuery.isLoading && !selectedProduct ? (
              <ProductDetailSkeleton />
            ) : detailQuery.isError ? (
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
