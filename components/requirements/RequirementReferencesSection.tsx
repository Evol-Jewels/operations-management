"use client";

import {
  Expand,
  ExternalLink,
  Link2,
  LoaderCircle,
  Mic,
  Plus,
  Upload,
  Video,
  X,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import { BarcodeScanDialog } from "@/components/calculator/BarcodeScanDialog";
import type { ProductReference } from "@/components/enquiries/enquiry-form-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useInventoryProductByCode } from "@/hooks/useInventoryProducts";
import { normalizeDecodedId } from "@/lib/barcodeScanner";
import { getEnquiryMediaSizeError } from "@/lib/enquiryMedia";
import { getInventoryPrimaryImage } from "@/lib/inventoryProductMapping";
import { isSupportedImageFile } from "@/lib/prepareImageUpload";
import {
  deleteEnquiryMedia,
  saveEnquiryMedia,
} from "@/lib/storage/enquiry-media";
import type { InventoryProduct } from "@/types/inventory-api";
import { AudioPreviewPlayer } from "./AudioPreviewPlayer";
import { ImagePreviewDialog } from "./ImagePreviewDialog";
import {
  ProductSearch,
  ProductThumb,
  type ReferenceProduct,
  searchInventoryProducts,
} from "./ProductReferenceSearch";
import { SectionShell } from "./RequirementFields";
import {
  type RecordingKind,
  RequirementMediaRecorder,
} from "./RequirementMediaRecorder";
import {
  formatFileSize,
  generateRequirementId,
  isValidReferenceLink,
  normalizeReferenceLink,
} from "./requirement-form-utils";

export function RequirementReferencesSection({
  productCode,
  references,
  onProductChange,
  onReferencesChange,
  searchProducts = searchInventoryProducts,
  localOnly = false,
  productField,
}: {
  productCode: string;
  references: ProductReference[];
  onProductChange: (productCode: string) => void;
  onReferencesChange: (references: ProductReference[]) => void;
  searchProducts?: (query: string) => Promise<ReferenceProduct[]>;
  localOnly?: boolean;
  productField?: ReactNode;
}) {
  const [scannerOpen, setScannerOpen] = useState(false);
  const [recorderKind, setRecorderKind] = useState<RecordingKind | null>(null);
  const [mediaError, setMediaError] = useState("");
  const productQuery = useInventoryProductByCode(
    localOnly ? null : productCode || null,
  );
  const imageReferences = references.filter((item) => item.type === "image");
  const recordedReferences = references.filter(
    (item) => item.type === "video" || item.type === "audio",
  );
  const linkReferences = references.filter((item) => item.type === "link");

  function addFiles(files: FileList | null) {
    if (!files?.length) return;
    setMediaError("");
    const next: ProductReference[] = [];
    for (const file of Array.from(files)) {
      const isVideo = localOnly && file.type.startsWith("video/");
      if (!isVideo && !isSupportedImageFile(file)) continue;
      const sizeError = isVideo
        ? getEnquiryMediaSizeError(file, "video")
        : localOnly && file.size > 10 * 1024 * 1024
          ? "Choose images up to 10 MB each."
          : null;
      if (sizeError) {
        setMediaError(sizeError);
        continue;
      }
      next.push({
        id: generateRequirementId(),
        type: isVideo ? "video" : "image",
        url: URL.createObjectURL(file),
        name: file.name,
        mimeType: file.type,
        size: file.size,
        file,
      });
    }
    if (next.length) onReferencesChange([...references, ...next]);
  }

  async function addRecording(
    file: File,
    kind: RecordingKind,
    durationSeconds: number,
  ) {
    const id = generateRequirementId();
    let mediaId: string | undefined;
    if (!localOnly)
      try {
        const stored = await saveEnquiryMedia({
          enquiryId: "new-enquiry-v2-draft",
          productId: productCode || "custom-requirement",
          file,
          type: kind,
        });
        mediaId = stored.id;
      } catch {
        // The recording remains available for this session if device storage fails.
      }

    onReferencesChange([
      ...references,
      {
        id,
        type: kind,
        url: URL.createObjectURL(file),
        name: file.name,
        mimeType: file.type,
        size: file.size,
        durationSeconds,
        mediaId,
        file,
      },
    ]);
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
    if (
      reference &&
      reference.type !== "link" &&
      reference.url.startsWith("blob:")
    ) {
      URL.revokeObjectURL(reference.url);
    }
    if (reference?.mediaId) void deleteEnquiryMedia(reference.mediaId);
    onReferencesChange(references.filter((item) => item.id !== id));
  }

  return (
    <SectionShell
      eyebrow="References"
      title="Add product references or image or any link references"
    >
      <div className="space-y-3">
        <div className="grid gap-3 md:grid-cols-[10rem_minmax(0,1fr)]">
          <ImageUpload onAdd={addFiles} acceptVideos={localOnly} />
          <div className="grid content-start gap-3">
            {productField ?? (
              <ProductSearch
                selectedCode={productCode}
                onSelect={(product) => onProductChange(product.productCode)}
                onScan={() => setScannerOpen(true)}
                searchProducts={searchProducts}
                onInputChange={localOnly ? onProductChange : undefined}
              />
            )}
            <LinkInput onAdd={addLink} />
          </div>
        </div>

        {mediaError && (
          <p role="alert" className="text-xs text-destructive">
            {mediaError}
          </p>
        )}
        <div className="grid gap-2 md:grid-cols-2">
          <RecordButton kind="video" onClick={() => setRecorderKind("video")} />
          <RecordButton kind="audio" onClick={() => setRecorderKind("audio")} />
        </div>

        {recordedReferences.length ? (
          <p className="text-xs text-muted-foreground">
            {localOnly
              ? "Media is saved locally when you create the repair."
              : "Recordings are uploaded when you create the enquiry."}
          </p>
        ) : null}

        {(!productField && productCode) || references.length ? (
          <div className="space-y-3 border-t border-border pt-3">
            {!productField && productCode ? (
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

            {recordedReferences.length ? (
              <ReferenceGroup label="Recordings">
                <div className="grid items-start gap-3 xl:grid-cols-2">
                  {recordedReferences.map((reference) => (
                    <RecordedMediaCard
                      key={reference.id}
                      reference={reference}
                      onRemove={() => removeReference(reference.id)}
                      localOnly={localOnly}
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

      {!productField && (
        <BarcodeScanDialog
          open={scannerOpen}
          onOpenChange={setScannerOpen}
          onDecoded={async (rawCode) => {
            setScannerOpen(false);
            const code = normalizeDecodedId(rawCode);
            if (!code) return;

            try {
              const products = await searchProducts(code);
              const exactMatch = products.find(
                (product) =>
                  product.productCode.toUpperCase() === code.toUpperCase(),
              );
              const product = exactMatch ?? products[0];
              if (product) onProductChange(product.productCode);
              else if (localOnly) onProductChange(code);
            } catch {
              // The search field remains available if scanning cannot reach inventory.
            }
          }}
        />
      )}

      {recorderKind ? (
        <RequirementMediaRecorder
          kind={recorderKind}
          open
          onOpenChange={(open) => {
            if (!open) setRecorderKind(null);
          }}
          onRecorded={(file, durationSeconds) =>
            addRecording(file, recorderKind, durationSeconds)
          }
        />
      ) : null}
    </SectionShell>
  );
}

function RecordButton({
  kind,
  onClick,
}: {
  kind: RecordingKind;
  onClick: () => void;
}) {
  const isVideo = kind === "video";
  const Icon = isVideo ? Video : Mic;
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-14 cursor-pointer items-center gap-3 rounded-lg border border-border bg-muted/15 px-3 text-left transition-colors hover:border-primary/40 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-background shadow-xs">
        <Icon className="size-4 text-muted-foreground" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-foreground">
          Record {kind}
        </span>
        <span className="block text-xs text-muted-foreground">
          {isVideo
            ? "Camera + microphone · max 10 MB"
            : "Microphone only · max 3 MB"}
        </span>
      </span>
    </button>
  );
}

function ImageUpload({
  onAdd,
  acceptVideos = false,
}: {
  onAdd: (files: FileList | null) => void;
  acceptVideos?: boolean;
}) {
  return (
    <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border bg-muted/15 px-2 text-center transition-colors hover:border-primary/40 hover:bg-muted/30 focus-within:ring-2 focus-within:ring-ring/30">
      <Upload className="size-4 text-muted-foreground" />
      <span className="text-sm font-medium">
        {acceptVideos ? "Upload media" : "Upload images"}
      </span>
      <input
        type="file"
        accept={acceptVideos ? "image/*,video/*" : "image/*"}
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
      <Button
        type="button"
        variant="outline"
        className="h-10 shrink-0"
        disabled={!value.trim()}
        onClick={submit}
      >
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
      {loading ? (
        <LoaderCircle className="mx-3 size-4 animate-spin text-muted-foreground" />
      ) : (
        <ProductThumb
          src={image?.storageKey}
          alt={image?.altText || product?.name || productCode}
        />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {product?.name || productCode}
        </p>
        {product ? (
          <p className="truncate text-xs text-muted-foreground">
            {product.productCode} · {product.color} {product.purity}K
          </p>
        ) : null}
      </div>
      <RemoveButton label="Remove product reference" onClick={onRemove} />
    </div>
  );
}

export function ImageReferenceCard({
  reference,
  onRemove,
}: {
  reference: ProductReference;
  onRemove?: () => void;
}) {
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
      {onRemove && (
        <RemoveButton
          label="Remove image"
          onClick={onRemove}
          className="absolute top-0.5 right-0.5 size-6 bg-background/85 opacity-90"
        />
      )}
    </div>
  );
}

export function RecordedMediaCard({
  reference,
  onRemove,
  localOnly = false,
}: {
  reference: ProductReference;
  onRemove?: () => void;
  localOnly?: boolean;
}) {
  const isVideo = reference.type === "video";
  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-border bg-muted/15 shadow-xs">
      {isVideo ? (
        <video
          src={reference.url}
          controls
          playsInline
          preload="metadata"
          className="aspect-video w-full bg-black object-contain"
        >
          <track kind="captions" />
        </video>
      ) : (
        <div className="p-2.5 pb-1 sm:p-3 sm:pb-1">
          <AudioPreviewPlayer
            src={reference.url}
            durationSeconds={reference.durationSeconds}
            className="border-0 bg-muted/35"
          />
        </div>
      )}
      <div className="flex min-w-0 items-center gap-2 px-2.5 py-2 sm:px-3 sm:py-2.5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
          {isVideo ? (
            <Video className="size-4 text-muted-foreground" />
          ) : (
            <Mic className="size-4 text-muted-foreground" />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-medium">
            {isVideo ? "Video recording" : "Audio recording"}
          </span>
          <span className="block truncate text-[10px] leading-4 text-muted-foreground">
            {reference.durationSeconds
              ? `${formatRecordingDuration(reference.durationSeconds)} · `
              : ""}
            {formatFileSize(reference.size)} ·{" "}
            {localOnly ? "Local media" : "Ready to upload"}
          </span>
        </span>
        {onRemove && (
          <RemoveButton
            label={`Remove ${reference.type} recording`}
            onClick={onRemove}
            className="size-10 shrink-0"
          />
        )}
      </div>
    </div>
  );
}

function formatRecordingDuration(value: number) {
  const minutes = Math.floor(value / 60);
  const seconds = Math.max(0, Math.round(value)) % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function LinkReferenceCard({
  reference,
  onRemove,
}: {
  reference: ProductReference;
  onRemove?: () => void;
}) {
  return (
    <div className="flex h-11 min-w-0 items-center gap-1.5 rounded-md border border-border bg-muted/15 px-1.5">
      <div className="flex size-7 shrink-0 items-center justify-center rounded bg-muted">
        <Link2 className="size-3.5 text-muted-foreground" />
      </div>
      <span className="min-w-0 flex-1 truncate text-xs">{reference.name}</span>
      <Button
        asChild
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label="Open reference link"
      >
        <a href={reference.url} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="size-3.5" />
        </a>
      </Button>
      {onRemove && <RemoveButton label="Remove link" onClick={onRemove} />}
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
    <div className="grid gap-2 lg:grid-cols-[6rem_minmax(0,1fr)] lg:items-start">
      <p className="pt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function RemoveButton({
  label,
  onClick,
  className,
}: {
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      aria-label={label}
      onClick={onClick}
      className={className}
    >
      <X className="size-3.5" />
    </Button>
  );
}
