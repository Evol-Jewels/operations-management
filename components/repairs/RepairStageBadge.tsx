import { Badge } from "@/components/ui/badge";
import type { RepairStage } from "@/lib/repairs";
import { cn } from "@/lib/utils";

const colors: Record<RepairStage, string> = {
  New: "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400",
  "Ready for Repair":
    "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  Dispatched:
    "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-400",
  Vendor:
    "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  Shipping:
    "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-400",
  "At Store":
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  Closed: "border-border bg-muted text-muted-foreground",
  Cancelled: "border-border bg-muted text-muted-foreground",
};
export function RepairStageBadge({ stage }: { stage: RepairStage }) {
  return (
    <Badge variant="outline" className={cn("whitespace-nowrap", colors[stage])}>
      {stage}
    </Badge>
  );
}
