"use client";

import {
  ArrowUpRight,
  ImageIcon,
  LayoutGrid,
  LoaderCircle,
  PackageSearch,
  Pencil,
  Plus,
  Search,
  TableProperties,
} from "lucide-react";
import Link from "next/link";
import { useDeferredValue, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInfiniteShopifyProducts } from "@/hooks/useShopifyProducts";
import type {
  ShopifyProductStatus,
  ShopifyProductStatusFilter,
} from "@/types/shopify-products";

function formatPrice(amount: string, currencyCode: string) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

function statusBadge(status: ShopifyProductStatus) {
  if (status === "ACTIVE") return "default" as const;
  if (status === "DRAFT") return "secondary" as const;
  return "outline" as const;
}

type ProductView = "table" | "grid";

const statusTabClassName =
  "h-11 flex-none rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 shadow-none focus-visible:border-transparent focus-visible:border-b-foreground focus-visible:ring-0 data-[state=active]:border-x-transparent data-[state=active]:border-t-transparent data-[state=active]:border-b-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none";

function ProductTableSkeleton() {
  return ["a", "b", "c", "d", "e", "f", "g"].map((key) => (
    <TableRow key={key}>
      <TableCell>
        <Skeleton className="size-12 rounded-lg" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-48" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-5 w-16 rounded-full" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-20" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-24" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-8 w-24" />
      </TableCell>
    </TableRow>
  ));
}

function ProductGridSkeleton() {
  return ["a", "b", "c", "d", "e", "f"].map((key) => (
    <div key={key} className="space-y-3 rounded-lg border p-3">
      <Skeleton className="aspect-square w-full rounded-md" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-3 w-2/5" />
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  ));
}

