import { ArrowRight, FileText, MessageSquare, Paperclip } from "lucide-react";
import { cn, formatDateTime } from "@/lib/utils";
import type { ActivityEntry } from "@/types";

interface ActivityFeedProps {
  entries: ActivityEntry[];
}

function EntryIcon({ type }: { type: ActivityEntry["type"] }) {
  if (type === "stage_change") {
    return (
      <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-foreground bg-foreground text-background">
        <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
      </div>
    );
  }
  if (type === "file_upload") {
    return (
      <div className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background text-muted-foreground">
        <Paperclip className="h-3.5 w-3.5" />
      </div>
    );
  }
  return (
    <div className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background text-muted-foreground">
      <MessageSquare className="h-3.5 w-3.5" />
    </div>
  );
}

function FileAttachment({
  file,
}: {
  file: NonNullable<ActivityEntry["file"]>;
}) {
  return (
    <div className="mt-2 inline-flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
      <FileText className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
      <span className="text-foreground">{file.filename}</span>
      <span className="text-xs text-muted-foreground uppercase">
        {file.fileType}
      </span>
    </div>
  );
}

export function ActivityFeed({ entries }: ActivityFeedProps) {
  if (entries.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        No activity yet.
      </div>
    );
  }

  // Show newest first
  const sorted = [...entries].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  return (
    <div className="space-y-0">
      {sorted.map((entry, i) => (
        <div key={entry.id} className="relative flex gap-4">
          {/* Vertical connector line */}
          {i < sorted.length - 1 && (
            <div className="absolute left-[13px] top-8 bottom-0 w-px bg-border" />
          )}

          {/* Icon */}
          <div className="relative z-10 flex-shrink-0 pt-1">
            <EntryIcon type={entry.type} />
          </div>

          {/* Content */}
          <div className={cn("flex-1 pb-6", i === sorted.length - 1 && "pb-0")}>
            {/* Header row */}
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="text-sm font-medium text-foreground">
                {entry.postedBy}
              </span>
              {entry.type === "stage_change" && entry.newStage && (
                <>
                  <span className="text-xs text-muted-foreground">
                    moved order to
                  </span>
                  <span className="inline-flex items-center rounded-full border border-foreground/20 bg-foreground/5 px-2 py-0.5 text-xs font-medium text-foreground">
                    {entry.newStage}
                  </span>
                </>
              )}
              {entry.type === "note" && (
                <span className="text-xs text-muted-foreground">
                  added a note
                </span>
              )}
              {entry.type === "file_upload" && (
                <span className="text-xs text-muted-foreground">
                  uploaded a file
                </span>
              )}
              <span className="ml-auto text-xs text-muted-foreground/70 tabular-nums">
                {formatDateTime(entry.timestamp)}
              </span>
            </div>

            {/* Note text */}
            {entry.note && (
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {entry.note}
              </p>
            )}

            {/* File */}
            {entry.file && <FileAttachment file={entry.file} />}
          </div>
        </div>
      ))}
    </div>
  );
}
