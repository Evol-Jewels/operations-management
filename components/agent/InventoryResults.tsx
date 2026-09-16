import { ArrowUpRight, MapPin } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import type { AgentInventoryResult } from "@/types/agent-api";
import { InventoryCardImage } from "./InventoryCardImage";

export function InventoryResults({ result }: { result: AgentInventoryResult }) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        {result.items.length
          ? `${result.offset + 1}–${result.offset + result.items.length} of ${result.total} products`
          : "No matching products"}
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {result.items.map((product) => (
          <Link
            key={product.id}
            href={`/inventory?productCode=${encodeURIComponent(product.code)}`}
            className="group overflow-hidden rounded-xl border bg-card transition-colors hover:border-foreground/25 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <InventoryCardImage
              imageId={product.imageId}
              imageKey={product.imageKey}
              code={product.code}
              className="h-36"
            />
            <div className="p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="truncate font-mono text-xs text-muted-foreground">
                  {product.code}
                </span>
                <ArrowUpRight
                  className="size-4 shrink-0 text-muted-foreground group-hover:text-foreground"
                  aria-hidden="true"
                />
              </div>
              <p className="mt-2 truncate text-sm font-medium">{product.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {[
                  product.purity !== null ? `${product.purity}K` : null,
                  product.color.toLowerCase().replaceAll("_", " "),
                  product.netWeight !== null ? `${product.netWeight} g` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold tabular-nums">
                  {formatCurrency(product.price)}
                </span>
                <Badge variant="secondary" className="text-[10px] font-normal">
                  {product.status === "AVAILABLE" ? "Available" : "Not available"}
                </Badge>
              </div>
              {product.location && (
                <p className="mt-3 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                  <MapPin className="size-3 shrink-0" aria-hidden="true" />
                  {product.location}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
