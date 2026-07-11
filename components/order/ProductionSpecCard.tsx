"use client";

import { AlertCircle, UserRound, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Order } from "@/types";

function SpecLine({
  label,
  value,
  mono = false,
}: {
  label: string;
  value?: React.ReactNode;
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

function BadgeGroup({
  items,
}: {
  items: Array<{ label?: string; value?: string | number | null }>;
}) {
  const visibleItems = items.filter((item) => item.value || item.value === 0);

  if (visibleItems.length === 0) return null;

  return (
    <div className="flex min-w-0 flex-wrap gap-1.5">
      {visibleItems.map((item) => (
        <Badge
          key={`${item.label ?? "value"}-${item.value}`}
          variant="outline"
          className="max-w-full whitespace-normal break-words rounded-md px-2 py-0.5 text-left"
        >
          {item.label ? `${item.label}: ${item.value}` : item.value}
        </Badge>
      ))}
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

  const notes =
    customDetails?.specialNotes ||
    customProduct?.notes ||
    order.specialInstructions ||
    order.customerNotes;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="px-5 py-4">
        <div className="space-y-6">
          <SpecSection icon={Wrench} title="Overview">
            <SpecLine
              label="Category"
              value={<Badge variant="outline">{order.category}</Badge>}
            />
            <SpecLine
              label="Metal"
              value={
                <BadgeGroup
                  items={[
                    { label: "Metal", value: order.metalType },
                    { label: "Purity", value: order.metalPurity },
                    {
                      label: "Net weight",
                      value: order.metalWeight
                        ? `${order.metalWeight}g`
                        : undefined,
                    },
                  ]}
                />
              }
            />
            <SpecLine
              label="Requirement"
              value={
                <BadgeGroup
                  items={[
                    { label: "Type", value: customDetails?.orderType },
                    { label: "Color", value: customDetails?.metalColor },
                    { label: "Polish", value: customDetails?.polish },
                  ]}
                />
              }
            />
            <SpecLine label="Setting" value={customDetails?.settingType} />
            <SpecLine label="Finding" value={customDetails?.findingType} />
            <SpecLine label="Budget" value={customDetails?.budgetRange} />
            <SpecLine
              label="Customer need CAD Design"
              value={order.cadDesignRequired ? "Required" : "Not required"}
            />
            <SpecLine label="Salesperson" value={order.salespersonName} />
          </SpecSection>

          {notes && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3.5 py-3">
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

          <SpecSection icon={UserRound} title="Customer Details">
            <SpecLine label="Name" value={order.customerName} />
            <SpecLine label="Phone" value={order.customerPhone} />
            <SpecLine label="Address" value={order.customerAddress} />
          </SpecSection>
        </div>
      </div>
    </div>
  );
}
