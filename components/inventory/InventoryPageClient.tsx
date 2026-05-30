"use client";

import {
  AlertCircle,
  Diamond,
  MapPin,
  PackageSearch,
  Search,
} from "lucide-react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useInventoryProduct,
  useInventoryProducts,
} from "@/hooks/useInventoryProducts";
import { cn, formatCurrency } from "@/lib/utils";
import type { InventoryProduct } from "@/types/inventory-api";

type SourceFilter = "ALL" | "CUSTOMER" | "STOCK";

function formatWeight(value: string | number, unit: string) {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return `- ${unit}`;
  return `${numeric.toFixed(2)} ${unit}`;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong";
}

function getPrimaryImage(product: InventoryProduct) {
  return product.media.find((item) => item.isPrimary) ?? product.media[0];
}

function getStoneWeight(product: InventoryProduct) {
  return Number(product.totalStoneWeight) || 0;
}

function getStockLabel(product: InventoryProduct) {
  const pieces = (product.stones ?? []).reduce(
    (sum, stone) => sum + stone.totalPieces,
    0,
  );
  return `${pieces.toLocaleString("en-IN")} pcs`;
}

function productSearchText(product: InventoryProduct) {
  return [
    product.productCode,
    product.name,
    product.category,
    product.vendor,
    product.color,
    product.location.name,
    product.location.city,
  ]
    .join(" ")
    .toLowerCase();
}

function InventoryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background px-4 py-3.5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
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
        "flex w-full items-start gap-3 rounded-2xl border bg-card p-3 text-left shadow-sm transition-colors hover:border-foreground/25 hover:bg-muted/20",
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
          {product.vendor}
        </p>
        <p className="mt-2 text-sm text-foreground">
          {getStockLabel(product)} · {formatWeight(product.netWeight, "g")}
        </p>
      </div>
    </button>
  );
}

