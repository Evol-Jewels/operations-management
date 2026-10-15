"use client";

import { Gem } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import type { BulkOrderItem } from "@/lib/bulkOrders";
import { cn } from "@/lib/utils";

export function BulkThumbnail({
  src,
  alt,
  className,
  onError,
}: {
  src?: string;
  alt: string;
  className?: string;
  onError?: () => void;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <div
      className={cn(
        "relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted/40",
        className,
      )}
    >
      {src && !failed ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes="80px"
          className="bg-white object-contain"
          draggable={false}
          unoptimized
          onError={() => {
            setFailed(true);
            onError?.();
          }}
        />
      ) : (
        <Gem className="size-4 text-muted-foreground/50" aria-hidden="true" />
      )}
    </div>
  );
}

export function BulkItemThumbnail({
  item,
  className,
}: {
  item: BulkOrderItem;
  className?: string;
}) {
  return (
    <BulkThumbnail
      src={item.imageUrls[0]}
      alt={`${item.vendorDesignNumber} ${item.category}`}
      className={className}
    />
  );
}
