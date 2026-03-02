import { cn } from "@/lib/utils";
import type { UrgencyLevel } from "@/types";

interface UrgencyDotProps {
  level: UrgencyLevel;
  className?: string;
}

const CONFIG: Record<UrgencyLevel, { color: string; label: string }> = {
  overdue: { color: "bg-red-500", label: "Overdue" },
  "due-soon": { color: "bg-amber-400", label: "Due soon" },
  "on-track": { color: "bg-emerald-500", label: "On track" },
  none: { color: "bg-muted-foreground/30", label: "No date" },
};

export function UrgencyDot({ level, className }: UrgencyDotProps) {
  const { color, label } = CONFIG[level];
  return (
    <span
      title={label}
      aria-label={label}
      className={cn(
        "inline-block h-2 w-2 flex-shrink-0 rounded-full",
        color,
        className,
      )}
    />
  );
}
