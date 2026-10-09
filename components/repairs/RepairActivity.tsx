"use client";

import { useEffect, useRef, useState } from "react";
import { ActivityTimeline } from "@/components/order/ActivityTimeline";
import {
  ComposeBox,
  type ComposeBoxSubmitData,
} from "@/components/order/ComposeBox";
import type { Repair, RepairComment } from "@/lib/repairs";
import type { ActivityEntry } from "@/types";

export function RepairActivity({
  repair,
  onPost,
  busy,
}: {
  repair: Repair;
  onPost: (
    comment: Pick<RepairComment, "message" | "attachments">,
  ) => Promise<void>;
  busy: boolean;
}) {
  const [comments, setComments] = useState<ActivityEntry[]>([]);
  const [posting, setPosting] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const urls: string[] = [];
    const entries: ActivityEntry[] = (repair.comments ?? []).map((comment) => ({
      id: comment.id,
      orderId: repair.id,
      postedBy: comment.author,
      timestamp: comment.timestamp,
      type: "comment",
      note: comment.message,
      media: comment.attachments.map((attachment) => {
        const url = attachment.file
          ? URL.createObjectURL(attachment.file)
          : (attachment.url ?? "");
        if (attachment.file) urls.push(url);
        return {
          type: attachment.type,
          url,
          name: attachment.name,
          mimeType: attachment.mimeType ?? attachment.file?.type,
          size: attachment.size ?? attachment.file?.size,
        };
      }),
    }));
    setComments(entries);
    return () => {
      for (const url of urls) URL.revokeObjectURL(url);
    };
  }, [repair.comments, repair.id]);

  const activity: ActivityEntry[] = repair.history.map((entry, position) => ({
    id: `${entry.timestamp}-${position}`,
    orderId: repair.id,
    postedBy: "System",
    timestamp: entry.timestamp,
    type:
      position === 0
        ? "order_created"
        : entry.message
          ? "system_note"
          : "stage_change",
    note:
      entry.message ??
      (position === 0
        ? "Repair created"
        : `Moved from ${repair.history[position - 1].stage} to ${entry.stage}`),
  }));
  activity.push(...comments);

  async function postUpdate({ message, attachments }: ComposeBoxSubmitData) {
    if (busy || posting)
      throw new Error("Wait for the current update to finish.");
    setPosting(true);
    try {
      await onPost({
        message,
        attachments: attachments.map((file) => ({
          id: crypto.randomUUID(),
          file,
          name: file.name,
          type: file.type.startsWith("image/")
            ? "image"
            : file.type.startsWith("video/")
              ? "video"
              : "audio",
        })),
      });
      requestAnimationFrame(() =>
        endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }),
      );
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="mt-8 overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
          Activity
        </span>
        <span className="text-xs text-muted-foreground">
          {activity.length} {activity.length === 1 ? "event" : "events"}
        </span>
      </div>
      <div className="px-5 pt-5">
        <ActivityTimeline entries={activity} />
      </div>
      <div className="mx-5 border-t border-dashed border-border" />
      <div className="px-5 pb-5 pt-4">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
          Post an update
        </p>
        <ComposeBox onSubmit={postUpdate} isSubmitting={busy || posting} />
      </div>
      <div ref={endRef} />
    </div>
  );
}
