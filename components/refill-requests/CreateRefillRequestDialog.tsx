"use client";

import { useRouter } from "next/navigation";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { VendorCombobox } from "@/components/vendors/VendorCombobox";
import { useCreateRefillRequest } from "@/hooks/useRefillRequests";
import { useVendors } from "@/hooks/useVendors";
import { formatRefillRef } from "@/lib/refillRequestsApi";

const REFILL_REQUESTS_HREF = "/orders-workspace?type=bulk-orders&bulk=refills";

export function CreateRefillRequestDialog({
  defaultVendor,
  items,
  onClose,
  onCreated,
}: {
  defaultVendor: { id: string; name: string } | null;
  items: Array<{ productCode: string; quantity: number }>;
  onClose: () => void;
  onCreated: () => void;
}) {
  const router = useRouter();
  const vendorsQuery = useVendors();
  const [vendor, setVendor] = useState({
    id: defaultVendor?.id ?? null,
    name: defaultVendor?.name ?? "",
  });
  const [notes, setNotes] = useState("");
  const createMutation = useCreateRefillRequest();

  const submit = (vendorId: string) =>
    createMutation.mutate(
      {
        vendorId,
        items: items.map(({ productCode, quantity }) => ({
          productCode,
          quantity,
        })),
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: (request) => {
          toast.success(
            `Refill request ${formatRefillRef(request.refCode)} created`,
            {
              action: {
                label: "View",
                onClick: () => router.push(REFILL_REQUESTS_HREF),
              },
            },
          );
          onCreated();
        },
        onError: (error) => toast.error(error.message),
      },
    );

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create refill request</DialogTitle>
          <DialogDescription>
            {items.length} {items.length === 1 ? "product" : "products"} ·{" "}
            {items.reduce((total, item) => total + item.quantity, 0)} pcs.
            Operations will review it in Bulk orders.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (vendor.id) submit(vendor.id);
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="refill-request-vendor">Vendor</Label>
            <VendorCombobox
              id="refill-request-vendor"
              name={vendor.name}
              vendorId={vendor.id}
              vendors={vendorsQuery.data ?? []}
              isLoading={vendorsQuery.isLoading}
              onChange={(name, id) => setVendor({ id, name })}
            />
            {vendor.name && !vendor.id ? (
              <p className="text-xs text-destructive">
                Choose a saved vendor from the list.
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="refill-request-notes">
              Note{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Textarea
              id="refill-request-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="e.g. Fast movers at the Bandra store"
              rows={3}
              maxLength={2000}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Back
            </Button>
            <Button
              type="submit"
              disabled={!vendor.id || createMutation.isPending}
            >
              {createMutation.isPending ? "Creating..." : "Create request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
