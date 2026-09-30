import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { BackendOrderProductType } from "@/types/order-api";

export function OrderTypeBadge({
  productType,
  isRefill,
  className,
}: {
  productType?: BackendOrderProductType;
  isRefill?: boolean;
  className?: string;
}) {
  if (!productType) return null;

  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[11px]",
        isRefill
          ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          : productType === "EXISTING"
            ? "border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300"
            : "border-violet-500/25 bg-violet-500/10 text-violet-700 dark:text-violet-300",
        className,
      )}
    >
      {isRefill
        ? "Stock refill"
        : productType === "EXISTING"
          ? "Stock order"
          : "Custom order"}
    </Badge>
  );
}
