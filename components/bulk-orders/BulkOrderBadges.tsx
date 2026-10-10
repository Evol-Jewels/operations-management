import {
  CircleCheck,
  CircleDashed,
  CircleDot,
  CircleSlash,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { BulkOrderStatus } from "@/lib/bulkOrders";
import { cn } from "@/lib/utils";
import { statusBadgeClass } from "@/lib/workspaceRecords";

const STATUS_ICONS: Record<BulkOrderStatus, LucideIcon> = {
  Pending: CircleDashed,
  "Partially filled": CircleDot,
  Filled: CircleCheck,
  Cancelled: CircleSlash,
};

const STATUS_CLASSES: Record<BulkOrderStatus, string> = {
  Pending: "border-border bg-muted text-muted-foreground",
  "Partially filled":
    "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  Filled:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  Cancelled: "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400",
};

export function StageBadge({ stage }: { stage: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("whitespace-nowrap", statusBadgeClass(stage))}
    >
      {stage}
    </Badge>
  );
}

export function FulfilmentBadge({
  status,
  withIcon = false,
  className,
}: {
  status: BulkOrderStatus;
  withIcon?: boolean;
  className?: string;
}) {
  const Icon = STATUS_ICONS[status];
  return (
    <Badge
      variant="outline"
      className={cn("whitespace-nowrap", STATUS_CLASSES[status], className)}
    >
      {withIcon && <Icon aria-hidden="true" />}
      {status}
    </Badge>
  );
}

export function FulfilmentProgress({
  filled,
  total,
  unit = "pcs",
  className,
}: {
  filled: number;
  total: number;
  unit?: string;
  className?: string;
}) {
  const percent = total ? Math.round((filled / total) * 100) : 0;
  return (
    <div className={cn("min-w-0 space-y-1.5", className)}>
      <div className="flex items-baseline justify-between gap-3 text-xs">
        <span className="font-medium tabular-nums text-foreground">
          {filled}/{total} {unit}
        </span>
        <span className="tabular-nums text-muted-foreground">{percent}%</span>
      </div>
      <Progress
        value={percent}
        aria-label={`${filled} of ${total} ${unit} filled`}
        className={cn(
          "h-1.5 bg-muted",
          percent === 100
            ? "[&>[data-slot=progress-indicator]]:bg-emerald-500"
            : "[&>[data-slot=progress-indicator]]:bg-foreground",
        )}
      />
    </div>
  );
}
