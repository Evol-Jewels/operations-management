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
import { Label } from "@/components/ui/label";
import { VendorCombobox } from "@/components/vendors/VendorCombobox";
import { useVendors } from "@/hooks/useVendors";
import { findOrderVendor } from "@/lib/vendors";

export interface VendorDetailsValues {
  vendor: string | null;
  vendorId: string | null;
  vendorDeliveryDate: string | null;
}

interface VendorDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendorName?: string;
  vendorId?: string;
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
  vendorId,
  vendorDeliveryDate,
  title,
  description,
  confirmLabel,
  isPending = false,
  onSubmit,
}: VendorDetailsDialogProps) {
  const [name, setName] = useState(vendorName ?? "");
  const [selectedId, setSelectedId] = useState<string | null>(vendorId ?? null);
  const vendorsQuery = useVendors(open);
  const [deliveryDate, setDeliveryDate] = useState(vendorDeliveryDate ?? "");

  useEffect(() => {
    if (!open) return;
    setName(vendorName ?? "");
    setSelectedId(vendorId ?? null);
    setDeliveryDate(vendorDeliveryDate ?? "");
  }, [open, vendorDeliveryDate, vendorName, vendorId]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit({
      vendor: name.trim() || null,
      vendorId:
        selectedId ??
        findOrderVendor(vendorsQuery.data ?? [], null, name)?.vendorId ??
        null,
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
              <VendorCombobox
                id="vendor-name"
                name={name}
                vendorId={selectedId}
                vendors={vendorsQuery.data ?? []}
                onChange={(value, id) => {
                  setName(value);
                  setSelectedId(id);
                }}
                disabled={isPending}
                isLoading={vendorsQuery.isLoading}
              />
              {vendorsQuery.isError ? (
                <p role="alert" className="text-xs text-destructive">
                  Could not load saved vendors. You can still type a vendor
                  name.{" "}
                  <button
                    type="button"
                    className="underline"
                    onClick={() => void vendorsQuery.refetch()}
                  >
                    Retry
                  </button>
                </p>
              ) : null}
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
