"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { BulkOrderItem } from "@/lib/bulkOrders";

export type BulkItemTerminalStage = "Closed" | "Cancelled";

export function BulkItemCloseDialog({
  item,
  stage,
  onCancel,
  onConfirm,
}: {
  item: BulkOrderItem;
  stage: BulkItemTerminalStage;
  onCancel: () => void;
  onConfirm: (remark: string) => void;
}) {
  const [remark, setRemark] = useState("");
  const isCancel = stage === "Cancelled";
  const trimmed = remark.trim();

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isCancel ? "Cancel" : "Close"} {item.vendorDesignNumber}
          </DialogTitle>
          <DialogDescription>
            Item #{item.serialNumber} · {item.category} ({item.quantity} pcs)
            will be {isCancel ? "cancelled" : "closed"} and locked.{" "}
            {isCancel
              ? "It won't count towards this bulk order's pieces or totals. Add why so the team has context."
              : "Add a closing note if anything is worth recording."}
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (isCancel && !trimmed) return;
            onConfirm(trimmed);
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="bulk-item-remark">
              {isCancel ? "Cancellation remark" : "Closing remark"}{" "}
              {isCancel ? (
                <span className="text-destructive">*</span>
              ) : (
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              )}
            </Label>
            <Textarea
              id="bulk-item-remark"
              value={remark}
              onChange={(event) => setRemark(event.target.value)}
              placeholder={
                isCancel
                  ? "e.g. Vendor couldn't source the pear centre stone"
                  : "e.g. Received and listed on website"
              }
              rows={4}
              maxLength={500}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel}>
              Back
            </Button>
            <Button
              type="submit"
              variant={isCancel ? "destructive" : "default"}
              disabled={isCancel && !trimmed}
            >
              {isCancel ? "Cancel item" : "Close item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
