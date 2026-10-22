"use client";

import { Diamond, Download, RefreshCw } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  getInventoryMediaUrl,
  isInventoryMediaProxyUrl,
} from "@/lib/inventory-media";
import type { getInventoryPrimaryImage } from "@/lib/inventoryProductMapping";
import { cn } from "@/lib/utils";

type InventoryImage = ReturnType<typeof getInventoryPrimaryImage>;

function getImageExtension(blob: Blob, imageUrl: string) {
  const typeExtension = blob.type.split("/")[1]?.split("+")[0];
  if (typeExtension) return typeExtension === "jpeg" ? "jpg" : typeExtension;

  const urlExtension = imageUrl.match(/\.([a-z0-9]+)(?:[?#]|$)/i)?.[1];
  return urlExtension?.toLowerCase() || "jpg";
}

async function downloadInventoryImage(imageUrl: string, productCode: string) {
  const response = await fetch(imageUrl, {
    credentials: isInventoryMediaProxyUrl(imageUrl) ? "include" : "same-origin",
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Image request failed");

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const safeProductCode =
    productCode.trim().replace(/[^a-z0-9_-]+/gi, "-") || "product";

  link.href = objectUrl;
  link.download = `${safeProductCode}.${getImageExtension(blob, imageUrl)}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

export function InventoryImageDownloadButton({
  imageUrl,
  productCode,
  className,
}: {
  imageUrl: string;
  productCode: string;
  className?: string;
}) {
  const [isDownloading, setIsDownloading] = useState(false);

  async function handleDownload() {
    setIsDownloading(true);
    try {
      await downloadInventoryImage(imageUrl, productCode);
      toast.success("Product image downloaded");
    } catch {
      toast.error("Unable to download the product image");
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <Button
      type="button"
      size="icon"
      variant="secondary"
      disabled={isDownloading}
      aria-label={`Download image for ${productCode}`}
      onClick={(event) => {
        event.stopPropagation();
        void handleDownload();
      }}
      className={cn(
        "absolute z-20 cursor-pointer border border-border/70 bg-background/90 shadow-sm backdrop-blur-sm transition-opacity duration-200 hover:bg-background focus-visible:opacity-100",
        className,
      )}
    >
      {isDownloading ? (
        <RefreshCw className="size-4 animate-spin" />
      ) : (
        <Download className="size-4" />
      )}
    </Button>
  );
}

export function InventoryProductImage({
  image,
  sizes,
  className,
  showLabel = false,
}: {
  image: InventoryImage;
  sizes: string;
  className: string;
  showLabel?: boolean;
}) {
  const imageUrl = image ? getInventoryMediaUrl(image) : null;
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const hasError = Boolean(imageUrl && failedUrl === imageUrl);

  if (!image || !imageUrl || hasError) {
    return (
      <div
        role="img"
        aria-label="Product image unavailable"
        className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_35%,color-mix(in_oklab,var(--muted-foreground)_10%,transparent),transparent_58%)] text-muted-foreground"
      >
        <div className="absolute inset-3 rounded-[inherit] border border-dashed border-current/10" />
        <div className="relative flex size-11 items-center justify-center rounded-full border border-current/15 bg-background/55 shadow-sm backdrop-blur-sm">
          <Diamond className="size-5 opacity-45" strokeWidth={1.5} />
        </div>
        {showLabel ? (
          <span className="relative mt-3 text-[10px] font-medium uppercase tracking-[0.16em] opacity-55">
            Image unavailable
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <Image
      src={imageUrl}
      alt={image.altText}
      fill
      unoptimized
      sizes={sizes}
      className={className}
      onError={() => setFailedUrl(imageUrl)}
    />
  );
}
