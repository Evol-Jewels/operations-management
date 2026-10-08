"use client";

import { LayoutGrid, List, Search, Wrench } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRepairs } from "@/hooks/useRepairs";
import {
  isRepairTerminal,
  moveRepair,
  REPAIR_STAGES,
  type Repair,
  type RepairStage,
  type RepairVendor,
  validateRepairVendor,
} from "@/lib/repairs";
import { formatDate } from "@/lib/utils";
import { RepairKanbanBoard } from "./RepairKanbanBoard";
import { RepairStageBadge } from "./RepairStageBadge";
import { RepairVendorDialog } from "./RepairVendorDialog";
import { RepairWorkspaceCard } from "./RepairWorkspaceCard";

export function RepairsWorkspace({
  viewMode,
  onViewModeChange,
}: {
  viewMode: "table" | "kanban";
  onViewModeChange: (mode: "table" | "kanban") => void;
}) {
  const { repairs, isLoading, error, reload, saveStage } = useRepairs();
  const [saving, setSaving] = useState(false);
  const [pendingMove, setPendingMove] = useState<{
    repair: Repair;
    stage: RepairStage;
  } | null>(null);
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState("all");
  const [productType, setProductType] = useState("all");
  const needsVendor = Boolean(
    pendingMove &&
      pendingMove.stage !== "New" &&
      pendingMove.stage !== "Cancelled" &&
      Object.keys(validateRepairVendor(pendingMove.repair.vendor)).length,
  );
  const query = search.trim().toLowerCase();
  const activeStage = viewMode === "table" ? stage : "all";
  const filtered = repairs.filter(
    (repair) =>
      (activeStage === "all" || repair.stage === activeStage) &&
      (productType === "all" || repair.productType === productType) &&
      [
        repair.refCode,
        repair.customerName,
        repair.customerPhone,
        repair.barcode,
        repair.category ?? "",
        repair.repairRemarks,
        repair.vendor?.vendorName ?? "",
      ].some((value) => value.toLowerCase().includes(query)),
  );
  const commitMove = async (
    repair: Repair,
    stage: RepairStage,
    vendor = repair.vendor,
  ) => {
    if (saving) return;
    setSaving(true);
    try {
      await saveStage(repair.id, stage, vendor);
      setPendingMove(null);
      toast.success(`Repair moved to ${stage}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not update the repair.",
      );
    } finally {
      setSaving(false);
    }
  };
  const handleMove = (repair: Repair, stage: RepairStage) => {
    if (saving || pendingMove || isRepairTerminal(repair.stage)) return;
    if (
      stage !== "New" &&
      stage !== "Cancelled" &&
      Object.keys(validateRepairVendor(repair.vendor)).length
    ) {
      setPendingMove({ repair, stage });
      return;
    }
    try {
      moveRepair(repair, stage);
      if (isRepairTerminal(stage)) setPendingMove({ repair, stage });
      else void commitMove(repair, stage);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not update the repair.",
      );
    }
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <h2 className="text-base font-medium lg:mr-auto">
          Repairs{" "}
          <span className="text-muted-foreground">({filtered.length})</span>
        </h2>
        <div className="relative min-w-0 lg:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            aria-label="Search repairs by customer, vendor, barcode, or repair"
            placeholder="Search customer, vendor, or barcode"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
            maxLength={255}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {viewMode === "table" && (
            <Select value={stage} onValueChange={setStage}>
              <SelectTrigger aria-label="Filter repairs by stage">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All stages</SelectItem>
                {REPAIR_STAGES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={productType} onValueChange={setProductType}>
            <SelectTrigger aria-label="Filter repairs by product type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="Customer">Customer</SelectItem>
              <SelectItem value="Stock">Stock</SelectItem>
            </SelectContent>
          </Select>
          {(search || activeStage !== "all" || productType !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("");
                setStage("all");
                setProductType("all");
              }}
            >
              Clear
            </Button>
          )}
          <div className="flex gap-1 lg:hidden">
            <Button
              aria-label="Repair table view"
              aria-pressed={viewMode === "table"}
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => onViewModeChange("table")}
            >
              <List className="size-4" />
            </Button>
            <Button
              aria-label="Repair kanban view"
              aria-pressed={viewMode === "kanban"}
              variant={viewMode === "kanban" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => onViewModeChange("kanban")}
            >
              <LayoutGrid className="size-4" />
            </Button>
          </div>
        </div>
      </div>
      {isLoading ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Loading repairs…
        </p>
      ) : error ? (
        <div role="alert" className="space-y-3 rounded-xl border p-6">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" onClick={() => void reload()}>
            Try again
          </Button>
        </div>
      ) : !filtered.length ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <Wrench className="size-7 text-muted-foreground" />
          <p className="text-sm font-medium">
            {repairs.length
              ? "No repairs match these filters"
              : "No repairs yet"}
          </p>
          <p className="max-w-sm px-4 text-sm text-muted-foreground">
            {repairs.length
              ? "Try another search or clear the filters."
              : "Create a customer or stock repair to start tracking its progress."}
          </p>
          {!repairs.length && (
            <Button asChild>
              <Link href="/repairs/new">Create repair</Link>
            </Button>
          )}
        </div>
      ) : viewMode === "kanban" ? (
        <RepairKanbanBoard
          repairs={filtered}
          disabled={saving || Boolean(pendingMove)}
          onMove={handleMove}
        />
      ) : (
        <>
          <div className="grid gap-3 sm:hidden">
            {filtered.map((repair) => (
              <div key={repair.id} className="space-y-2">
                <RepairStageBadge stage={repair.stage} />
                <RepairWorkspaceCard repair={repair} />
              </div>
            ))}
          </div>
          <div className="hidden overflow-hidden rounded-xl border bg-card sm:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Repair / Customer</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Vendor estimate date</TableHead>
                  <TableHead>Delivery date</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((repair) => (
                  <TableRow key={repair.id}>
                    <TableCell>
                      <Link
                        href={`/repairs/${repair.id}`}
                        className="font-medium hover:underline"
                      >
                        {repair.customerName || "Stock repair"}
                      </Link>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {repair.refCode} · {repair.productType}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p>{repair.category || "Repair"}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {repair.barcode || "No barcode"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {repair.purity} · {repair.netWeight} g ·{" "}
                        {repair.metalColor}
                      </p>
                    </TableCell>
                    <TableCell>
                      <RepairStageBadge stage={repair.stage} />
                    </TableCell>
                    <TableCell>{repair.vendor?.vendorName || "—"}</TableCell>
                    <TableCell>
                      {repair.vendor?.vendorEstimateDate
                        ? formatDate(
                            `${repair.vendor.vendorEstimateDate}T12:00:00`,
                          )
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {repair.vendor?.deliveryDate
                        ? formatDate(`${repair.vendor.deliveryDate}T12:00:00`)
                        : "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDate(repair.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
      {pendingMove && needsVendor && (
        <RepairVendorDialog
          open
          moving
          targetStage={pendingMove.stage}
          vendor={pendingMove.repair.vendor}
          saving={saving}
          onOpenChange={(open) => {
            if (!saving && !open) setPendingMove(null);
          }}
          onSubmit={(vendor: RepairVendor) =>
            commitMove(pendingMove.repair, pendingMove.stage, vendor)
          }
        />
      )}
      <Dialog
        open={Boolean(
          pendingMove && isRepairTerminal(pendingMove.stage) && !needsVendor,
        )}
        onOpenChange={(open) => {
          if (!saving && !open) setPendingMove(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingMove?.stage === "Closed"
                ? "Close repair"
                : "Cancel repair"}
            </DialogTitle>
            <DialogDescription>
              The repair will be marked {pendingMove?.stage.toLowerCase()} and
              its status will be locked.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={saving}
              onClick={() => setPendingMove(null)}
            >
              Back
            </Button>
            <Button
              disabled={saving}
              onClick={() =>
                pendingMove &&
                void commitMove(pendingMove.repair, pendingMove.stage)
              }
            >
              {saving ? "Saving…" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
