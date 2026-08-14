"use client";

import { IndianRupee, MapPin, PackageSearch, UserRound } from "lucide-react";
import Image from "next/image";
import type { RefObject } from "react";
import { Skeleton } from "@/components/ui/skeleton";
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
    ? getInventoryPrimaryImage(sale.product, true)
    : undefined;
  const store = sale.location?.name ?? sale.storeName ?? "Store unavailable";
  const salesperson = sale.salesPerson?.name ?? "Salesperson unavailable";

  return (
    <article className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-[border-color,box-shadow] duration-200 hover:border-foreground/20 hover:shadow-md">
      <div className="relative aspect-[4/3] overflow-hidden border-b border-border bg-muted/60">
        {image ? (
          <Image
            src={getInventoryMediaUrl(image)}
            alt={image.altText || `${sale.productCode} product image`}
            fill
            priority={priority}
            unoptimized
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-contain p-3 transition-transform duration-300 motion-safe:group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <PackageSearch className="size-8" aria-hidden="true" />
            <span className="text-xs font-medium">Image unavailable</span>
          </div>
        )}
      </div>

      <div className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-mono text-sm font-semibold text-foreground">
              {sale.productCode}
            </p>
            {sale.inventoryResolution === "NOT_FOUND" ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Inventory details unavailable
              </p>
            ) : null}
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Selling price
            </p>
            <p className="mt-0.5 text-base font-semibold tabular-nums text-foreground">
              {formatSellingPrice(sale.sellingPrice)}
            </p>
          </div>
        </div>

        <dl className="grid gap-2.5 border-t border-border pt-3 text-sm">
          <div className="flex min-w-0 items-center gap-2 text-muted-foreground">
            <UserRound className="size-4 shrink-0" aria-hidden="true" />
            <dt className="sr-only">Salesperson</dt>
            <dd className="truncate">{salesperson}</dd>
          </div>
          <div className="flex min-w-0 items-center gap-2 text-muted-foreground">
            <MapPin className="size-4 shrink-0" aria-hidden="true" />
            <dt className="sr-only">Store location</dt>
            <dd className="truncate">{store}</dd>
          </div>
        </dl>
      </div>
    </article>
  );
}

function ProductSaleSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="space-y-4 p-4">
        <div className="flex justify-between gap-4">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-8 w-28" />
        </div>
        <div className="space-y-2.5 border-t border-border pt-3">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
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
