"use client";

import { Calculator, ChevronDown, Diamond, MapPin, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { type RefObject, useMemo } from "react";
import { toast } from "sonner";
import { EstimationSummaryCard } from "@/components/calculator/EstimationSummaryCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useVendorAccess } from "@/hooks/useVendors";
import { captureProductEvent } from "@/lib/analytics";
import { normalizeInventoryProductEstimate } from "@/lib/inventoryProductMapping";
import { cn, formatCurrency } from "@/lib/utils";
import type { CalculatorSettings } from "@/types";
import type { InventoryProduct } from "@/types/inventory-api";
import {
  formatWeight,
  getMetalLabel,
  getTotalStoneCarat,
  getTotalStonePieces,
} from "./inventory-utils";
import { ProductMediaCarousel } from "./ProductMediaCarousel";

function InventoryStat({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-lg border border-border bg-background px-3 py-2.5",
        className,
      )}
    >
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd
        className="mt-1 truncate text-sm font-medium text-foreground"
        title={value}
      >
        {value}
      </dd>
    </div>
  );
}

export function ProductShareButton({ product }: { product: InventoryProduct }) {
  async function shareProduct() {
    const url = window.location.href;
    const title = `${product.name} (${product.productCode})`;

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text: title, url });
      } catch {
        // Share sheet dismissed.
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      toast.success("Product link copied");
    } catch {
      toast.error("Unable to copy the product link");
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-10 gap-2 px-3"
      onClick={() => void shareProduct()}
    >
      <Share2 className="size-4" />
      Share
    </Button>
  );
}

