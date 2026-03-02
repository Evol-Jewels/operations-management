"use client";

import { AlertCircle, Gem, Ruler, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Order } from "@/types";

// ─── Spec line primitive ──────────────────────────────────────────────────────

function SpecLine({
  label,
  value,
  mono = false,
}: {
  label: string;
  value?: string | number | null;
  mono?: boolean;
}) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-baseline gap-2">
      <span className="w-28 flex-shrink-0 text-[11px] text-muted-foreground">
        {label}
      </span>
      <span
        className={cn(
          "text-sm font-medium text-foreground",
          mono && "font-mono",
        )}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Section block ────────────────────────────────────────────────────────────

function SpecSection({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3 w-3 text-muted-foreground/60" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
          {title}
        </span>
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface ProductionSpecCardProps {
  order: Order;
}

export function ProductionSpecCard({ order }: ProductionSpecCardProps) {
  // Only show for confirmed orders (not enquiries at early stages)
  // Always render if order has production specs worth showing
  const hasStones = !!(
    order.stoneDescription ||
    order.stoneQuality ||
    order.stoneCut ||
    order.stoneCaratEstimate
  );

  const hasSizing = !!(order.ringSize || order.chainLength || order.bangleSize);

  const metalLine = [
    order.metalType,
    order.metalPurity,
    order.metalWeight ? `${order.metalWeight}g` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const stoneLine = [
    order.stoneDescription,
    order.stoneCut ? `${order.stoneCut} cut` : null,
    order.stoneQuality,
    order.stoneCaratEstimate ? `~${order.stoneCaratEstimate} ct` : null,
  ]
    .filter(Boolean)
    .join(", ");

  const sizingLine = [
    order.ringSize ? `Ring size ${order.ringSize}` : null,
    order.chainLength ? `Chain ${order.chainLength}` : null,
    order.bangleSize ? `Bangle ${order.bangleSize}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {/* Card header */}
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-5 py-3">
        <div className="flex items-center gap-2">
          <Wrench className="h-3.5 w-3.5 text-muted-foreground/60" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            Production Spec
          </span>
        </div>
        {/* Category chip */}
        <span className="rounded-full border border-border bg-background px-2.5 py-0.5 text-xs font-medium text-foreground">
          {order.category}
        </span>
      </div>

      {/* Spec grid */}
      <div className="px-5 py-4">
        <div className="grid gap-5 sm:grid-cols-2">
          {/* Metal */}
          <SpecSection icon={Gem} title="Metal">
            <SpecLine label="Material" value={metalLine} />
            {order.polish && <SpecLine label="Finish" value={order.polish} />}
          </SpecSection>

          {/* Stones */}
          {hasStones && (
            <SpecSection icon={Gem} title="Stones">
              <SpecLine label="Stone" value={stoneLine} />
            </SpecSection>
          )}

          {/* Sizing */}
          {hasSizing && (
            <SpecSection icon={Ruler} title="Sizing">
              <SpecLine label="Size" value={sizingLine} />
            </SpecSection>
          )}

          {/* Certification */}
          <SpecSection icon={Wrench} title="Finishing">
            <SpecLine
              label="Certification"
              value={
                order.certification === "None"
                  ? "No certification required"
                  : order.certification
              }
            />
            <SpecLine
              label="CAD design"
              value={order.cadDesignRequired ? "Required" : "Not required"}
            />
          </SpecSection>
        </div>

        {/* Special instructions — always full-width, highlighted if present */}
        {order.specialInstructions && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3 dark:border-amber-900/50 dark:bg-amber-950/30">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                Special instructions
              </p>
              <p className="text-sm text-amber-900 dark:text-amber-200">
                {order.specialInstructions}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
