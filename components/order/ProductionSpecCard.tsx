"use client";

import { AlertCircle, CalendarDays, Gem, UserRound, Wrench } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import type { Order } from "@/types";

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
    <div className="space-y-2.5">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3 w-3 text-muted-foreground/60" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
          {title}
        </span>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

interface ProductionSpecCardProps {
  order: Order;
}

export function ProductionSpecCard({ order }: ProductionSpecCardProps) {
  const customProduct = order.customProducts?.[0];
  const customDetails = customProduct?.details;

  const metalLine = [
    order.metalType,
    order.metalPurity,
    order.metalWeight ? `${order.metalWeight}g net` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const customLine = [
    customDetails?.orderType,
    customDetails?.metalColor,
    customDetails?.polish,
  ]
    .filter(Boolean)
    .join(" · ");

  const notes =
    customDetails?.specialNotes ||
    customProduct?.notes ||
    order.specialInstructions ||
    order.customerNotes;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div className="flex items-center gap-2">
          <Wrench className="h-3.5 w-3.5 text-muted-foreground/60" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            Order Overview
          </span>
        </div>
        <span className="rounded-full border border-border bg-background px-2.5 py-0.5 text-xs font-medium text-foreground">
          {order.category}
        </span>
      </div>

      <div className="px-5 py-4">
        <div className="grid gap-6 sm:grid-cols-2">
          <SpecSection icon={CalendarDays} title="Delivery">
            <SpecLine
              label="Due date"
              value={order.deliveryDate ? formatDate(order.deliveryDate) : null}
            />
            <SpecLine
              label="Certification"
              value={
                order.certification === "None"
                  ? "No certification"
                  : order.certification
              }
            />
          </SpecSection>

          <SpecSection icon={UserRound} title="People">
            <SpecLine label="Salesperson" value={order.salespersonName} />
            <SpecLine label="Customer" value={order.customerName} />
            <SpecLine label="Vendor" value={order.vendorName} />
          </SpecSection>

          <SpecSection icon={Gem} title="Product">
            <SpecLine label="Category" value={order.category} />
            <SpecLine label="Metal" value={metalLine} />
          </SpecSection>

          <SpecSection icon={Wrench} title="Custom Details">
            <SpecLine label="Requirement" value={customLine} />
            <SpecLine label="Setting" value={customDetails?.settingType} />
            <SpecLine label="Finding" value={customDetails?.findingType} />
            <SpecLine label="Budget" value={customDetails?.budgetRange} />
            <SpecLine
              label="CAD design"
              value={order.cadDesignRequired ? "Required" : "Not required"}
            />
          </SpecSection>
        </div>

        {notes && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3.5 py-3">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                Notes
              </p>
              <p className="text-sm leading-5 text-amber-900 dark:text-amber-200">
                {notes}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
