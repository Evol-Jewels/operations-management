"use client";

import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import type { UrgencyLevel } from "@/types";

export function WorkspaceCard({
  urgency = "none",
  draggableCard = false,
  className,
  children,
  ...props
}: ComponentProps<"button"> & {
  urgency?: UrgencyLevel;
  draggableCard?: boolean;
}) {
  const color =
    urgency === "overdue"
      ? "border-l-red-500"
      : urgency === "due-soon"
        ? "border-l-amber-400"
        : urgency === "on-track"
          ? "border-l-emerald-500"
          : "border-l-muted-foreground/30";
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "group relative w-full rounded-xl border border-l-[3px] bg-card p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-ring",
        draggableCard ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
        color,
        className,
      )}
    >
      <div
        className={cn(
          "absolute left-0 top-3 bottom-3 w-[3px] rounded-full",
          urgency === "overdue"
            ? "bg-red-500"
            : urgency === "due-soon"
              ? "bg-amber-400"
              : urgency === "on-track"
                ? "bg-emerald-500"
                : "bg-muted-foreground/30",
        )}
      />
      {children}
    </button>
  );
}
