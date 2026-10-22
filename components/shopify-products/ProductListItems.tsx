import { ArrowUpRight, ChevronRight, ImageIcon, Pencil } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  ShopifyProductStatus,
  ShopifyProductSummary,
} from "@/types/shopify-products";

export function formatPrice(amount: string, currencyCode: string) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

export function statusBadge(status: ShopifyProductStatus) {
  if (status === "ACTIVE") return "default" as const;
  if (status === "DRAFT") return "secondary" as const;
  return "outline" as const;
}

export function productSubtitle(product: ShopifyProductSummary) {
  return (
    [product.vendor, product.productType].filter(Boolean).join(" / ") ||
    "Uncategorized"
  );
}

export function productPrice(product: ShopifyProductSummary) {
  return formatPrice(
    product.priceRangeV2.minVariantPrice.amount,
    product.priceRangeV2.minVariantPrice.currencyCode,
  );
}

export function editHref(product: ShopifyProductSummary) {
  return `/shopify-products/${product.legacyResourceId}/edit`;
}

export function ProductThumb({
  product,
  className,
}: {
  product: ShopifyProductSummary;
  className?: string;
}) {
  const image = product.featuredMedia?.preview?.image;
  return (
    <div
      role="img"
      className={cn(
        "grid shrink-0 place-items-center bg-muted bg-cover bg-center",
        className,
      )}
      style={image?.url ? { backgroundImage: `url(${image.url})` } : undefined}
      aria-label={image?.altText || product.title}
    >
      {!image?.url ? (
        <ImageIcon className="size-5 text-muted-foreground/60" />
      ) : null}
    </div>
  );
}

function variantsLabel(count: number) {
  return `${count} ${count === 1 ? "variant" : "variants"}`;
}

export function ProductListRow({
  product,
}: {
  product: ShopifyProductSummary;
}) {
  return (
    <li className="flex items-center gap-1">
      <Link
        href={editHref(product)}
        className="flex min-w-0 flex-1 items-center gap-3 py-3 outline-none focus-visible:bg-muted/40"
      >
        <ProductThumb product={product} className="size-14 rounded-lg border" />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-medium leading-5">
            {product.title}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {productSubtitle(product)}
          </p>
          <div className="mt-1.5 flex items-center gap-2 text-xs">
            <Badge
              variant={statusBadge(product.status)}
              className="px-1.5 py-0 text-[10px]"
            >
              {product.status}
            </Badge>
            <span className="font-medium tabular-nums">
              {productPrice(product)}
            </span>
            <span className="truncate text-muted-foreground">
              · {variantsLabel(product.variantsCount.count)}
            </span>
          </div>
        </div>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
      </Link>
    </li>
  );
}

export function ProductGridCard({
  product,
}: {
  product: ShopifyProductSummary;
}) {
  return (
    <article className="group flex min-w-0 flex-col rounded-lg border bg-background p-2 transition-colors hover:border-foreground/20 sm:p-3">
      <Link href={editHref(product)} className="block outline-none">
        <ProductThumb
          product={product}
          className="aspect-square w-full rounded-md"
        />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col pt-2 sm:pt-3">
        <p className="line-clamp-2 text-sm font-medium leading-5 sm:truncate sm:text-base">
          {product.title}
        </p>
        <p className="mt-1 truncate text-xs text-muted-foreground">
          {productSubtitle(product)}
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-1 sm:mt-3 sm:gap-2">
          <Badge
            variant={statusBadge(product.status)}
            className="max-sm:px-1.5 max-sm:py-0 max-sm:text-[10px]"
          >
            {product.status}
          </Badge>
          <p className="text-sm font-medium tabular-nums">
            {productPrice(product)}
          </p>
        </div>
        <div className="mt-auto pt-2 sm:pt-3" />
        <div className="flex items-center justify-between gap-1 border-t pt-1.5 sm:pt-2">
          <span className="truncate text-xs text-muted-foreground">
            {variantsLabel(product.variantsCount.count)}
          </span>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              asChild
              size="sm"
              variant="ghost"
              className="max-sm:size-9 max-sm:px-0"
            >
              <Link
                href={editHref(product)}
                aria-label={`Edit ${product.title}`}
              >
                <Pencil /> <span className="hidden sm:inline">Edit</span>
              </Link>
            </Button>
            <Button
              asChild
              size="icon-sm"
              variant="ghost"
              className="max-sm:size-9"
            >
              <a
                href={product.adminUrl}
                target="_blank"
                rel="noreferrer"
                aria-label={`Open ${product.title} in Shopify`}
              >
                <ArrowUpRight />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
