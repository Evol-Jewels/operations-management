"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const FLOW_SECONDARY_ACTION = "h-11 md:h-9";
export const FLOW_PRIMARY_ACTION =
  "ml-auto h-11 min-w-0 flex-1 px-5 sm:flex-none md:h-9";

export function CreateFlowLayout({
  actions,
  children,
  className,
}: {
  actions: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-3xl flex-col",
        "min-h-[calc(100svh-var(--mobile-top-h,0px)-2.25rem)] sm:min-h-[calc(100svh-var(--mobile-top-h,0px)-2.75rem)] md:min-h-[calc(100svh-3rem)]",
        className,
      )}
    >
      <div className="flex-1 pb-6">{children}</div>
      <div className="print-hide sticky bottom-0 z-30 -mx-4 -mb-5 border-t border-border bg-background/95 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] backdrop-blur sm:-mx-6 sm:px-6 md:-mb-6">
        <div className="flex items-center gap-2 pr-16 sm:pr-40 min-[1440px]:pr-0!">
          {actions}
        </div>
      </div>
    </div>
  );
}

export function CreateFlowProgress({
  step,
  total,
  label,
  className,
}: {
  step: number;
  total: number;
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
        Step {step} of {total}
        {label ? <span className="text-foreground/70"> · {label}</span> : null}
      </p>
      <div className="flex gap-1" aria-hidden="true">
        {Array.from({ length: total }, (_, index) => (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length step segments
            key={index}
            className={cn(
              "h-1 flex-1 rounded-full bg-muted transition-colors duration-300",
              index < step && "bg-primary",
            )}
          />
        ))}
      </div>
    </div>
  );
}