export function ShopifyProductsPageClient() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ShopifyProductStatusFilter>("ALL");
  const [view, setView] = useState<ProductView>("table");
  const deferredSearch = useDeferredValue(search.trim());
  const query = useInfiniteShopifyProducts(deferredSearch, status);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const products = query.data?.pages.flatMap((page) => page.products) ?? [];

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (
          entry?.isIntersecting &&
          query.hasNextPage &&
          !query.isFetchingNextPage
        ) {
          query.fetchNextPage();
        }
      },
      { rootMargin: "400px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [query.fetchNextPage, query.hasNextPage, query.isFetchingNextPage]);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-12">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Manage Shopify Store
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Browse the catalogue, prepare drafts, and manage products in Shopify
            Admin.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <a
              href="https://evoljewels.myshopify.com/admin/products"
              target="_blank"
              rel="noreferrer"
            >
              Shopify Admin <ArrowUpRight />
            </a>
          </Button>
          <Button asChild size="sm">
            <Link href="/shopify-products/new">
              <Plus /> Upload new product
            </Link>
          </Button>
        </div>
      </header>

      <section className="space-y-5">
        <Tabs
          value={status}
          onValueChange={(value) =>
            setStatus(value as ShopifyProductStatusFilter)
          }
        >
          <TabsList className="h-auto w-full justify-start gap-6 rounded-none border-0 border-border border-b bg-transparent p-0 text-muted-foreground">
            <TabsTrigger value="ALL" className={statusTabClassName}>
              All
            </TabsTrigger>
            <TabsTrigger value="ACTIVE" className={statusTabClassName}>
              Active
            </TabsTrigger>
            <TabsTrigger value="DRAFT" className={statusTabClassName}>
              Draft
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center justify-end gap-2">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search title, SKU, tag..."
              className="pl-9"
            />
          </div>
          <fieldset className="flex shrink-0 items-center rounded-md border bg-background p-0.5">
            <legend className="sr-only">Product view</legend>
            <Button
              type="button"
              size="icon-sm"
              variant={view === "table" ? "secondary" : "ghost"}
              onClick={() => setView("table")}
              aria-label="Show products as a table"
              aria-pressed={view === "table"}
              title="Table view"
              className="shadow-none"
            >
              <TableProperties />
            </Button>
            <Button
              type="button"
              size="icon-sm"
              variant={view === "grid" ? "secondary" : "ghost"}
              onClick={() => setView("grid")}
              aria-label="Show products as a grid"
              aria-pressed={view === "grid"}
              title="Grid view"
              className="shadow-none"
            >
              <LayoutGrid />
            </Button>
          </fieldset>
        </div>

        {query.isError ? (
          <div className="flex min-h-72 flex-col items-center justify-center gap-3 border-y p-8 text-center">
            <PackageSearch className="size-8 text-muted-foreground" />
            <p className="font-medium">Products could not be loaded</p>
            <p className="max-w-md text-sm text-muted-foreground">
              {query.error.message}
            </p>
            <Button variant="outline" onClick={() => query.refetch()}>
              Try again
            </Button>
          </div>
        ) : view === "grid" ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {query.isPending ? <ProductGridSkeleton /> : null}
            {products.map((product) => {
              const image = product.featuredMedia?.preview?.image;
              return (
                <article
                  key={product.id}
                  className="group flex min-w-0 flex-col rounded-lg border bg-background p-3 transition-colors hover:border-foreground/20"
                >
                  <div
                    role="img"
                    className="grid aspect-square w-full place-items-center rounded-md bg-muted bg-cover bg-center"
                    style={
                      image?.url
                        ? { backgroundImage: `url(${image.url})` }
                        : undefined
                    }
                    aria-label={image?.altText || product.title}
                  >
                    {!image?.url ? (
                      <ImageIcon className="size-7 text-muted-foreground/60" />
                    ) : null}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col pt-3">
                    <p className="truncate font-medium">{product.title}</p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {[product.vendor, product.productType]
                        .filter(Boolean)
                        .join(" / ") || "Uncategorized"}
                    </p>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <Badge variant={statusBadge(product.status)}>
                        {product.status}
                      </Badge>
                      <p className="text-sm font-medium">
                        {formatPrice(
                          product.priceRangeV2.minVariantPrice.amount,
                          product.priceRangeV2.minVariantPrice.currencyCode,
                        )}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t pt-2">
                      <span className="text-xs text-muted-foreground">
                        {product.variantsCount.count}{" "}
                        {product.variantsCount.count === 1
                          ? "variant"
                          : "variants"}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button asChild size="sm" variant="ghost">
                          <Link
                            href={`/shopify-products/${product.legacyResourceId}/edit`}
                          >
                            <Pencil /> Edit
                          </Link>
                        </Button>
                        <Button asChild size="icon-sm" variant="ghost">
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
            })}
          </div>
        ) : (
          <Table className="border-y">
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Media</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Variants</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.isPending ? <ProductTableSkeleton /> : null}
              {products.map((product) => {
                const image = product.featuredMedia?.preview?.image;
                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div
                        role="img"
                        className="grid size-12 place-items-center rounded-lg border bg-muted bg-cover bg-center"
                        style={
                          image?.url
                            ? { backgroundImage: `url(${image.url})` }
                            : undefined
                        }
                        aria-label={image?.altText || product.title}
                      >
                        {!image?.url ? (
                          <ImageIcon className="size-5 text-muted-foreground" />
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-md space-y-1">
                        <p className="truncate font-medium">{product.title}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {[product.vendor, product.productType]
                            .filter(Boolean)
                            .join(" / ") || "Uncategorized"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusBadge(product.status)}>
                        {product.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{product.variantsCount.count}</TableCell>
                    <TableCell>
                      {formatPrice(
                        product.priceRangeV2.minVariantPrice.amount,
                        product.priceRangeV2.minVariantPrice.currencyCode,
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button asChild size="sm" variant="ghost">
                          <Link
                            href={`/shopify-products/${product.legacyResourceId}/edit`}
                          >
                            <Pencil /> Edit
                          </Link>
                        </Button>
                        <Button asChild size="icon" variant="ghost">
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
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        {!query.isPending && !query.isError && products.length === 0 ? (
          <div className="grid min-h-64 place-items-center border-y p-8 text-center text-sm text-muted-foreground">
            No Shopify products match these filters.
          </div>
        ) : null}
        <div
          ref={loadMoreRef}
          className="flex h-12 items-center justify-center text-xs text-muted-foreground"
        >
          {query.isFetchingNextPage ? (
            <>
              <LoaderCircle className="mr-2 size-4 animate-spin" /> Loading more
              products
            </>
          ) : null}
          {!query.hasNextPage && products.length
            ? `${products.length} products loaded`
            : null}
        </div>
      </section>
    </main>
  );
}
