"use client";

import { Pencil } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useBulkOrderRecord } from "@/hooks/useBulkOrders";
import { useVendorAccess } from "@/hooks/useVendors";
import { EditBulkItemDialog } from "./EditBulkItemDialog";
import { EditBulkOrderDialog } from "./EditBulkOrderDialog";

export function BulkOrderEditButton({
  refCode,
  orderRefCode,
}: {
  refCode: number;
  orderRefCode?: number;
}) {
  const [open, setOpen] = useState(false);
  const canEdit = useVendorAccess();
  const { data: order } = useBulkOrderRecord(refCode);
  const item = order?.items.find((row) => row.refCode === orderRefCode);
  const locked = (status: string) =>
    status === "CLOSED" || status === "CANCELLED";
  if (
    !canEdit ||
    !order ||
    (orderRefCode !== undefined
      ? !item?.customProduct || locked(item.status)
      : order.items.every((row) => locked(row.status)))
  )
    return null;
  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <Pencil className="size-3.5" />
        {item ? "Edit item" : "Edit packing list"}
      </Button>
      {open &&
        (item ? (
          <EditBulkItemDialog
            key={item.refCode}
            refCode={refCode}
            item={item}
            onClose={() => setOpen(false)}
          />
        ) : (
          <EditBulkOrderDialog order={order} onClose={() => setOpen(false)} />
        ))}
    </>
  );
}
