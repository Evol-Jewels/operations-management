"use client";

import { ImageIcon, LoaderCircle, ScanLine, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { fetchInventoryProducts } from "@/lib/inventoryApi";
import { getInventoryPrimaryImage } from "@/lib/inventoryProductMapping";

export type ReferenceProduct = {
  id: string;
  productCode: string;
  name: string;
  color: string;
  purity: number;
  imageUrl?: string;
};

export async function searchInventoryProducts(
  code: string,
): Promise<ReferenceProduct[]> {
  const response = await fetchInventoryProducts({ code, limit: 5 });
  return response.data.map((product) => ({
    id: product.id,
    productCode: product.productCode,
    name: product.name,
    color: product.color,
    purity: product.purity,
    imageUrl: getInventoryPrimaryImage(product)?.storageKey,
  }));
}

export function ProductSearch({
  selectedCode,
  onSelect,
  onScan,
  searchProducts,
  onInputChange,
}: {
  selectedCode: string;
  onSelect: (product: ReferenceProduct) => void;
  onScan: () => void;
  searchProducts: (query: string) => Promise<ReferenceProduct[]>;
  onInputChange?: (value: string) => void;
}) {
  const [value, setValue] = useState(selectedCode);
  const [results, setResults] = useState<ReferenceProduct[]>([]);
  const [editing, setEditing] = useState(false);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const requestRef = useRef(0);

  useEffect(() => setValue(selectedCode), [selectedCode]);

  useEffect(() => {
    const code = value.trim();
    if (!code || !editing) {
      requestRef.current += 1;
      setResults([]);
      setLoading(false);
      setError(false);
      setSearched(false);
      return;
    }

    const requestId = ++requestRef.current;
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      setError(false);
      try {
        const products = await searchProducts(code);
        if (requestId === requestRef.current) {
          setResults(products);
          setSearched(true);
        }
      } catch {
        if (requestId === requestRef.current) setError(true);
      } finally {
        if (requestId === requestRef.current) setLoading(false);
      }
    }, 400);

    return () => {
      window.clearTimeout(timeout);
      requestRef.current += 1;
    };
  }, [value, editing, searchProducts]);

  return (
    <Popover
      open={editing && Boolean(loading || error || results.length || searched)}
      onOpenChange={(open) => {
        if (!open) setEditing(false);
      }}
    >
      <PopoverAnchor asChild>
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={value}
              aria-label="Search existing product"
              placeholder="Search existing product"
              autoComplete="off"
              onChange={(event) => {
                const query = event.target.value.toUpperCase();
                setValue(query);
                setEditing(true);
                setResults([]);
                setSearched(false);
                setLoading(false);
                setError(false);
                onInputChange?.(query);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  if (results[0]) {
                    onSelect(results[0]);
                    setEditing(false);
                  }
                }
                if (event.key === "Escape") {
                  setEditing(false);
                  setResults([]);
                  setSearched(false);
                }
              }}
              className="h-10 pl-9"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setEditing(false);
              onScan();
            }}
            className="h-10 shrink-0"
          >
            <ScanLine className="size-4" />
            <span className="hidden sm:inline">Scan</span>
          </Button>
        </div>
      </PopoverAnchor>

      {loading || error || results.length || searched ? (
        <PopoverContent
          align="start"
          aria-label="Product search results"
          onOpenAutoFocus={(event) => event.preventDefault()}
          onCloseAutoFocus={(event) => event.preventDefault()}
          className="max-h-64 w-(--radix-popover-trigger-width) overflow-y-auto rounded-lg p-1 shadow-lg"
        >
          {loading ? (
            <div className="flex h-11 items-center gap-2 px-3 text-sm text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin" /> Searching...
            </div>
          ) : null}
          {error ? (
            <p className="px-3 py-2 text-sm text-destructive">
              Search unavailable.
            </p>
          ) : null}
          {!loading && !error && results.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              No products found.
            </p>
          ) : null}
          {results.map((product) => {
            return (
              <button
                key={product.id}
                type="button"
                onClick={() => {
                  onSelect(product);
                  setValue(product.productCode);
                  setResults([]);
                  setEditing(false);
                  setSearched(false);
                }}
                className="flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
              >
                <ProductThumb src={product.imageUrl} alt={product.name} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {product.name || product.productCode}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {product.productCode} · {product.color} {product.purity}K
                  </span>
                </span>
              </button>
            );
          })}
        </PopoverContent>
      ) : null}
    </Popover>
  );
}

export function ProductThumb({ src, alt }: { src?: string; alt: string }) {
  return src ? (
    // biome-ignore lint/performance/noImgElement: inventory URLs may be remote or temporary.
    <img
      src={src}
      alt={alt}
      className="size-10 shrink-0 rounded-md border border-border object-cover"
    />
  ) : (
    <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-muted">
      <ImageIcon className="size-4 text-muted-foreground" />
    </div>
  );
}
