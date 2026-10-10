"use client";

import { CalendarDays } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";
import { UrgencyDot } from "@/components/dashboard/UrgencyDot";
import { WorkspaceCard } from "@/components/dashboard/WorkspaceCard";
import { useVendorAccess } from "@/hooks/useVendors";
import {
  formatRepairRefCode,
  isRepairTerminal,
  type Repair,
} from "@/lib/repairs";
import {
  cn,
  formatDate,
  formatDaysRemaining,
  getUrgencyLevel,
} from "@/lib/utils";
import { RepairTypeBadge } from "./RepairTypeBadge";

export function RepairWorkspaceCard({
  repair,
  ...props
}: ComponentProps<typeof WorkspaceCard> & { repair: Repair }) {
  const router = useRouter();
  const canManageVendor = useVendorAccess();
  const deliveryDate =
    isRepairTerminal(repair.stage) || !canManageVendor
      ? undefined
      : repair.vendor?.deliveryDate;
  const urgency = deliveryDate ? getUrgencyLevel(deliveryDate) : "none";
  const daysLabel = deliveryDate ? formatDaysRemaining(deliveryDate) : null;
  return (
    <WorkspaceCard
      urgency={urgency}
      onClick={() => router.push(`/repairs/${repair.id}`)}
      {...props}
    >
      <div className="pl-2">
        <p className="truncate text-sm font-semibold text-foreground">
          {repair.customerName || "Stock repair"}
        </p>
        <div className="mt-1 flex items-center gap-1.5">
          <span className="font-mono text-[11px] text-muted-foreground">
            {formatRepairRefCode(repair.refCode)}
          </span>
          <span className="text-[10px] text-muted-foreground/50">·</span>
          <span className="truncate text-[11px] text-muted-foreground">
            {repair.category || "Repair"}
          </span>
        </div>
        <RepairTypeBadge productType={repair.productType} className="mt-2" />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          {daysLabel && (
            <span
              className={cn(
                "inline-flex min-h-6 items-center gap-1.5 rounded-md px-1.5 text-[10px] tabular-nums",
                urgency === "overdue"
                  ? "bg-red-500/10 text-red-600 dark:text-red-400"
                  : urgency === "due-soon"
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    : "bg-emerald-500/8 text-muted-foreground",
              )}
            >
              <UrgencyDot level={urgency} />
              {daysLabel}
            </span>
          )}
          {canManageVendor && repair.vendor?.vendorName && (
            <span className="truncate text-[10px] text-muted-foreground">
              {repair.vendor.vendorName}
            </span>
          )}
        </div>
        <div className="mt-2 flex items-center gap-1 border-t border-border/60 pt-2 text-[10px] text-muted-foreground/70">
          <CalendarDays className="size-3 shrink-0" aria-hidden="true" />
          <span>Created on {formatDate(repair.createdAt)}</span>
        </div>
      </div>
    </WorkspaceCard>
  );
}
