"use client";

import { useRef } from "react";
import { ActivityTimeline } from "@/components/order/ActivityTimeline";
import {
  ComposeBox,
  type ComposeBoxSubmitData,
} from "@/components/order/ComposeBox";
import type { BulkOrderItem } from "@/lib/bulkOrders";
import { useBulkOrdersStore } from "@/lib/stores/bulk-orders-store";
import { useCurrentPerson } from "./useBulkItemMove";

function getMediaType(file: File) {
  if (file.type.startsWith("image/")) return "image";
  return file.type.startsWith("video/") ? "video" : "audio";
}

export function BulkItemActivity({
  refCode,
  item,
}: {
  refCode: number;
  item: BulkOrderItem;
}) {
  const addComment = useBulkOrdersStore((state) => state.addComment);
  const actor = useCurrentPerson();
  const endRef = useRef<HTMLDivElement>(null);
  const count = item.activity.length;

  function handlePost({ message, attachments }: ComposeBoxSubmitData) {
    const note = message.trim();
    if (!note && attachments.length === 0) return;

    addComment({
      refCode,
      serialNumber: item.serialNumber,
      actor,
      note,
      media: attachments.map((file) => ({
        type: getMediaType(file),
        url: URL.createObjectURL(file),
        name: file.name,
        mimeType: file.type,
        size: file.size,
      })),
    });
    requestAnimationFrame(() =>
      endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }),
    );
  }

  return (
    <section className="mt-8 overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
          Activity
        </span>
        <span className="text-xs text-muted-foreground">
          {count} {count === 1 ? "event" : "events"}
        </span>
      </div>
      <div className="px-5 pt-5">
        <ActivityTimeline entries={item.activity} />
      </div>
      <div className="mx-5 border-t border-dashed border-border" />
      <div className="px-5 pb-5 pt-4">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
          Post an update
        </p>
        <ComposeBox onSubmit={handlePost} />
      </div>
      <div ref={endRef} />
    </section>
  );
}
