"use client";

import { MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getInventoryMediaUrl } from "@/lib/inventory-media";
import { getInventoryPrimaryImage } from "@/lib/inventoryProductMapping";
import { cn, formatCurrency } from "@/lib/utils";
import type { InventoryProduct } from "@/types/inventory-api";
import {
  InventoryImageDownloadButton,
  InventoryProductImage,
} from "./InventoryProductImage";
import { getColorLabel } from "./inventory-utils";

export const PRODUCT_GRID_CLASS =
  "grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5";
export const PRODUCT_RAIL_CLASS =
  "grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 lg:grid-cols-1 lg:gap-2";

export function ProductCard({
  product,
  selected,
  rowOnLg = false,
  onSelect,
}: {
  product: InventoryProduct;
  selected: boolean;
  rowOnLg?: boolean;
  onSelect: () => void;
}) {
  const image = getInventoryPrimaryImage(product);
  const city = product.location.city?.trim() || "City unavailable";

  return (
    <div
      className={cn(
        "group/card relative flex min-w-0 flex-col rounded-xl border bg-card p-1.5 text-left shadow-sm transition-colors hover:border-foreground/25 hover:bg-muted/20 has-[button:focus-visible]:ring-2 has-[button:focus-visible]:ring-ring has-[button:focus-visible]:ring-offset-2 sm:p-2",
        rowOnLg && "lg:flex-row lg:items-center lg:gap-2.5",
        selected
          ? "border-foreground/60 ring-1 ring-foreground/10"
          : "border-border",
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-label={`View ${product.name}`}
        className="absolute inset-0 z-0 cursor-pointer rounded-xl"
      />
      <div
        className={cn(
          "group/image pointer-events-none relative z-10 aspect-square w-full overflow-hidden rounded-lg bg-muted/60",
          rowOnLg && "lg:size-16 lg:shrink-0",
        )}
      >
        <InventoryProductImage
          image={image}
          sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
          className="object-cover"
        />
        {image ? (
          <div className={cn("pointer-events-auto", rowOnLg && "lg:hidden")}>
            <InventoryImageDownloadButton
              imageUrl={getInventoryMediaUrl(image)}
              productCode={product.productCode}
              className="top-1.5 right-1.5 size-8 rounded-lg [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/card:opacity-100"
            />
          </div>
        ) : null}
      </div>

      <div
        className={cn(
          "pointer-events-none relative z-10 flex min-w-0 flex-1 flex-col px-1 pt-2 pb-1",
          rowOnLg && "lg:p-0",
        )}
      >
        <h3
          className={cn(
            "line-clamp-2 text-[13px] leading-snug font-medium text-foreground sm:text-sm",
            rowOnLg && "lg:line-clamp-1",
          )}
          title={product.name}
        >
          {product.name}
        </h3>
        <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
          {product.productCode}
        </p>
        <p className="mt-auto pt-1.5 text-sm font-semibold tabular-nums tracking-tight text-foreground sm:text-base">
          {formatCurrency(product.price.total)}
        </p>
        <div
          className={cn(
            "mt-1.5 flex min-w-0 gap-1 overflow-hidden",
            rowOnLg && "lg:hidden",
          )}
        >
          <Badge variant="secondary" className="px-1.5 text-[11px] font-normal">
            {product.purity}K · {getColorLabel(product)}
          </Badge>
          <Badge
            variant="outline"
            className="min-w-0 shrink px-1.5 text-[11px] font-normal"
          >
            <MapPin aria-hidden="true" />
            <span className="truncate">{city}</span>
          </Badge>
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ className }: { className: string }) {
  const rows = ["row-1", "row-2", "row-3", "row-4", "row-5", "row-6"];

  return (
    <div className={className}>
      {rows.map((row) => (
        <div
          key={row}
          className="rounded-xl border border-border bg-card p-1.5 shadow-sm sm:p-2"
        >
          <Skeleton className="aspect-square w-full rounded-lg" />
          <div className="space-y-2 px-1 pt-2 pb-1">
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-5 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
