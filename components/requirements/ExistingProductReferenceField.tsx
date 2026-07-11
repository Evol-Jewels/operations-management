"use client";

import { LoaderCircle, ScanLine, Search, X } from "lucide-react";
import { useState } from "react";
import { BarcodeScanDialog } from "@/components/calculator/BarcodeScanDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useInventoryProductByCode } from "@/hooks/useInventoryProducts";
import { normalizeDecodedId } from "@/lib/barcodeScanner";
import { getInventoryPrimaryImage } from "@/lib/inventoryProductMapping";
import { SectionShell } from "./RequirementFields";

export function ExistingProductReferenceField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [input, setInput] = useState(value);
  const [lookupCode, setLookupCode] = useState(value);
  const [scannerOpen, setScannerOpen] = useState(false);
  const productQuery = useInventoryProductByCode(lookupCode || null);
  const product = productQuery.data;
  const notFound = Boolean(lookupCode && !productQuery.isLoading && !product);
  const image = product ? getInventoryPrimaryImage(product) : undefined;

  function lookUp(rawCode: string) {
    const code = normalizeDecodedId(rawCode) ?? "";
    setInput(code);
    setLookupCode(code);
  }

  function clearProduct() {
    setInput("");
    setLookupCode("");
    onChange("");
  }

  return (
    <SectionShell eyebrow="References" title="Reference an existing product">
      <div className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={input}
            placeholder="Enter product code"
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                lookUp(input);
              }
            }}
            className="h-10 flex-1"
          />
          <Button type="button" variant="outline" onClick={() => lookUp(input)}>
            <Search className="size-4" />
            Find product
          </Button>
          <Button type="button" variant="outline" onClick={() => setScannerOpen(true)}>
            <ScanLine className="size-4" />
            Scan
          </Button>
        </div>

        {productQuery.isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin" /> Looking up product...
          </div>
        ) : null}
        {productQuery.isError ? (
          <p className="text-sm text-destructive">Unable to look up this product. Try again.</p>
        ) : null}
        {notFound ? (
          <p className="text-sm text-destructive">No product found for “{lookupCode}”.</p>
        ) : null}
        {product ? (
          <div className="flex min-w-0 items-center gap-3 rounded-lg border border-border bg-muted/20 p-3">
            {image ? (
              // biome-ignore lint/performance/noImgElement: inventory media may be a remote storage URL.
              <img src={image.storageKey} alt={image.altText || product.name} className="size-12 shrink-0 rounded-md object-cover" />
            ) : (
              <div className="size-12 shrink-0 rounded-md bg-muted" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{product.name || product.productCode}</p>
              <p className="truncate text-xs text-muted-foreground">{product.productCode} · {product.category} · {product.purity}K</p>
            </div>
            {value === product.productCode ? (
              <Button type="button" variant="ghost" size="icon-sm" onClick={clearProduct} aria-label="Remove referenced product">
                <X className="size-4" />
              </Button>
            ) : (
              <Button type="button" size="sm" onClick={() => onChange(product.productCode)}>Use product</Button>
            )}
          </div>
        ) : null}
      </div>
      <BarcodeScanDialog
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onDecoded={(code) => {
          setScannerOpen(false);
          lookUp(code);
        }}
      />
    </SectionShell>
  );
}
