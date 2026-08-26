"use client";

import {
  Gem,
  IndianRupee,
  MapPin,
  PackagePlus,
  PackageSearch,
  Palette,
  UserRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { RefObject } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { captureProductEvent } from "@/lib/analytics";
import { getInventoryMediaUrl } from "@/lib/inventory-media";
import { getInventoryPrimaryImage } from "@/lib/inventoryProductMapping";
import { formatCurrency } from "@/lib/utils";
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

function ProductSaleCard({
  sale,
  priority = false,
}: {
  sale: RecentProductSale;
  priority?: boolean;
}) {
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
  const colorLabel = product
    ? (COLOR_LABELS[product.color] ?? product.color)
    : null;

  return (
    <article className="w-full rounded-xl border border-border bg-card p-3 text-left shadow-sm transition-colors hover:border-foreground/25 hover:bg-muted/20">
      <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-border bg-muted/60">
        {image ? (
          <Image
            src={getInventoryMediaUrl(image)}
            alt={image.altText || `${sale.productCode} product image`}
            fill
            priority={priority}
            unoptimized
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <PackageSearch className="size-8" aria-hidden="true" />
            <span className="text-xs font-medium">Image unavailable</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] items-start gap-3 pt-3 max-[420px]:grid-cols-2">
        <div className="min-w-0">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-foreground">
              {product?.name ?? sale.productCode}
            </h3>
            <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
              {sale.productCode}
            </p>
          </div>

          <div className="mt-2 flex min-w-0 flex-nowrap items-center gap-1.5">
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

        <div className="min-w-0 space-y-2 text-right">
          <p className="text-sm font-semibold tabular-nums text-foreground">
            <span className="sr-only">Selling price: </span>
            {formatSellingPrice(sale.sellingPrice)}
          </p>

          <div className="flex min-w-0 flex-wrap justify-end gap-1.5">
            <Badge variant="outline" className="max-w-full gap-1 font-normal">
              <UserRound className="size-3" aria-hidden="true" />
              <span className="truncate">{salesperson}</span>
            </Badge>
            <Badge variant="outline" className="max-w-full gap-1 font-normal">
              <MapPin className="size-3" aria-hidden="true" />
              <span className="truncate">{city}</span>
            </Badge>
          </div>
        </div>
      </div>

      <div className="mt-3 border-t border-border pt-3">
        {product ? (
          <Button asChild className="min-h-11 w-full gap-2" variant="outline">
            <Link
              href={`/orders/new?refill=${encodeURIComponent(sale.productCode)}`}
              onClick={() =>
                captureProductEvent("recent_sale_refill_started", {
                  inventory_resolution: sale.inventoryResolution,
                })
              }
            >
              <PackagePlus className="size-4" aria-hidden="true" />
              Refill product
            </Link>
          </Button>
        ) : (
          <Button className="min-h-11 w-full gap-2" variant="outline" disabled>
            <PackageSearch className="size-4" aria-hidden="true" />
            Refill unavailable
          </Button>
        )}
      </div>
    </article>
  );
}

function ProductSaleSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <Skeleton className="aspect-square w-full rounded-lg" />
      <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] items-start gap-3 pt-3 max-[420px]:grid-cols-2">
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
          <Skeleton className="ml-auto h-5 w-20" />
          <div className="flex flex-wrap justify-end gap-1.5">
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
}: {
  sales: RecentProductSale[];
  isLoading: boolean;
  isError: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  loadMoreRef: RefObject<HTMLDivElement | null>;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
      </div>
    );
  }

  return (
    <section aria-label="Recent product sales" className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sales.map((sale, index) => (
          <ProductSaleCard
            key={sale.saleItemId}
            sale={sale}
            priority={index === 0}
          />
        ))}
      </div>

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
