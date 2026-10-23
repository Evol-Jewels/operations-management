"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  SectionShell,
  TextField,
} from "@/components/requirements/RequirementFields";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { VendorCombobox } from "@/components/vendors/VendorCombobox";
import { useUpdateBulkOrder } from "@/hooks/useBulkOrders";
import { useVendors } from "@/hooks/useVendors";
import { formatBulkOrderRef } from "@/lib/bulkOrders";
import type { BackendBulkOrderDetails } from "@/types/bulk-order-api";
import { BulkEditDialog } from "./BulkEditDialog";
import { buildHeaderPatch, createHeaderDraft } from "./bulk-order-edit";

export function EditBulkOrderDialog({
  order,
  onClose,
}: {
  order: BackendBulkOrderDetails;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(() => createHeaderDraft(order));
  const [vendorName, setVendorName] = useState(order.vendorName);
  const vendors = useVendors();
  const mutation = useUpdateBulkOrder(order.refCode);
  const vendorLocked = order.items.some(
    (item) => item.status === "CLOSED" || item.status === "CANCELLED",
  );
  const field = (key: keyof typeof draft, label: string, type = "text") => (
    <TextField
      key={key}
      label={label}
      type={type}
      value={draft[key]}
      onChange={(value) => setDraft({ ...draft, [key]: value })}
    />
  );
  return (
    <BulkEditDialog
      title="Edit packing list"
      description={formatBulkOrderRef(order.refCode)}
      pending={mutation.isPending}
      onClose={onClose}
      onSave={async () => {
        const input = buildHeaderPatch(draft, order);
        if (!Object.keys(input).length) {
          onClose();
          return;
        }
        await mutation.mutateAsync(input);
        toast.success("Packing list updated");
        onClose();
      }}
    >
      <SectionShell eyebrow="Packing list" title="Document and vendor">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="bulk-edit-vendor">Vendor</Label>
            <VendorCombobox
              id="bulk-edit-vendor"
              name={vendorName}
              vendorId={draft.vendorId}
              vendors={vendors.data ?? []}
              disabled={vendorLocked || vendors.isLoading}
              isLoading={vendors.isLoading}
              onChange={(name, vendorId) => {
                setVendorName(name);
                setDraft({ ...draft, vendorId: vendorId ?? "" });
              }}
            />
            {vendorLocked && (
              <p className="text-xs text-muted-foreground">
                Vendor is locked because a line is closed or cancelled.
              </p>
            )}
            {vendors.isError && (
              <p role="alert" className="text-xs text-destructive">
                Could not load vendors.{" "}
                <Button
                  type="button"
                  size="sm"
                  variant="link"
                  onClick={() => void vendors.refetch()}
                >
                  Retry
                </Button>
              </p>
            )}
          </div>
          {field("vendorCity", "Vendor city")}
          {field("packingListNumber", "Packing-list number")}
          {field("quotationDate", "Quotation date", "date")}
          {field("expectedDeliveryDate", "Expected delivery date", "date")}
          {field("documentUrl", "Document URL", "url")}
        </div>
        <p className="text-xs text-muted-foreground">
          Line delivery dates are edited separately.
        </p>
      </SectionShell>
      <SectionShell eyebrow="Quotation" title="Document totals · INR">
        <div className="grid gap-4 sm:grid-cols-2">
          {field("quotedSubtotal", "Document subtotal")}
          {field("taxRate", "Tax rate (%)")}
          {field("taxAmount", "Tax amount")}
          {field("roundingAmount", "Rounding amount")}
          {field("quotedTotal", "Document total")}
        </div>
        <p className="text-xs text-muted-foreground">
          Keep the vendor’s document totals. Differences from line amounts are
          shown in reconciliation.
        </p>
      </SectionShell>
    </BulkEditDialog>
  );
}
