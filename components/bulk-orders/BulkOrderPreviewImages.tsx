"use client";

import { useState } from "react";
import type { BulkOrderListRow } from "@/lib/bulkOrders";
import { BulkThumbnail } from "./BulkItemThumbnail";

export function BulkOrderPreviewImages({ order }: { order: BulkOrderListRow }) {
  const [failed, setFailed] = useState<string[]>([]);
  const images = order.previewImages.filter((src) => !failed.includes(src));
  if (images.length === 0) return null;
  const remaining = order.summary.lines - images.length;

  return (
    <div className="flex shrink-0 items-center -space-x-2">
      {images.map((src, index) => (
        <BulkThumbnail
          key={src}
          src={src}
          alt={`${order.packingListNumber} design ${index + 1}`}
          className="size-9 rounded-lg ring-2 ring-card"
          onError={() => setFailed((current) => [...current, src])}
        />
      ))}
      {remaining > 0 && (
        <span className="relative flex size-9 items-center justify-center rounded-lg border border-border bg-muted text-[11px] font-medium tabular-nums text-muted-foreground ring-2 ring-card">
          +{remaining}
        </span>
      )}
    </div>
  );
}
