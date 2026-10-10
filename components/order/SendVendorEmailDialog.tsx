"use client";

import { Mail, Paperclip } from "lucide-react";
import { type ReactNode, useId, useState } from "react";
import { toast } from "sonner";
import type { ItemPdfExport } from "@/components/enquiry/EnquiryProductList";
import { EmailChipsInput } from "@/components/order/EmailChipsInput";
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
import { Textarea } from "@/components/ui/textarea";
import { useVendors } from "@/hooks/useVendors";
import {
  buildVendorEmailBody,
  buildVendorEmailSubject,
  VENDOR_EMAIL_DEFAULT_CC,
} from "@/lib/vendorEmailTemplate";
import { findOrderVendor } from "@/lib/vendors";

const composeInputClassName =
  "h-11 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground";

interface SendVendorEmailDialogProps {
  refCode: number;
  pdf: ItemPdfExport;
  vendorId?: string;
  vendorName?: string;
}

export function SendVendorEmailDialog({
  refCode,
  pdf,
  vendorId,
  vendorName,
}: SendVendorEmailDialogProps) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const vendorsQuery = useVendors(open);
  const vendor = findOrderVendor(vendorsQuery.data ?? [], vendorId, vendorName);
  const [recipientOverride, setRecipientOverride] = useState<string | null>(
    null,
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (value) setRecipientOverride(null);
      }}
    >
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
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl print:hidden">
        <DialogHeader>
          <DialogTitle>Send email to vendor</DialogTitle>
          <DialogDescription>
            {vendor?.name || vendorName
              ? `Review the order details for ${vendor?.name || vendorName} before sending.`
              : "Review the order details before sending."}
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
          <div className="overflow-hidden rounded-lg border border-input">
            <ComposeRow label="To" htmlFor={`${id}-to`}>
              <input
                id={`${id}-to`}
                name="to"
                type="email"
                multiple
                value={recipientOverride ?? vendor?.email ?? ""}
                onChange={(event) => setRecipientOverride(event.target.value)}
                required
                placeholder="vendor@example.com"
                className={composeInputClassName}
              />
            </ComposeRow>
            <ComposeRow label="CC" htmlFor={`${id}-cc`}>
              <EmailChipsInput
                id={`${id}-cc`}
                name="cc"
                placeholder="Add emails"
                defaultEmails={VENDOR_EMAIL_DEFAULT_CC}
              />
            </ComposeRow>
            <ComposeRow label="Subject" htmlFor={`${id}-subject`}>
              <input
                id={`${id}-subject`}
                name="subject"
                required
                defaultValue={buildVendorEmailSubject(refCode, pdf.itemTitle)}
                className={composeInputClassName}
              />
            </ComposeRow>
            <Textarea
              name="content"
              aria-label="Content"
              defaultValue={buildVendorEmailBody(refCode, pdf.itemTitle)}
              rows={8}
              className="field-sizing-fixed resize-none rounded-none border-0 px-4 py-3 leading-relaxed shadow-none focus-visible:ring-0 dark:bg-transparent"
            />
            <div className="border-t border-input px-4 py-2.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="max-w-full rounded-full text-xs"
                aria-label={`Preview ${pdf.fileName}`}
                title="Preview PDF"
                onClick={pdf.preview}
              >
                <Paperclip className="size-3.5" />
                <span className="truncate">{pdf.fileName}</span>
              </Button>
            </div>
          </div>
          {vendorsQuery.isError ? (
            <p role="alert" className="text-xs text-destructive">
              Could not load the vendor email. Enter the recipient manually.
            </p>
          ) : null}
          <DialogFooter>
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

function ComposeRow({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-input px-4">
      <label
        htmlFor={htmlFor}
        className="w-14 shrink-0 py-3 text-sm leading-5 text-muted-foreground"
      >
        {label}
      </label>
      {children}
    </div>
  );
}