function ProductDetail({ product }: { product: InventoryProduct }) {
  const image = getPrimaryImage(product);

  return (
    <section className="overflow-hidden rounded-[28px] border border-border bg-card shadow-sm">
      <div className="grid min-h-[26rem] lg:grid-cols-[minmax(320px,0.95fr)_1fr]">
        <div className="relative min-h-72 bg-muted/40">
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

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <InventoryStat label="Metal" value={`Gold ${product.purity}K`} />
            <InventoryStat
              label="Net wt"
              value={formatWeight(product.netWeight, "g")}
            />
            <InventoryStat
              label="Price"
              value={formatCurrency(Number(product.grossWeight) * 16000)}
            />
          </div>
        </div>
      </div>
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
  const totalStonePieces = (product.stones ?? []).reduce(
    (sum, stone) => sum + stone.totalPieces,
    0,
  );

  return (
    <section className="rounded-[28px] border border-border bg-card p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Product Details
          </p>
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
          <DetailRow
            label="Location"
            value={`${product.location.name}, ${product.location.city}`}
          />
          <DetailRow
            label="Metal"
            value={`Gold ${product.purity}K · ${formatWeight(product.netWeight, "g")}`}
          />
        </dl>
        <dl className="space-y-3">
          <DetailRow
            label="Gross wt"
            value={formatWeight(product.grossWeight, "g")}
          />
          <DetailRow
            label="Stones"
            value={
              totalStonePieces > 0
                ? `${(product.stones ?? [])[0]?.slab.stoneType.name ?? "Diamond"}, ${formatWeight(getStoneWeight(product), "ct")}`
                : "No stones"
            }
          />
          <DetailRow
            label="Source"
            value={
              product.isCustomerProduct ? "Customer product" : "Stock product"
            }
          />
          <DetailRow
            label="Pieces"
            value={`${totalStonePieces.toLocaleString("en-IN")} pcs`}
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
            <div className="mt-4 space-y-3">
              {(product.stones ?? []).map((stone) => (
                <div
                  key={stone.id}
                  className="rounded-2xl border border-border bg-background px-4 py-3"
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
          className="flex w-full items-start gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm"
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
      <section className="overflow-hidden rounded-[28px] border border-border bg-card shadow-sm">
        <div className="grid min-h-[26rem] lg:grid-cols-[minmax(320px,0.95fr)_1fr]">
          <Skeleton className="min-h-72 rounded-none" />
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
              <Skeleton className="h-20 rounded-2xl" />
              <Skeleton className="h-20 rounded-2xl" />
              <Skeleton className="h-20 rounded-2xl" />
            </div>
          </div>
        </div>
      </section>
      <Skeleton className="h-80 rounded-[28px]" />
    </div>
  );
}

function ErrorPanel({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5">
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

export function InventoryPageClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedProductId = searchParams.get("productId");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [colorFilter, setColorFilter] = useState("ALL");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("ALL");
  const [locationFilter, setLocationFilter] = useState("ALL");
  const productsQuery = useInventoryProducts();
  const detailQuery = useInventoryProduct(selectedProductId);

  const products = productsQuery.data?.data ?? [];
  const selectedListProduct = products.find(
    (product) => product.id === selectedProductId,
  );
  const selectedProduct = detailQuery.data ?? selectedListProduct ?? null;

  function selectProduct(productId: string) {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("productId", productId);
    router.push(`${pathname}?${nextParams.toString()}`);
  }

  const categoryOptions = useMemo(
    () =>
      Array.from(new Set(products.map((product) => product.category))).sort(),
    [products],
  );
  const colorOptions = useMemo(
    () => Array.from(new Set(products.map((product) => product.color))).sort(),
    [products],
  );
  const locationOptions = useMemo(
    () =>
      Array.from(
        new Map(
          products.map((product) => [product.location.id, product.location]),
        ).values(),
      ),
    [products],
  );

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return products.filter((product) => {
      const matchesQuery = !query || productSearchText(product).includes(query);
      const matchesCategory =
        categoryFilter === "ALL" || product.category === categoryFilter;
      const matchesColor =
        colorFilter === "ALL" || product.color === colorFilter;
      const matchesSource =
        sourceFilter === "ALL" ||
        (sourceFilter === "CUSTOMER"
          ? product.isCustomerProduct
          : !product.isCustomerProduct);
      const matchesLocation =
        locationFilter === "ALL" || product.location.id === locationFilter;

      return (
        matchesQuery &&
        matchesCategory &&
        matchesColor &&
        matchesSource &&
        matchesLocation
      );
    });
  }, [
    categoryFilter,
    colorFilter,
    locationFilter,
    products,
    searchQuery,
    sourceFilter,
  ]);

  const visibleCount = filteredProducts.length;
  const totalCount = productsQuery.data?.total ?? products.length;
  const customerCount = products.filter(
    (product) => product.isCustomerProduct,
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Product Inventory
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            Browse inventory and inspect product details
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Search products, narrow by inventory attributes, and open a product
            on the right for a full detail view.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 rounded-[28px] border border-border bg-card p-4 shadow-sm sm:min-w-[28rem]">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Products
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">
              {productsQuery.isLoading ? "-" : totalCount}
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Shown
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">
              {productsQuery.isLoading ? "-" : visibleCount}
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Customer
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">
              {productsQuery.isLoading ? "-" : customerCount}
            </p>
          </div>
        </div>
      </div>

      <section className="rounded-[28px] border border-border bg-card p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px_180px_180px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search code, vendor, location, category"
              className="h-10 pl-9"
            />
          </div>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All categories</SelectItem>
              {categoryOptions.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={colorFilter} onValueChange={setColorFilter}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Color" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All colors</SelectItem>
              {colorOptions.map((color) => (
                <SelectItem key={color} value={color}>
                  {color}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={sourceFilter}
            onValueChange={(value) => setSourceFilter(value as SourceFilter)}
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All sources</SelectItem>
              <SelectItem value="CUSTOMER">Customer product</SelectItem>
              <SelectItem value="STOCK">Stock product</SelectItem>
            </SelectContent>
          </Select>

          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All locations</SelectItem>
              {locationOptions.map((location) => (
                <SelectItem key={location.id} value={location.id}>
                  {location.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <section className="rounded-[28px] border border-border bg-card p-4 shadow-sm xl:max-h-[calc(100vh-17rem)] xl:overflow-y-auto">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Results
              </p>
              <h2 className="mt-1 text-base font-semibold tracking-tight text-foreground">
                Product list
              </h2>
            </div>
            <Badge variant="secondary">{visibleCount}</Badge>
          </div>

          {productsQuery.isLoading ? (
            <ProductListSkeleton />
          ) : productsQuery.isError ? (
            <ErrorPanel
              title="Unable to load products"
              message={getErrorMessage(productsQuery.error)}
            />
          ) : filteredProducts.length > 0 ? (
            <div className="space-y-2.5">
              {filteredProducts.map((product) => (
                <ProductListItem
                  key={product.id}
                  product={product}
                  selected={product.id === selectedProductId}
                  onSelect={() => selectProduct(product.id)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border py-16 text-center">
              <PackageSearch className="mx-auto h-7 w-7 text-muted-foreground/40" />
              <p className="mt-3 text-sm font-medium text-muted-foreground">
                No products match these filters
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                Clear or adjust your filters to see more products.
              </p>
            </div>
          )}
        </section>

        <div className="min-w-0 space-y-6">
          {selectedProductId && detailQuery.isLoading && !selectedProduct ? (
            <ProductDetailSkeleton />
          ) : selectedProductId && detailQuery.isError ? (
            <section className="rounded-[28px] border border-border bg-card p-6 shadow-sm">
              <ErrorPanel
                title="Unable to load product details"
                message={getErrorMessage(detailQuery.error)}
              />
            </section>
          ) : selectedProduct ? (
            <>
              <ProductDetail product={selectedProduct} />
              <ProductSpecification product={selectedProduct} />
            </>
          ) : (
            <section className="flex min-h-[28rem] items-center justify-center rounded-[28px] border border-dashed border-border bg-card text-center shadow-sm">
              <div>
                <PackageSearch className="mx-auto h-8 w-8 text-muted-foreground/40" />
                <p className="mt-3 text-sm font-medium text-muted-foreground">
                  Select a product to view its details
                </p>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
