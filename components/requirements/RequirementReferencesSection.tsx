"use client";

import {
  ExternalLink,
  Expand,
  ImageIcon,
  Link2,
  LoaderCircle,
  Plus,
  ScanLine,
  Search,
  Upload,
  X,
} from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { BarcodeScanDialog } from "@/components/calculator/BarcodeScanDialog";
import type { ProductReference } from "@/components/enquiries/enquiry-form-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useInventoryProductByCode } from "@/hooks/useInventoryProducts";
import { normalizeDecodedId } from "@/lib/barcodeScanner";
import { fetchInventoryProducts } from "@/lib/inventoryApi";
import { getInventoryPrimaryImage } from "@/lib/inventoryProductMapping";
import type { InventoryProduct } from "@/types/inventory-api";
import { SectionShell } from "./RequirementFields";
import { ImagePreviewDialog } from "./ImagePreviewDialog";
import {
  generateRequirementId,
  isValidReferenceLink,
  normalizeReferenceLink,
} from "./requirement-form-utils";

export function RequirementReferencesSection({
  productCode,
  references,
  onProductChange,
  onReferencesChange,
}: {
  productCode: string;
  references: ProductReference[];
  onProductChange: (productCode: string) => void;
  onReferencesChange: (references: ProductReference[]) => void;
}) {
  const [scannerOpen, setScannerOpen] = useState(false);
  const productQuery = useInventoryProductByCode(productCode || null);
  const imageReferences = references.filter((item) => item.type === "image");
  const linkReferences = references.filter((item) => item.type === "link");

  function addFiles(files: FileList | null) {
    if (!files?.length) return;
    const next = Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .map((file) => ({
        id: generateRequirementId(),
        type: "image" as const,
        url: URL.createObjectURL(file),
        name: file.name,
        mimeType: file.type,
        size: file.size,
        file,
      }));
    if (next.length) onReferencesChange([...references, ...next]);
  }

  function addLink(rawValue: string) {
    const url = normalizeReferenceLink(rawValue);
    if (!isValidReferenceLink(url)) return false;
    onReferencesChange([
      ...references,
      { id: generateRequirementId(), type: "link", url, name: url },
    ]);
    return true;
  }

  function removeReference(id: string) {
    const reference = references.find((item) => item.id === id);
    if (reference?.type === "image" && reference.url.startsWith("blob:")) {
      URL.revokeObjectURL(reference.url);
    }
    onReferencesChange(references.filter((item) => item.id !== id));
  }

  return (
    <SectionShell
      eyebrow="References"
      title="Add product references or image or any link references"
    >
      <div className="space-y-3">
        <div className="grid gap-3 md:grid-cols-[10rem_minmax(0,1fr)]">
          <ImageUpload onAdd={addFiles} />
          <div className="grid content-start gap-3">
            <ProductSearch
              selectedCode={productCode}
              onSelect={(product) => onProductChange(product.productCode)}
              onScan={() => setScannerOpen(true)}
            />
            <LinkInput onAdd={addLink} />
          </div>
        </div>

        {productCode || references.length ? (
          <div className="space-y-3 border-t border-border pt-3">
            {productCode ? (
              <ReferenceGroup label="Product">
                <ProductReferenceCard
                  product={productQuery.data}
                  productCode={productCode}
                  loading={productQuery.isLoading}
                  onRemove={() => onProductChange("")}
                />
              </ReferenceGroup>
            ) : null}

            {imageReferences.length ? (
              <ReferenceGroup label="Images">
                <div className="flex flex-wrap gap-1.5">
                  {imageReferences.map((reference) => (
                    <ImageReferenceCard
                      key={reference.id}
                      reference={reference}
                      onRemove={() => removeReference(reference.id)}
                    />
                  ))}
                </div>
              </ReferenceGroup>
            ) : null}

            {linkReferences.length ? (
              <ReferenceGroup label="Links">
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {linkReferences.map((reference) => (
                    <LinkReferenceCard
                      key={reference.id}
                      reference={reference}
                      onRemove={() => removeReference(reference.id)}
                    />
                  ))}
                </div>
              </ReferenceGroup>
            ) : null}
          </div>
        ) : null}
      </div>

      <BarcodeScanDialog
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onDecoded={async (rawCode) => {
          setScannerOpen(false);
          const code = normalizeDecodedId(rawCode);
          if (!code) return;

          try {
            const response = await fetchInventoryProducts({ code, limit: 5 });
            const exactMatch = response.data.find(
              (product) =>
                product.productCode.toUpperCase() === code.toUpperCase(),
            );
            const product = exactMatch ?? response.data[0];
            if (product) onProductChange(product.productCode);
          } catch {
            // The search field remains available if scanning cannot reach inventory.
          }
        }}
      />
    </SectionShell>
  );
}

