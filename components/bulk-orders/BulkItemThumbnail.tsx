"use client";

import { Gem } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { type BulkOrderItem, getBulkItemImageUrls } from "@/lib/bulkOrders";
import { cn } from "@/lib/utils";

export function BulkItemThumbnail({
  item,
  className,
}: {
  item: BulkOrderItem;
  className?: string;
}) {
  const [src] = getBulkItemImageUrls(item);
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
          alt={`${item.vendorDesignNumber} ${item.category}`}
          fill
          sizes="80px"
          className="bg-white object-contain"
          draggable={false}
          unoptimized
          onError={() => setFailed(true)}
        />
      ) : (
        <Gem className="size-4 text-muted-foreground/50" aria-hidden="true" />
      )}
    </div>
  );
}
