"use client";

import { ArrowLeft, Pencil, Truck, UserRound, Wrench } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { UrgencyDot } from "@/components/dashboard/UrgencyDot";
import { SpecLine, SpecSection } from "@/components/order/SpecSection";
import { StageBar } from "@/components/order/StageBar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRepairs } from "@/hooks/useRepairs";
import { useVendorAccess } from "@/hooks/useVendors";
import {
  formatRepairRefCode,
  isRepairTerminal,
  REPAIR_FLOW_STAGES,
  REPAIR_STAGES,
  type RepairStage,
  type RepairVendor,
  validateRepairVendor,
} from "@/lib/repairs";
import {
  cn,
  formatDate,
  formatDaysRemaining,
  getUrgencyLevel,
} from "@/lib/utils";
import { RepairActivity } from "./RepairActivity";
import { RepairProductCard } from "./RepairProductCard";
import { RepairTypeBadge } from "./RepairTypeBadge";
import { RepairVendorDialog } from "./RepairVendorDialog";

function displayDate(value?: string) {
  return value ? formatDate(`${value}T12:00:00`) : "Not added";
}

export function RepairDetailPage({ id }: { id: string }) {
  const {
    repairs,
    isLoading,
    error,
    reload,
    saveStage,
    saveVendor: persistVendor,
    saveComment,
  } = useRepairs(id);
  const canManageVendor = useVendorAccess();
  const repair = repairs.find((record) => record.id === id);
  const [vendorEditor, setVendorEditor] = useState<"edit" | RepairStage | null>(
    null,
  );
  const [pendingStage, setPendingStage] = useState<RepairStage | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const changeStage = async (stage: RepairStage, vendor?: RepairVendor) => {
    if (!repair || saving) return;
    setSaving(true);
    setSaveError("");
    try {
      await saveStage(
        repair.id,
        stage,
        canManageVendor ? (vendor ?? repair.vendor) : undefined,
      );
      setVendorEditor(null);
      setPendingStage(null);
      toast.success(`Repair moved to ${stage}`);
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Could not update the repair.",
      );
    } finally {
      setSaving(false);
    }
  };
  const saveVendor = async (vendor: RepairVendor) => {
    if (!repair || saving) return;
    setSaving(true);
    setSaveError("");
    try {
      await persistVendor(repair.id, vendor);
      setVendorEditor(null);
      toast.success("Vendor details updated");
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "Could not update vendor details.",
      );
    } finally {
      setSaving(false);
    }
  };
  if (isLoading)
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Loading repair…
      </p>
    );
  if (error)
    return (
      <div role="alert" className="space-y-3">
        <p className="text-destructive">{error}</p>
        <Button variant="outline" onClick={() => void reload()}>
          Try again
        </Button>
      </div>
    );
  if (!repair)
    return (
      <div className="space-y-3 py-12 text-center">
        <h1 className="text-xl font-semibold">Repair not found</h1>
        <p className="text-sm text-muted-foreground">
          This repair may have been removed or the link may be incorrect.
        </p>
        <Button asChild variant="outline">
          <Link href="/orders-workspace?type=repair">Back to repairs</Link>
        </Button>
      </div>
    );
  const terminal = isRepairTerminal(repair.stage);
  const name = repair.customerName || "Stock repair";
  const deliveryDate =
    terminal || !canManageVendor ? undefined : repair.vendor?.deliveryDate;
  const urgency = getUrgencyLevel(deliveryDate);
  const daysLabel = formatDaysRemaining(deliveryDate);
  return (
    <div className="@container/repair-detail mx-auto w-full min-w-0 max-w-6xl">
      <div className="mb-5">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="-ml-2 gap-1.5 text-muted-foreground"
        >
          <Link href="/orders-workspace?type=repair">
            <ArrowLeft className="size-3.5" />
            All repairs
          </Link>
        </Button>
      </div>
      <div className="mb-6">
        <h1 className="mb-2 break-words text-xl font-semibold tracking-tight text-foreground">
          {name}
          <span className="ml-2 font-normal text-muted-foreground">·</span>
          <span className="ml-2 text-base font-normal text-muted-foreground">
            {repair.category || "Repair"}
          </span>
        </h1>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <RepairTypeBadge
            productType={repair.productType}
            className="px-2.5"
          />
          <span className="font-mono text-sm text-muted-foreground">
            {formatRepairRefCode(repair.refCode)}
          </span>
          {deliveryDate && daysLabel && (
            <span
              className={cn(
                "flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                urgency === "overdue" &&
                  "bg-red-500/10 text-red-600 dark:text-red-400",
                urgency === "due-soon" &&
                  "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                urgency === "on-track" &&
                  "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
              )}
            >
              <UrgencyDot level={urgency} />
              {daysLabel}
            </span>
          )}
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Select
              value={repair.stage}
              disabled={saving || terminal}
              onValueChange={(value) => {
                const stage = REPAIR_STAGES.find((stage) => stage === value);
                if (!stage || stage === repair.stage) return;
                if (
                  canManageVendor &&
                  stage !== "New" &&
                  stage !== "Cancelled" &&
                  Object.keys(validateRepairVendor(repair.vendor)).length
                )
                  setVendorEditor(stage);
                else if (isRepairTerminal(stage)) setPendingStage(stage);
                else void changeStage(stage);
              }}
            >
              <SelectTrigger
                size="sm"
                aria-label="Repair status"
                className="h-8 min-w-36 text-xs"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                {REPAIR_STAGES.map((stage) => (
                  <SelectItem key={stage} value={stage}>
                    {stage}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      {repair.stage !== "Cancelled" && (
        <div className="mb-5 px-5 py-4">
          <StageBar currentStage={repair.stage} stages={REPAIR_FLOW_STAGES} />
        </div>
      )}
      {saveError && (
        <p role="alert" className="mb-5 text-sm text-destructive">
          {saveError}
        </p>
      )}
      <div className="grid min-w-0 items-start gap-5 @[60rem]/repair-detail:grid-cols-[minmax(0,1fr)_320px] @[60rem]/repair-detail:gap-7">
        <main className="min-w-0">
          <RepairProductCard repair={repair} />
        </main>
        <aside className="min-w-0 @[60rem]/repair-detail:sticky @[60rem]/repair-detail:top-6 @[60rem]/repair-detail:self-start">
          <section className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="space-y-6 px-5 py-4">
              <SpecSection icon={Wrench} title="Overview">
                <SpecLine
                  label="Ref code"
                  value={formatRepairRefCode(repair.refCode)}
                  mono
                />
                <SpecLine
                  label="Category"
                  value={repair.category || "Repair"}
                />
                <SpecLine
                  label="Product"
                  value={<RepairTypeBadge productType={repair.productType} />}
                />
                <SpecLine
                  label="Created"
                  value={formatDate(repair.createdAt)}
                />
                <SpecLine
                  label="Updated"
                  value={formatDate(repair.updatedAt)}
                />
              </SpecSection>
              {canManageVendor && (
                <SpecSection
                  icon={Truck}
                  title="Vendor details"
                  action={
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1.5 px-2 text-xs"
                      disabled={saving || terminal}
                      onClick={() => setVendorEditor("edit")}
                    >
                      <Pencil className="size-3" />
                      Edit
                    </Button>
                  }
                >
                  <SpecLine
                    label="Vendor name"
                    value={repair.vendor?.vendorName || "Not added"}
                  />
                  <SpecLine
                    label="Vendor estimate"
                    value={displayDate(repair.vendor?.vendorEstimateDate)}
                  />
                  <SpecLine
                    label="Delivery date"
                    value={displayDate(repair.vendor?.deliveryDate)}
                  />
                </SpecSection>
              )}
              {repair.productType === "Customer" && (
                <SpecSection icon={UserRound} title="Customer details">
                  <SpecLine label="Name" value={repair.customerName} />
                  <SpecLine label="Phone" value={repair.customerPhone} />
                </SpecSection>
              )}
            </div>
          </section>
        </aside>
      </div>
      <RepairActivity
        repair={repair}
        busy={saving}
        onPost={async (comment) => {
          if (saving) throw new Error("Wait for the current update to finish.");
          setSaving(true);
          try {
            await saveComment(repair.id, comment);
          } finally {
            setSaving(false);
          }
        }}
      />
      <div className="h-16" />
      {canManageVendor && vendorEditor && (
        <RepairVendorDialog
          open
          onOpenChange={(open) => {
            if (!saving && !open) setVendorEditor(null);
          }}
          vendor={repair.vendor}
          saving={saving}
          moving={vendorEditor !== "edit"}
          required={repair.stage !== "New" || vendorEditor !== "edit"}
          targetStage={vendorEditor === "edit" ? undefined : vendorEditor}
          onSubmit={(vendor) =>
            vendorEditor === "edit"
              ? saveVendor(vendor)
              : changeStage(vendorEditor, vendor)
          }
        />
      )}
      <Dialog
        open={Boolean(pendingStage)}
        onOpenChange={(open) => {
          if (!saving && !open) setPendingStage(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingStage === "Closed" ? "Close repair" : "Cancel repair"}
            </DialogTitle>
            <DialogDescription>
              The repair will be marked {pendingStage?.toLowerCase()} and its
              status will be locked.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={saving}
              onClick={() => setPendingStage(null)}
            >
              Back
            </Button>
            <Button
              disabled={saving}
              onClick={() => pendingStage && void changeStage(pendingStage)}
            >
              {saving ? "Saving…" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
