"use client";

import { Mail, Paperclip } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { printOrderDetails } from "@/lib/printOrderDetails";
import {
  buildVendorEmailBody,
  buildVendorEmailSubject,
} from "@/lib/vendorEmailTemplate";
import type { Order } from "@/types";

interface SendVendorEmailDialogProps {
  order: Order;
  onPreviewAttachment?: () => void;
}

export function SendVendorEmailDialog({
  order,
  onPreviewAttachment = printOrderDetails,
}: SendVendorEmailDialogProps) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const attachmentName = `Order-${order.refCode ?? order.id}.pdf`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 border-input text-xs print:hidden"
        >
          <Mail className="size-3.5" />
          Email vendor
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-3xl print:hidden">
        <DialogHeader>
          <DialogTitle>Send email to vendor</DialogTitle>
          <DialogDescription>
            Review the order details before sending.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            toast.info("Sending email is coming soon!");
            setOpen(false);
          }}
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <FormField label="To" htmlFor={`${id}-to`}>
              <Input
                id={`${id}-to`}
                name="to"
                type="email"
                defaultValue=""
                placeholder="vendor@example.com"
              />
            </FormField>
            <FormField label="CC" htmlFor={`${id}-cc`} optional>
              <Input
                id={`${id}-cc`}
                name="cc"
                type="email"
                multiple
                defaultValue=""
                placeholder="email@example.com"
              />
            </FormField>
            <FormField label="Subject" htmlFor={`${id}-subject`}>
              <Input
                id={`${id}-subject`}
                name="subject"
                defaultValue={buildVendorEmailSubject(order)}
              />
            </FormField>
          </div>
          <FormField label="Content" htmlFor={`${id}-content`}>
            <Textarea
              id={`${id}-content`}
              name="content"
              defaultValue={buildVendorEmailBody(order)}
              rows={6}
              className="field-sizing-fixed resize-y leading-relaxed"
            />
          </FormField>
          <FormField label="Attachment">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="max-w-full rounded-full text-xs"
              aria-label={`Preview ${attachmentName}`}
              title="Preview order PDF"
              onClick={onPreviewAttachment}
            >
              <Paperclip className="size-3.5" />
              <span className="truncate">{attachmentName}</span>
            </Button>
          </FormField>
          <DialogFooter className="border-t pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">Send</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