function ImageUpload({ onAdd }: { onAdd: (files: FileList | null) => void }) {
  return (
    <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border bg-muted/15 px-2 text-center transition-colors hover:border-primary/40 hover:bg-muted/30 focus-within:ring-2 focus-within:ring-ring/30">
      <Upload className="size-4 text-muted-foreground" />
      <span className="text-sm font-medium">Upload images</span>
      <input
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(event) => {
          onAdd(event.target.files);
          event.target.value = "";
        }}
      />
    </label>
  );
}

function ProductSearch({
  selectedCode,
  onSelect,
  onScan,
}: {
  selectedCode: string;
  onSelect: (product: InventoryProduct) => void;
  onScan: () => void;
}) {
  const [value, setValue] = useState(selectedCode);
  const [results, setResults] = useState<InventoryProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const requestRef = useRef(0);

  useEffect(() => setValue(selectedCode), [selectedCode]);

  useEffect(() => {
    const code = value.trim();
    if (!code || code === selectedCode) {
      requestRef.current += 1;
      setResults([]);
      setLoading(false);
      setError(false);
      return;
    }

    const requestId = ++requestRef.current;
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      setError(false);
      try {
        const response = await fetchInventoryProducts({ code, limit: 5 });
        if (requestId === requestRef.current) setResults(response.data);
      } catch {
        if (requestId === requestRef.current) setError(true);
      } finally {
        if (requestId === requestRef.current) setLoading(false);
      }
    }, 400);

    return () => window.clearTimeout(timeout);
  }, [selectedCode, value]);

  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={value}
            aria-label="Search existing product"
            placeholder="Search existing product"
            autoComplete="off"
            onChange={(event) => setValue(event.target.value.toUpperCase())}
            className="h-10 pl-9"
          />
        </div>
        <Button type="button" variant="outline" onClick={onScan} className="h-10 shrink-0">
          <ScanLine className="size-4" />
          <span className="hidden sm:inline">Scan</span>
        </Button>
      </div>

      {loading || error || results.length ? (
        <div className="absolute z-20 mt-1.5 max-h-64 w-full overflow-y-auto rounded-lg border border-border bg-popover p-1 shadow-lg">
          {loading ? (
            <div className="flex h-11 items-center gap-2 px-3 text-sm text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin" /> Searching...
            </div>
          ) : null}
          {error ? <p className="px-3 py-2 text-sm text-destructive">Search unavailable.</p> : null}
          {!loading && !error && results.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">No products found.</p>
          ) : null}
          {results.map((product) => {
            const image = getInventoryPrimaryImage(product);
            return (
              <button
                key={product.id}
                type="button"
                onClick={() => {
                  onSelect(product);
                  setValue(product.productCode);
                  setResults([]);
                }}
                className="flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
              >
                <ProductThumb src={image?.storageKey} alt={image?.altText || product.name} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{product.name || product.productCode}</span>
                  <span className="block truncate text-xs text-muted-foreground">{product.productCode} · {product.color} {product.purity}K</span>
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function LinkInput({ onAdd }: { onAdd: (value: string) => boolean }) {
  const [value, setValue] = useState("");
  function submit() {
    if (onAdd(value)) setValue("");
  }
  return (
    <div className="flex gap-2">
      <div className="relative min-w-0 flex-1">
        <Link2 className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value}
          aria-label="Reference link"
          placeholder="Add a reference link"
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              submit();
            }
          }}
          className="h-10 pl-9"
        />
      </div>
      <Button type="button" variant="outline" className="h-10 shrink-0" disabled={!value.trim()} onClick={submit}>
        <Plus className="size-4" />
        <span className="hidden sm:inline">Add</span>
      </Button>
    </div>
  );
}

function ProductReferenceCard({
  product,
  productCode,
  loading,
  onRemove,
}: {
  product: InventoryProduct | null | undefined;
  productCode: string;
  loading: boolean;
  onRemove: () => void;
}) {
  const image = product ? getInventoryPrimaryImage(product) : undefined;
  return (
    <div className="flex h-14 max-w-sm items-center gap-2 rounded-lg border border-border bg-muted/15 p-1.5">
      {loading ? <LoaderCircle className="mx-3 size-4 animate-spin text-muted-foreground" /> : <ProductThumb src={image?.storageKey} alt={image?.altText || product?.name || productCode} />}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{product?.name || productCode}</p>
        {product ? <p className="truncate text-xs text-muted-foreground">{product.productCode} · {product.color} {product.purity}K</p> : null}
      </div>
      <RemoveButton label="Remove product reference" onClick={onRemove} />
    </div>
  );
}

function ProductThumb({ src, alt }: { src?: string; alt: string }) {
  return src ? (
    // biome-ignore lint/performance/noImgElement: inventory URLs may be remote or temporary.
    <img src={src} alt={alt} className="size-10 shrink-0 rounded-md border border-border object-cover" />
  ) : (
    <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-muted">
      <ImageIcon className="size-4 text-muted-foreground" />
    </div>
  );
}

function ImageReferenceCard({ reference, onRemove }: { reference: ProductReference; onRemove: () => void }) {
  return (
    <div className="group relative size-14 overflow-hidden rounded-md border border-border bg-muted">
      <ImagePreviewDialog src={reference.url} alt={reference.name}>
        <button
          type="button"
          aria-label={`View ${reference.name} in detail`}
          className="group/preview size-full cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        >
          {/* biome-ignore lint/performance/noImgElement: local previews cannot use next/image. */}
          <img src={reference.url} alt="" className="size-full object-cover" />
          <span className="absolute inset-0 flex items-end justify-start bg-black/0 p-1 text-white opacity-0 transition-all group-hover/preview:bg-black/25 group-hover/preview:opacity-100 group-focus-visible/preview:bg-black/25 group-focus-visible/preview:opacity-100">
            <Expand className="size-3.5" />
          </span>
        </button>
      </ImagePreviewDialog>
      <RemoveButton label="Remove image" onClick={onRemove} className="absolute top-0.5 right-0.5 size-6 bg-background/85 opacity-90" />
    </div>
  );
}

function LinkReferenceCard({ reference, onRemove }: { reference: ProductReference; onRemove: () => void }) {
  return (
    <div className="flex h-11 min-w-0 items-center gap-1.5 rounded-md border border-border bg-muted/15 px-1.5">
      <div className="flex size-7 shrink-0 items-center justify-center rounded bg-muted"><Link2 className="size-3.5 text-muted-foreground" /></div>
      <span className="min-w-0 flex-1 truncate text-xs">{reference.name}</span>
      <Button asChild type="button" variant="ghost" size="icon-xs" aria-label="Open reference link">
        <a href={reference.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="size-3.5" /></a>
      </Button>
      <RemoveButton label="Remove link" onClick={onRemove} />
    </div>
  );
}

function ReferenceGroup({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-[4.5rem_minmax(0,1fr)] sm:items-start">
      <p className="pt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function RemoveButton({ label, onClick, className }: { label: string; onClick: () => void; className?: string }) {
  return (
    <Button type="button" variant="ghost" size="icon-xs" aria-label={label} onClick={onClick} className={className}>
      <X className="size-3.5" />
    </Button>
  );
}
