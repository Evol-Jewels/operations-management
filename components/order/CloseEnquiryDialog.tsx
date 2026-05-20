"use client";

import { X } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useOrdersStore } from "@/lib/stores/orders-store";
import type { CloseReason } from "@/types";

const CLOSE_REASONS: CloseReason[] = [
  "Customer not interested",
  "Out of budget",
  "Product not available",
  "Duplicate enquiry",
  "Customer Ordered another product",
  "Customer didn't respond for a month",
  "Other",
];

interface CloseEnquiryDialogProps {
  orderId: string;
}

export function CloseEnquiryDialog({ orderId }: CloseEnquiryDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<CloseReason | "">("");
  const [notes, setNotes] = useState("");
  const closeEnquiry = useOrdersStore((state) => state.closeEnquiry);

  function handleSubmit() {
    if (!reason) return;
    closeEnquiry(orderId, reason as CloseReason, notes || undefined);
    setOpen(false);
    setReason("");
    setNotes("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
          <X className="h-3.5 w-3.5" />
          Close Enquiry
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Close Enquiry</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Close Reason <span className="text-destructive">*</span>
            </label>
            <Select
              value={reason}
              onValueChange={(v) => setReason(v as CloseReason)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {CLOSE_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Additional Notes (Optional)
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any extra notes here..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!reason}>
            Close Enquiry
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
