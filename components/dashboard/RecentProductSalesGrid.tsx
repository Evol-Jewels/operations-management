"use client";

import {
  CalendarDays,
  Factory,
  Gem,
  IndianRupee,
  Layers,
  MapPin,
  Minus,
  PackagePlus,
  PackageSearch,
  Palette,
  Plus,
  UserRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { type RefObject, useState } from "react";
import { CreateRefillRequestDialog } from "@/components/refill-requests/CreateRefillRequestDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { captureProductEvent } from "@/lib/analytics";
import { getInventoryMediaUrl } from "@/lib/inventory-media";
import { getInventoryPrimaryImage } from "@/lib/inventoryProductMapping";
import { formatSaleMonth } from "@/lib/recentSalesFilters";
import { cn, formatCurrency } from "@/lib/utils";
import type { RecentProductSale } from "@/types/stock-sales-api";

const SKELETON_KEYS = [
  "sale-skeleton-1",
  "sale-skeleton-2",
  "sale-skeleton-3",
  "sale-skeleton-4",
  "sale-skeleton-5",
  "sale-skeleton-6",
  "sale-skeleton-7",
  "sale-skeleton-8",
] as const;

const COLOR_LABELS: Record<string, string> = {
  YELLOW: "Yellow",
  ROSE: "Rose",
  WHITE: "White",
  OTHERS: "Others",
};

function formatSellingPrice(value: string) {
  const amount = Number(value);
  return Number.isFinite(amount) ? formatCurrency(amount) : value;
}

const MAX_REFILL_QUANTITY = 1000;

interface RefillSelection {
  productCode: string;
  name: string;
  vendorId: string | null;
  vendorName: string;
  quantity: number;
}

function toRefillSelection(sale: RecentProductSale): RefillSelection | null {
  const product = sale.product;
  if (!product) return null;
  return {
    productCode: product.productCode,
    name: product.name,
    vendorId: product.vendorId ?? null,
    vendorName: product.vendor,
    quantity: 1,
  };
}

function ProductSaleCard({
  sale,
  priority = false,
  quantity,
  isSelecting,
  onQuantityChange,
}: {
  sale: RecentProductSale;
  priority?: boolean;
  quantity: number;
  isSelecting: boolean;
  onQuantityChange: (quantity: number) => void;
}) {
  const isSelected = quantity > 0;
  const image = sale.product
    ? getInventoryPrimaryImage(sale.product)
    : undefined;
  const product = sale.product;
  const city =
    product?.location.city?.trim() ||
    sale.location?.city?.trim() ||
    sale.location?.name ||
    sale.storeName ||
    "Location unavailable";
  const salesperson = sale.salesPerson?.name ?? "N/A";
  const vendor = product?.vendor?.trim();
  const colorLabel = product
    ? (COLOR_LABELS[product.color] ?? product.color)
    : null;

  return (
    <article
      className={cn(
        "@container relative flex w-full min-w-0 flex-col rounded-xl border border-border bg-card p-2 text-left shadow-sm transition-colors sm:p-3",
        product && "hover:border-foreground/25 hover:bg-muted/20",
        isSelected && "border-foreground ring-1 ring-foreground",
      )}
    >
      {product ? (
        <Link
          href={`/inventory?productCode=${encodeURIComponent(product.productCode)}`}
          aria-label={`View inventory details for ${product.name} (${product.productCode})`}
          className="absolute inset-0 z-10 cursor-pointer rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      ) : null}
      <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-border bg-muted/60">
        {image ? (
          <Image
            src={getInventoryMediaUrl(image)}
            alt={image.altText || `${sale.productCode} product image`}
            fill
            priority={priority}
            unoptimized
            sizes="(max-width: 768px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <PackageSearch className="size-8" aria-hidden="true" />
            <span className="text-xs font-medium">Image unavailable</span>
          </div>
        )}
      </div>

      <div className="grid flex-1 items-start gap-2 pt-2.5 @[17rem]:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] @[17rem]:gap-3 @[17rem]:pt-3">
        <div className="min-w-0">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-foreground @[17rem]:text-base">
              {product?.name ?? sale.productCode}
            </h3>
            <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
              {sale.productCode}
            </p>
            {vendor ? (
              <p className="mt-0.5 flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
                <Factory className="size-3 shrink-0" aria-hidden="true" />
                <span className="sr-only">Vendor: </span>
                <span className="truncate">{vendor}</span>
              </p>
            ) : null}
          </div>

          <div className="mt-2 flex min-w-0 flex-wrap items-center gap-1.5">
            {product && colorLabel ? (
              <>
                <Badge variant="secondary" className="gap-1 font-normal">
                  <Gem className="size-3" aria-hidden="true" />
                  {product.purity}K
                </Badge>
                <Badge variant="secondary" className="gap-1 font-normal">
                  <Palette className="size-3" aria-hidden="true" />
                  {colorLabel}
                </Badge>
              </>
            ) : (
              <Badge variant="secondary" className="max-w-full font-normal">
                <span className="truncate">Inventory details unavailable</span>
              </Badge>
            )}
          </div>
        </div>

        <div className="min-w-0 space-y-2 @[17rem]:text-right">
          <p className="text-sm font-semibold tabular-nums text-foreground">
            <span className="sr-only">Selling price: </span>
            {formatSellingPrice(sale.sellingPrice)}
          </p>

          <div className="space-y-0.5 text-xs text-muted-foreground @[17rem]:hidden">
            <p className="flex min-w-0 items-center gap-1">
              <UserRound className="size-3 shrink-0" aria-hidden="true" />
              <span className="truncate">{salesperson}</span>
            </p>
            <p className="flex min-w-0 items-center gap-1">
              <MapPin className="size-3 shrink-0" aria-hidden="true" />
              <span className="truncate">
                {city}
                {sale.saleMonth ? ` · ${formatSaleMonth(sale.saleMonth)}` : ""}
              </span>
            </p>
          </div>

          <div className="hidden min-w-0 flex-wrap gap-1.5 @[17rem]:flex @[17rem]:justify-end">
            <Badge variant="outline" className="max-w-full gap-1 font-normal">
              <UserRound className="size-3" aria-hidden="true" />
              <span className="truncate">{salesperson}</span>
            </Badge>
            <Badge variant="outline" className="max-w-full gap-1 font-normal">
              <MapPin className="size-3" aria-hidden="true" />
              <span className="truncate">{city}</span>
            </Badge>
            {sale.saleMonth ? (
              <Badge variant="outline" className="gap-1 font-normal">
                <CalendarDays className="size-3" aria-hidden="true" />
                <span className="sr-only">Sold in </span>
                {formatSaleMonth(sale.saleMonth)}
              </Badge>
            ) : null}
          </div>
        </div>
      </div>

      <div className="relative z-20 mt-2.5 border-t border-border pt-2.5 @[17rem]:mt-3 @[17rem]:pt-3">
        {isSelected ? (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-10 @[17rem]:size-11"
              aria-label={
                quantity === 1 ? "Remove from refill" : "Decrease quantity"
              }
              onClick={() => onQuantityChange(quantity - 1)}
            >
              <Minus className="size-4" aria-hidden="true" />
            </Button>
            <p className="flex-1 text-center text-sm" aria-live="polite">
              <span className="font-semibold tabular-nums">{quantity}</span>{" "}
              <span className="text-muted-foreground">for refill</span>
            </p>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-10 @[17rem]:size-11"
              aria-label="Increase quantity"
              disabled={quantity >= MAX_REFILL_QUANTITY}
              onClick={() => onQuantityChange(quantity + 1)}
            >
              <Plus className="size-4" aria-hidden="true" />
            </Button>
          </div>
        ) : !product ? (
          <Button
            className="min-h-10 w-full gap-2 px-2 @[17rem]:min-h-11"
            variant="outline"
            disabled
          >
            <PackageSearch className="size-4" aria-hidden="true" />
            Refill unavailable
          </Button>
        ) : (
          <div
            className={cn("grid gap-2", !isSelecting && "@[15rem]:grid-cols-2")}
          >
            {!isSelecting ? (
              <Button
                asChild
                className="min-h-10 gap-2 px-2 @[17rem]:min-h-11"
                variant="outline"
              >
                <Link
                  href={`/orders/new?refill=${encodeURIComponent(sale.productCode)}`}
                  onClick={() =>
                    captureProductEvent("recent_sale_refill_started", {
                      inventory_resolution: sale.inventoryResolution,
                    })
                  }
                >
                  <PackagePlus className="size-4" aria-hidden="true" />
                  <span>
                    Refill
                    <span className="hidden @[17rem]:inline"> product</span>
                  </span>
                </Link>
              </Button>
            ) : null}
            <Button
              type="button"
              className="min-h-10 gap-2 px-2 @[17rem]:min-h-11"
              variant="outline"
              onClick={() => onQuantityChange(1)}
            >
              <Layers className="size-4" aria-hidden="true" />
              Bulk refill
            </Button>
          </div>
        )}
      </div>
    </article>
  );
}

function ProductSaleSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-2 sm:p-3">
      <Skeleton className="aspect-square w-full rounded-lg" />
      <div className="grid flex-1 items-start gap-2 pt-2.5 @[17rem]:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] @[17rem]:gap-3 @[17rem]:pt-3">
        <div className="space-y-2">
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-28 max-w-full" />
            <Skeleton className="h-3 w-20 max-w-full" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>

        <div className="space-y-2">
          <Skeleton className="h-5 w-20" />
          <div className="flex flex-wrap gap-1.5">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
      </div>
      <Skeleton className="mt-3 h-11 w-full" />
    </div>
  );
}

export function RecentProductSalesGrid({
  sales,
  isLoading,
  isError,
  isFetchingNextPage,
  hasNextPage,
  loadMoreRef,
  isFiltered = false,
}: {
  sales: RecentProductSale[];
  isLoading: boolean;
  isError: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  loadMoreRef: RefObject<HTMLDivElement | null>;
  isFiltered?: boolean;
}) {
  const [selected, setSelected] = useState<Map<string, RefillSelection>>(
    () => new Map(),
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const selection = [...selected.values()];
  const vendorIds = new Set(selection.map((item) => item.vendorId));
  const sharedVendor =
    vendorIds.size === 1 && selection[0]?.vendorId ? selection[0] : null;
  const pieces = selection.reduce((total, item) => total + item.quantity, 0);
  const selectAll = new Map(selected);
  for (const sale of sales) {
    const item = toRefillSelection(sale);
    if (item && !selectAll.has(item.productCode))
      selectAll.set(item.productCode, item);
  }

  const setQuantity = (sale: RecentProductSale, quantity: number) => {
    const item = toRefillSelection(sale);
    if (!item) return;
    setSelected((current) => {
      const next = new Map(current);
      if (quantity > 0) next.set(item.productCode, { ...item, quantity });
      else next.delete(item.productCode);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3">
        {SKELETON_KEYS.map((key) => (
          <ProductSaleSkeleton key={key} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-dashed border-border py-16 text-center">
        <p className="text-sm font-medium text-foreground">
          Could not load recent product sales
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Please refresh the page and try again.
        </p>
      </div>
    );
  }

  if (sales.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border py-16 text-center">
        <PackageSearch className="mx-auto size-8 text-muted-foreground" />
        <p className="mt-3 text-sm font-medium text-foreground">
          No recent product sales found
        </p>
        {isFiltered ? (
          <p className="mt-1 text-sm text-muted-foreground">
            Try widening the months or clearing some filters.
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <section aria-label="Recent product sales" className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3">
        {sales.map((sale, index) => (
          <ProductSaleCard
            key={sale.saleItemId}
            sale={sale}
            priority={index === 0}
            quantity={selected.get(sale.productCode)?.quantity ?? 0}
            isSelecting={selected.size > 0}
            onQuantityChange={(quantity) => setQuantity(sale, quantity)}
          />
        ))}
      </div>

      {selection.length > 0 ? (
        <div className="sticky bottom-4 z-30 mx-auto flex w-fit max-w-full flex-wrap items-center justify-center gap-2 rounded-xl border bg-background/95 p-2 pl-4 shadow-lg backdrop-blur">
          <p className="text-sm">
            <span className="font-medium">{selection.length} selected</span>
            <span className="text-muted-foreground"> · {pieces} pcs</span>
          </p>
          {selectAll.size > selected.size ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setSelected(selectAll)}
            >
              Select all {selectAll.size}
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setSelected(new Map())}
          >
            Clear
          </Button>
          <Button
            type="button"
            size="sm"
            className="gap-2"
            onClick={() => setIsDialogOpen(true)}
          >
            <PackagePlus className="size-4" aria-hidden="true" />
            Create bulk refill request
          </Button>
        </div>
      ) : null}
      {isDialogOpen ? (
        <CreateRefillRequestDialog
          defaultVendor={
            sharedVendor?.vendorId
              ? { id: sharedVendor.vendorId, name: sharedVendor.vendorName }
              : null
          }
          items={selection}
          onClose={() => setIsDialogOpen(false)}
          onCreated={() => {
            captureProductEvent("refill_request_created", {
              product_count: selection.length,
              piece_count: pieces,
            });
            setIsDialogOpen(false);
            setSelected(new Map());
          }}
        />
      ) : null}

      <div ref={loadMoreRef} className="h-1" aria-hidden="true" />
      <div
        className="flex min-h-11 items-center justify-center"
        aria-live="polite"
      >
        {isFetchingNextPage ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <IndianRupee className="size-4 animate-pulse" aria-hidden="true" />
            Loading more sales…
          </div>
        ) : !hasNextPage ? (
          <p className="text-xs text-muted-foreground">End of recent sales</p>
        ) : null}
      </div>
    </section>
  );
}
