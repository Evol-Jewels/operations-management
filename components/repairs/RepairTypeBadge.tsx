import { Badge } from "@/components/ui/badge";
import type { RepairDraft } from "@/lib/repairs";
import { cn } from "@/lib/utils";

export function RepairTypeBadge({
  productType,
  className,
}: {
  productType: RepairDraft["productType"];
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[11px]",
        productType === "Stock"
          ? "border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300"
          : "border-violet-500/25 bg-violet-500/10 text-violet-700 dark:text-violet-300",
        className,
      )}
    >
      {productType} repair
    </Badge>
  );
}
