"use client";

import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { type RepairVendor, validateRepairVendor } from "@/lib/repairs";
import { RepairVendorFields } from "./RepairVendorFields";

export function RepairVendorDialog({
  open,
  onOpenChange,
  vendor,
  saving,
  onSubmit,
  moving = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendor?: RepairVendor;
  saving: boolean;
  onSubmit: (vendor: RepairVendor) => Promise<void>;
  moving?: boolean;
}) {
  const [values, setValues] = useState<RepairVendor>(
    vendor ?? { vendorName: "", vendorEstimateDate: "", deliveryDate: "" },
  );
  const [submitted, setSubmitted] = useState(false);
  const errors = validateRepairVendor(values, moving);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length) return;
    void onSubmit(values);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {moving ? "Ready for repair" : "Edit vendor and delivery details"}
          </DialogTitle>
          <DialogDescription>
            {moving
              ? "Add vendor and delivery details before moving this repair."
              : "Update the vendor and expected delivery dates."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-5">
          <fieldset disabled={saving}>
            <RepairVendorFields
              value={values}
              onChange={setValues}
              required={moving}
              errors={submitted ? errors : undefined}
            />
          </fieldset>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving
                ? "Saving…"
                : moving
                  ? "Move to Ready for Repair"
                  : "Save details"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
