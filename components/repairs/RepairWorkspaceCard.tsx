"use client";

import { CalendarDays } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";
import { formatCardDate } from "@/components/dashboard/KanbanRecordCard";
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
import { RepairStageBadge } from "./RepairStageBadge";
import { RepairTypeBadge } from "./RepairTypeBadge";

export function RepairWorkspaceCard({
  repair,
  showStage = false,
  ...props
}: ComponentProps<typeof WorkspaceCard> & {
  repair: Repair;
  showStage?: boolean;
}) {
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
      <div className="space-y-1.5 pl-2">
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 truncate text-sm font-semibold text-foreground">
            {repair.customerName || "Stock repair"}
          </p>
          {showStage && <RepairStageBadge stage={repair.stage} />}
        </div>
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
            {formatRepairRefCode(repair.refCode)}
          </span>
          <span className="text-[10px] text-muted-foreground/50">·</span>
          <span className="truncate text-[11px] text-muted-foreground">
            {repair.category || "Repair"}
          </span>
          <RepairTypeBadge
            productType={repair.productType}
            className="ml-auto h-5 shrink-0 px-1.5 text-[10px]"
          />
        </div>
        <div className="flex min-w-0 items-center gap-2 text-[10px] text-muted-foreground">
          {daysLabel && (
            <span
              className={cn(
                "inline-flex h-5 shrink-0 items-center gap-1.5 rounded-md px-1.5 tabular-nums",
                urgency === "overdue"
                  ? "bg-red-500/10 text-red-600 dark:text-red-400"
                  : urgency === "due-soon"
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    : "bg-emerald-500/8",
              )}
            >
              <UrgencyDot level={urgency} />
              {daysLabel}
            </span>
          )}
          {canManageVendor && repair.vendor?.vendorName && (
            <span className="min-w-0 truncate">{repair.vendor.vendorName}</span>
          )}
          <span className="ml-auto inline-flex shrink-0 items-center gap-1 text-muted-foreground/80">
            <CalendarDays className="size-3" aria-hidden="true" />
            <span title={`Created on ${formatDate(repair.createdAt)}`}>
              {formatCardDate(repair.createdAt)}
            </span>
          </span>
        </div>
      </div>
    </WorkspaceCard>
  );
}
