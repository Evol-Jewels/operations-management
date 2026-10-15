"use client";

import { useRef } from "react";
import { ActivityTimeline } from "@/components/order/ActivityTimeline";
import {
  ComposeBox,
  type ComposeBoxSubmitData,
} from "@/components/order/ComposeBox";
import {
  useActivityLogs,
  useComments,
  useCreateComment,
} from "@/hooks/useSourceActivity";
import type { BulkOrderItem } from "@/lib/bulkOrders";
import { uploadCommentMedia } from "@/lib/commentsApi";
import { mergeActivityFeed } from "@/lib/enquiryMappers";

export function BulkItemActivity({ item }: { item: BulkOrderItem }) {
  const commentsQuery = useComments("ORDER", item.orderRefCode);
  const activityLogsQuery = useActivityLogs("ORDER", item.orderRefCode);
  const createComment = useCreateComment("ORDER", item.orderRefCode);
  const endRef = useRef<HTMLDivElement>(null);
  const entries = mergeActivityFeed(commentsQuery.data, activityLogsQuery.data);
  const count = entries.length;

  async function handlePost({ message, attachments }: ComposeBoxSubmitData) {
    const note = message.trim();
    if (!note && attachments.length === 0) return;

    const media = await uploadCommentMedia(attachments);
    await createComment.mutateAsync({ content: note, media });
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
        <ActivityTimeline entries={entries} />
      </div>
      <div className="mx-5 border-t border-dashed border-border" />
      <div className="px-5 pb-5 pt-4">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
          Post an update
        </p>
        <ComposeBox
          onSubmit={handlePost}
          isSubmitting={createComment.isPending}
        />
      </div>
      <div ref={endRef} />
    </section>
  );
}
