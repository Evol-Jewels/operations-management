import type { ReactNode } from "react";
import { getStatusTone } from "@/lib/statusTones";
import { cn } from "@/lib/utils";
import { StatusDot } from "./KanbanRecordCard";

export function KanbanColumnHeader({
  status,
  label,
  count,
  icon,
  meta,
}: {
  status: string;
  label: string;
  count: number;
  icon?: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 rounded-t-xl border-b px-3 py-2.5",
        getStatusTone(status).surface,
      )}
    >
      <h3 className="flex min-w-0 items-center gap-2 text-xs font-semibold uppercase tracking-wide text-foreground">
        <StatusDot status={status} className="size-2" />
        <span className="truncate">{label}</span>
        {icon}
      </h3>
      <span className="flex shrink-0 items-center gap-1.5 text-[10px] text-muted-foreground">
        {meta}
        <span
          className={cn(
            "flex h-5 min-w-5 items-center justify-center rounded-md border px-1.5 font-semibold tabular-nums",
            count > 0
              ? "border-border bg-background text-foreground"
              : "border-transparent bg-muted text-muted-foreground",
          )}
        >
          {count}
        </span>
      </span>
    </div>
  );
}
