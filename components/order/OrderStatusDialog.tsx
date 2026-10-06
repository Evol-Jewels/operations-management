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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Order } from "@/types";

export function OrderStatusDialog({
  order,
  stages,
  isPending,
  onClose,
  onSubmit,
}: {
  order: Order;
  stages: readonly string[];
  isPending: boolean;
  onClose: () => void;
  onSubmit: (stage: string) => Promise<boolean>;
}) {
  const [stage, setStage] = useState<string>(order.currentStage);
  const isLocked = ["Closed", "Cancelled"].includes(order.currentStage);

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !isPending) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update order status</DialogTitle>
          <DialogDescription>
            {order.orderNumber ?? `#${order.refCode}`} · {order.customerName}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="order-next-status">Status</Label>
          <Select
            value={stage}
            onValueChange={setStage}
            disabled={isPending || isLocked}
          >
            <SelectTrigger id="order-next-status" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {stages.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isLocked && (
            <p className="text-sm text-muted-foreground">
              Closed or cancelled orders cannot be changed.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            disabled={isPending || isLocked || stage === order.currentStage}
            onClick={async () => {
              if (await onSubmit(stage)) onClose();
            }}
          >
            {isPending ? "Updating..." : "Update status"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
