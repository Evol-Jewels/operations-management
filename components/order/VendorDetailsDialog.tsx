"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface VendorDetailsValues {
  vendor: string | null;
  vendorDeliveryDate: string | null;
}

interface VendorDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendorName?: string;
  vendorDeliveryDate?: string;
  title: string;
  description: string;
  confirmLabel: string;
  isPending?: boolean;
  onSubmit: (values: VendorDetailsValues) => void | Promise<void>;
}

export function VendorDetailsDialog({
  open,
  onOpenChange,
  vendorName,
  vendorDeliveryDate,
  title,
  description,
  confirmLabel,
  isPending = false,
  onSubmit,
}: VendorDetailsDialogProps) {
  const [name, setName] = useState(vendorName ?? "");
  const [deliveryDate, setDeliveryDate] = useState(vendorDeliveryDate ?? "");

  useEffect(() => {
    if (!open) return;
    setName(vendorName ?? "");
    setDeliveryDate(vendorDeliveryDate ?? "");
  }, [open, vendorDeliveryDate, vendorName]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit({
      vendor: name.trim() || null,
      vendorDeliveryDate: deliveryDate || null,
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isPending && !nextOpen) return;
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-5">
            <div className="grid gap-2">
              <Label htmlFor="vendor-name">
                Vendor name{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </Label>
              <Input
                id="vendor-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. ABC Jewellers"
                autoComplete="organization"
                disabled={isPending}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="vendor-delivery-date">
                Vendor delivery date{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </Label>
              <DatePicker
                id="vendor-delivery-date"
                value={deliveryDate}
                onChange={setDeliveryDate}
                placeholder="Select vendor delivery date"
                disabled={isPending}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : confirmLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
