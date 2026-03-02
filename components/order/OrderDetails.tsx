"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { Order } from "@/types";

// ─── Primitives ───────────────────────────────────────────────────────────────

function DetailRow({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
      <dt className="w-full text-xs text-muted-foreground sm:w-36 sm:flex-shrink-0">
        {label}
      </dt>
      <dd className="text-sm text-foreground">{value}</dd>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
        {title}
      </h3>
      <dl className="space-y-2.5">{children}</dl>
    </div>
  );
}

// ─── Actors strip — always visible even when collapsed ───────────────────────

function ActorsStrip({ order }: { order: Order }) {
  const actors = [
    { label: "Salesperson", value: order.salespersonName },
    { label: "Vendor", value: order.vendorName },
    { label: "Customer", value: order.customerName },
  ].filter((a) => a.value);

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
      {actors.map(({ label, value }) => (
        <div key={label} className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{label}</span>
          <span className="text-sm font-medium text-foreground">{value}</span>
        </div>
      ))}
      {order.deliveryDate && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Delivery</span>
          <span className="text-sm font-medium text-foreground">
            {formatDate(order.deliveryDate)}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface OrderDetailsProps {
  order: Order;
  defaultOpen?: boolean;
}

export function OrderDetails({
  order,
  defaultOpen = false,
}: OrderDetailsProps) {
  const [open, setOpen] = useState(defaultOpen);

  const stoneSummary = [
    order.stoneDescription,
    order.stoneCut && `${order.stoneCut} cut`,
    order.stoneQuality,
    order.stoneCaratEstimate && `~${order.stoneCaratEstimate} ct`,
  ]
    .filter(Boolean)
    .join(", ");

  const metalSummary = [
    order.metalType,
    order.metalPurity,
    order.metalWeight && `${order.metalWeight}g`,
  ]
    .filter(Boolean)
    .join(" · ");

  const sizeSummary = [
    order.ringSize && `Ring: ${order.ringSize}`,
    order.chainLength && `Chain: ${order.chainLength}`,
    order.bangleSize && `Bangle: ${order.bangleSize}`,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {/* Header — always visible, clickable to expand/collapse */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/30"
      >
        <div className="min-w-0 flex-1">
          <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            Order Details
          </p>
          {/* Actors strip always visible */}
          <ActorsStrip order={order} />
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {/* Expandable content */}
      {open && (
        <div className="border-t border-border px-5 pb-5 pt-4">
          <div className="grid gap-7 sm:grid-cols-2">
            <Section title="Customer">
              <DetailRow label="Name" value={order.customerName} />
              <DetailRow label="Phone" value={order.customerPhone} />
              <DetailRow label="Email" value={order.customerEmail} />
              <DetailRow label="Address" value={order.customerAddress} />
            </Section>

            <Section title="Order">
              <DetailRow label="Salesperson" value={order.salespersonName} />
              <DetailRow label="Vendor" value={order.vendorName} />
              <DetailRow
                label="Delivery date"
                value={
                  order.deliveryDate
                    ? formatDate(order.deliveryDate)
                    : undefined
                }
              />
              <DetailRow
                label="Certification"
                value={
                  order.certification !== "None"
                    ? order.certification
                    : "No certification"
                }
              />
              <DetailRow
                label="CAD design"
                value={order.cadDesignRequired ? "Required" : "Not required"}
              />
            </Section>

            <Section title="Product">
              <DetailRow label="Category" value={order.category} />
              <DetailRow label="Metal" value={metalSummary || undefined} />
              <DetailRow label="Polish" value={order.polish} />
              {stoneSummary && (
                <DetailRow label="Stones" value={stoneSummary} />
              )}
              {sizeSummary && <DetailRow label="Sizing" value={sizeSummary} />}
            </Section>

            <Section title="Financials">
              <DetailRow
                label="Total estimate"
                value={
                  order.totalEstimate
                    ? formatCurrency(order.totalEstimate)
                    : undefined
                }
              />
              <DetailRow
                label="Advance paid"
                value={
                  order.advancePaid
                    ? formatCurrency(order.advancePaid)
                    : undefined
                }
              />
              {order.totalEstimate && order.advancePaid && (
                <DetailRow
                  label="Balance due"
                  value={formatCurrency(
                    order.totalEstimate - order.advancePaid,
                  )}
                />
              )}
              {order.budgetRange && (
                <DetailRow label="Budget range" value={order.budgetRange} />
              )}
              {order.occasion && (
                <DetailRow label="Occasion" value={order.occasion} />
              )}
            </Section>

            {(order.specialInstructions || order.timelineNotes) && (
              <div className="sm:col-span-2">
                <Section title="Notes & Instructions">
                  <DetailRow
                    label="Special instructions"
                    value={order.specialInstructions}
                  />
                  <DetailRow
                    label="Timeline notes"
                    value={order.timelineNotes}
                  />
                </Section>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
