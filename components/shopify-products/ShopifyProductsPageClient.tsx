"use client";

import {
  ArrowUpRight,
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
import {
  editHref,
  ProductGridCard,
  ProductListRow,
  ProductThumb,
  productPrice,
  productSubtitle,
  statusBadge,
} from "@/components/shopify-products/ProductListItems";
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
import type { ShopifyProductStatusFilter } from "@/types/shopify-products";

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
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-4 pb-12 sm:gap-6">
      <header className="flex items-center justify-between gap-3 sm:items-start">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            <span className="sm:hidden">Shopify Store</span>
            <span className="hidden sm:inline">Manage Shopify Store</span>
          </h1>
          <p className="mt-1 hidden max-w-2xl text-sm text-muted-foreground sm:block">
            Browse the catalogue, prepare drafts, and manage products in Shopify
            Admin.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            asChild
            size="sm"
            variant="outline"
            className="max-sm:size-9 max-sm:px-0"
          >
            <a
              href="https://evoljewels.myshopify.com/admin/products"
              target="_blank"
              rel="noreferrer"
              aria-label="Open Shopify Admin"
            >
              <span className="hidden sm:inline">Shopify Admin</span>
              <ArrowUpRight />
            </a>
          </Button>
          <Button asChild size="sm" className="max-sm:h-9">
            <Link href="/shopify-products/new">
              <Plus /> <span className="sm:hidden">New product</span>
              <span className="hidden sm:inline">Upload new product</span>
            </Link>
          </Button>
        </div>
      </header>

      <section className="space-y-3 sm:space-y-5">
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
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search title, SKU, tag..."
              aria-label="Search products"
              className="h-10 pl-9 sm:h-9"
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
              className="shadow-none max-sm:size-9"
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
              className="shadow-none max-sm:size-9"
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
          <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 xl:grid-cols-4">
            {query.isPending ? <ProductGridSkeleton /> : null}
            {products.map((product) => (
              <ProductGridCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <>
            <ul className="divide-y border-y md:hidden">
              {query.isPending ? (
                <li className="space-y-3 py-3">
                  <Skeleton className="h-14 w-full rounded-lg" />
                  <Skeleton className="h-14 w-full rounded-lg" />
                  <Skeleton className="h-14 w-full rounded-lg" />
                </li>
              ) : null}
              {products.map((product) => (
                <ProductListRow key={product.id} product={product} />
              ))}
            </ul>
            <Table className="hidden border-y md:table">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Media</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Variants
                  </TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.isPending ? <ProductTableSkeleton /> : null}
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <ProductThumb
                        product={product}
                        className="size-12 rounded-lg border"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="max-w-64 space-y-1 lg:max-w-md">
                        <p className="truncate font-medium">{product.title}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {productSubtitle(product)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusBadge(product.status)}>
                        {product.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {product.variantsCount.count}
                    </TableCell>
                    <TableCell>{productPrice(product)}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button asChild size="sm" variant="ghost">
                          <Link href={editHref(product)}>
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
                ))}
              </TableBody>
            </Table>
          </>
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
