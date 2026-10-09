import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SpecLine({
  label,
  value,
  mono = false,
}: {
  label: string;
  value?: ReactNode;
  mono?: boolean;
}) {
  if (!value && value !== 0) return null;

  return (
    <div className="grid min-w-0 gap-1 sm:grid-cols-[7rem_minmax(0,1fr)]">
      <span className="text-[11px] leading-5 text-muted-foreground">
        {label}
      </span>
      <span
        className={cn(
          "min-w-0 break-words text-sm font-medium leading-5 text-foreground",
          mono && "font-mono",
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function SpecSection({
  icon: Icon,
  title,
  action,
  children,
}: {
  icon: LucideIcon;
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <Icon className="h-3 w-3 text-muted-foreground/60" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            {title}
          </span>
        </div>
        {action}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
