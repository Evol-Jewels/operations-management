"use client";

import { ArrowLeft, Pencil } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import {
  DetailRow,
  DetailSection,
} from "@/components/enquiry/requirements/RequirementDetailsPanel";
import { StageBar } from "@/components/order/StageBar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import {
  isRepairTerminal,
  moveRepair,
  REPAIR_FLOW_STAGES,
  REPAIR_STAGES,
  type RepairStage,
  type RepairVendor,
  validateRepairVendor,
} from "@/lib/repairs";
import { formatDate } from "@/lib/utils";
import { RepairActivity } from "./RepairActivity";
import { RepairProductCard } from "./RepairProductCard";
import { RepairStageBadge } from "./RepairStageBadge";
import { RepairVendorDialog } from "./RepairVendorDialog";

function displayDate(value?: string) {
  return value ? formatDate(`${value}T12:00:00`) : "Not added";
}

export function RepairDetailPage({ id }: { id: string }) {
  const { repairs, isLoading, error, reload, save } = useRepairs();
  const repair = repairs.find((record) => record.id === id);
  const [vendorEditor, setVendorEditor] = useState<"edit" | "move" | null>(
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
      await save(moveRepair(repair, stage, vendor ?? repair.vendor));
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
    const timestamp = new Date().toISOString();
    try {
      await save({
        ...repair,
        vendor,
        updatedAt: timestamp,
        history: [
          ...repair.history,
          {
            stage: repair.stage,
            timestamp,
            message: "Vendor and delivery details updated",
          },
        ],
      });
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
          Local repairs are available in the browser where they were created.
        </p>
        <Button asChild variant="outline">
          <Link href="/orders-workspace?type=repair">Back to repairs</Link>
        </Button>
      </div>
    );
  const terminal = isRepairTerminal(repair.stage);
  const index = REPAIR_STAGES.indexOf(repair.stage);
  const allowedStages = REPAIR_STAGES.filter(
    (stage, position) =>
      stage === repair.stage ||
      (!terminal &&
        (stage === "Cancelled" || Math.abs(position - index) === 1)),
  );
  const name = repair.customerName || "Stock repair";
  return (
    <div className="mx-auto max-w-6xl">
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
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="mb-2 text-xl font-semibold tracking-tight text-foreground">
            {name}
            <span className="ml-2 font-normal text-muted-foreground">·</span>
            <span className="ml-2 text-base font-normal text-muted-foreground">
              {repair.category || "Repair"}
            </span>
          </h1>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <RepairStageBadge stage={repair.stage} />
            <span className="font-mono text-sm text-muted-foreground">
              {repair.refCode}
            </span>
            <span className="text-xs text-muted-foreground">
              {repair.productType}
            </span>
          </div>
        </div>
        <div className="w-full sm:w-auto sm:shrink-0">
          <Select
            value={repair.stage}
            disabled={saving || terminal}
            onValueChange={(value) => {
              const stage = REPAIR_STAGES.find((stage) => stage === value);
              if (!stage || stage === repair.stage) return;
              if (isRepairTerminal(stage)) {
                setPendingStage(stage);
                return;
              }
              if (
                repair.stage === "New" &&
                stage === "Ready for Repair" &&
                Object.keys(validateRepairVendor(repair.vendor)).length
              )
                setVendorEditor("move");
              else void changeStage(stage);
            }}
          >
            <SelectTrigger
              aria-label="Repair status"
              className="h-8 w-full min-w-40 text-xs"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {allowedStages.map((stage) => (
                <SelectItem key={stage} value={stage}>
                  {stage}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
      <div className="grid items-start gap-7 xl:grid-cols-[minmax(0,1fr)_370px]">
        <main>
          <RepairProductCard repair={repair} />
        </main>
        <aside className="xl:sticky xl:top-6 xl:self-start">
          <section className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="px-5 py-5">
              <p className="mb-5 text-sm font-semibold text-foreground">
                {repair.productType === "Customer" ? "Customer" : "Product"}
              </p>
              <div className="flex min-w-0 items-center gap-3">
                <Avatar className="size-8 shrink-0 text-xs font-semibold">
                  <AvatarFallback className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    {name
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((word) => word[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{name}</p>
                  {repair.customerPhone && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {repair.customerPhone}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="border-t border-border px-5 py-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">Vendor and delivery</p>
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
              </div>
              <dl className="space-y-3">
                <DetailRow
                  label="Vendor name"
                  value={repair.vendor?.vendorName || "Not added"}
                />
                <DetailRow
                  label="Vendor estimate date"
                  value={displayDate(repair.vendor?.vendorEstimateDate)}
                />
                <DetailRow
                  label="Delivery date"
                  value={displayDate(repair.vendor?.deliveryDate)}
                />
              </dl>
            </div>
            <div className="border-t border-border px-5 py-5">
              <DetailSection title="Overview">
                <DetailRow label="Ref code" value={repair.refCode} />
                <DetailRow label="Product" value={repair.productType} />
                <DetailRow
                  label="Created"
                  value={formatDate(repair.createdAt)}
                />
                <DetailRow
                  label="Updated"
                  value={formatDate(repair.updatedAt)}
                />
              </DetailSection>
            </div>
          </section>
        </aside>
      </div>
      <RepairActivity
        repair={repair}
        busy={saving}
        onSave={async (updated) => {
          if (saving) throw new Error("Wait for the current update to finish.");
          setSaving(true);
          try {
            await save(updated);
          } finally {
            setSaving(false);
          }
        }}
      />
      <div className="h-16" />
      {vendorEditor && (
        <RepairVendorDialog
          open
          onOpenChange={(open) => {
            if (!saving && !open) setVendorEditor(null);
          }}
          vendor={repair.vendor}
          saving={saving}
          moving={vendorEditor === "move"}
          onSubmit={(vendor) =>
            vendorEditor === "move"
              ? changeStage("Ready for Repair", vendor)
              : saveVendor(vendor)
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