export function ProductDetail({
  product,
  estimationSectionRef,
}: {
  product: InventoryProduct;
  estimationSectionRef: RefObject<HTMLElement | null>;
}) {
  const canViewVendor = useVendorAccess();

  function scrollToEstimation() {
    captureProductEvent("inventory_estimation_viewed", {
      product_code: product.productCode,
      category: product.category,
      product_source: product.isCustomerProduct ? "customer" : "stock",
    });
    estimationSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
    <section className="@container overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="grid @min-[38rem]:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <ProductMediaCarousel product={product} />

        <div className="flex min-w-0 flex-col gap-4 p-4 sm:p-5 lg:p-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="default" className="rounded-full px-2.5">
                {product.category}
              </Badge>
              <Badge variant="outline" className="rounded-full px-2.5">
                {product.color}
              </Badge>
            </div>
            <h2 className="mt-3 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {product.name}
            </h2>
            <p className="mt-1 font-mono text-sm text-muted-foreground">
              {product.productCode}
            </p>
            {canViewVendor ? (
              <p className="mt-2 text-sm text-muted-foreground">
                {product.vendor}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={scrollToEstimation}
            aria-label="View estimation price breakdown"
            className="flex cursor-pointer items-center justify-between gap-3 rounded-xl bg-foreground px-4 py-3 text-left text-background transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <span className="min-w-0">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-background/70">
                Estimated price
              </span>
              <span className="mt-0.5 block text-2xl font-semibold tabular-nums tracking-tight">
                {formatCurrency(product.price.total)}
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-background/80">
              Breakup
              <ChevronDown className="size-4" />
            </span>
          </button>

          <dl className="grid grid-cols-2 gap-2">
            <InventoryStat label="Metal" value={getMetalLabel(product)} />
            <InventoryStat
              label="Net wt"
              value={formatWeight(product.netWeight, "g")}
            />
            <InventoryStat
              label="Stone wt"
              value={formatWeight(getTotalStoneCarat(product), "ct")}
            />
            <InventoryStat
              label="Gross wt"
              value={formatWeight(product.grossWeight, "g")}
            />
            <InventoryStat label="Location" value={product.location.city} />
            <InventoryStat
              label="Source"
              value={product.isCustomerProduct ? "Customer" : "Stock"}
            />
          </dl>
        </div>
      </div>
    </section>
  );
}

export function ProductEstimationSection({
  product,
  settings,
  estimationSectionRef,
}: {
  product: InventoryProduct;
  settings: CalculatorSettings;
  estimationSectionRef: RefObject<HTMLElement | null>;
}) {
  const estimateResult = useMemo(
    () => normalizeInventoryProductEstimate(product, settings),
    [product, settings],
  );
  const router = useRouter();

  function loadIntoCalculator() {
    const params = new URLSearchParams({
      tab: "calculate",
      productCode: product.productCode,
    });
    router.push(`/calculator?${params.toString()}`);
  }

  return (
    <section
      ref={estimationSectionRef}
      className="scroll-mt-[calc(var(--mobile-top-h,0px)+1rem)]"
    >
      <EstimationSummaryCard
        title="Product estimation"
        data={{ kind: "estimate", result: estimateResult }}
        renderHeaderActions={() => (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 shrink-0 rounded-md px-2.5 sm:h-8 sm:px-3"
            onClick={loadIntoCalculator}
            aria-label="Load in Calculator"
          >
            <Calculator className="h-4 w-4" />
            <span className="hidden sm:inline">Load in Calculator</span>
          </Button>
        )}
      />
    </section>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[6rem_1fr] gap-3 sm:grid-cols-[7rem_1fr] sm:gap-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-sm text-foreground">{value}</dd>
    </div>
  );
}

export function ProductSpecification({
  product,
}: {
  product: InventoryProduct;
}) {
  const canViewVendor = useVendorAccess();
  const stones = product.stones ?? [];

  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
          Specification
        </h2>
        <Badge variant="outline">{product.category}</Badge>
      </div>

      <div className="mt-4 grid gap-3 sm:mt-6 lg:grid-cols-2 lg:gap-6">
        <dl className="space-y-3">
          <DetailRow label="Code" value={product.productCode} />
          {canViewVendor ? (
            <DetailRow label="Vendor" value={product.vendor} />
          ) : null}
        </dl>
        <dl className="space-y-3">
          <DetailRow
            label="Gross wt"
            value={formatWeight(product.grossWeight, "g")}
          />
          <DetailRow
            label="Source"
            value={
              product.isCustomerProduct ? "Customer product" : "Stock product"
            }
          />
        </dl>
      </div>

      <Separator className="my-4 sm:my-6" />

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

      {stones.length > 0 ? (
        <>
          <Separator className="my-4 sm:my-6" />
          <div>
            <div className="flex items-center gap-2">
              <Diamond className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">
                Stone composition
              </p>
            </div>
            <dl className="mt-3 grid grid-cols-3 gap-2 sm:mt-4 sm:gap-3">
              <InventoryStat
                label="Stones"
                value={stones.length.toLocaleString("en-IN")}
              />
              <InventoryStat
                label="Carat"
                value={formatWeight(getTotalStoneCarat(product), "ct")}
              />
              <InventoryStat
                label="Pieces"
                value={`${getTotalStonePieces(product).toLocaleString("en-IN")} pcs`}
              />
            </dl>
            <div className="mt-3 space-y-2 sm:mt-4 sm:space-y-3">
              {stones.map((stone) => (
                <div
                  key={stone.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-border bg-background px-3 py-2.5 sm:px-4 sm:py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {stone.stoneName ?? stone.slabName}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {stone.slabName} · {formatCurrency(stone.ratePerCarat)}
                      /ct
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold text-foreground">
                      {formatCurrency(stone.amount)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatWeight(stone.netWeight, "ct")} ·{" "}
                      {stone.pieces.toLocaleString("en-IN")} pcs
                    </p>
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

export function ProductDetailSkeleton() {
  return (
    <div className="space-y-4">
      <section className="@container overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="grid @min-[38rem]:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="p-2 sm:p-4">
            <Skeleton className="aspect-[4/3] w-full rounded-xl" />
          </div>
          <div className="space-y-4 p-4 sm:p-5 lg:p-6">
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-7 w-4/5" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-16 rounded-xl" />
            <div className="grid grid-cols-2 gap-2">
              {["a", "b", "c", "d"].map((key) => (
                <Skeleton key={key} className="h-14 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </section>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}
