"use client";

import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Check,
  Copy,
  Gift,
  IndianRupee,
  MapPin,
  Phone,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { type ReactNode, useState } from "react";
import { EnquiryProductList } from "@/components/enquiry/EnquiryProductList";
import {
  type EnquiryStage,
  EnquiryStageBar,
} from "@/components/enquiry/EnquiryStageBar";
import { ActivityTimeline } from "@/components/order/ActivityTimeline";
import { ComposeBox } from "@/components/order/ComposeBox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Textarea } from "@/components/ui/textarea";
import { getInitials } from "@/lib/people";
import { cn, formatDateTime } from "@/lib/utils";
import type { Order, ProductEstimation } from "@/types";

function deriveEnquiryStage(order: Order): EnquiryStage {
  if (order.status === "closed") return "Closed / Converted";
  if (order.currentStage === "Estimation" || order.estimations?.length) {
    return "Estimation Submitted";
  }
  return "Enquiry Created";
}

function formatRefCode(refCode?: number) {
  if (!refCode) return "Enquiry";
  return `#${String(refCode).padStart(4, "0")}`;
}

function CopyLinkButton() {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className="gap-1.5"
    >
      {copied ? (
        <>
          <Check className="size-3.5" />
          Copied
        </>
      ) : (
        <>
          <Copy className="size-3.5" />
          Copy link
        </>
      )}
    </Button>
  );
}

const CLOSE_REASONS = [
  "Customer not interested",
  "Out of budget",
  "Product not available",
  "Duplicate enquiry",
  "Customer Ordered another product",
  "Customer didn't respond for a month",
  "Other",
] as const;

type CloseReason = (typeof CLOSE_REASONS)[number];

function CloseEnquiryDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { reason: CloseReason; notes: string }) => void;
  isSubmitting?: boolean;
}) {
  const [reason, setReason] = useState<CloseReason | "">("");
  const [notes, setNotes] = useState("");

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setReason("");
      setNotes("");
    }
  }

  function handleSubmit() {
    if (!reason) return;
    onSubmit({ reason, notes });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Close enquiry</DialogTitle>
          <DialogDescription>
            Select a close reason and add any extra notes before closing this
            enquiry.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="close-reason">Close reason</Label>
            <Select
              value={reason}
              onValueChange={(value) => setReason(value as CloseReason)}
            >
              <SelectTrigger id="close-reason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {CLOSE_REASONS.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="close-notes">Notes</Label>
            <Textarea
              id="close-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Add optional closing notes"
              rows={4}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!reason || isSubmitting}
          >
            {isSubmitting ? "Closing..." : "Close enquiry"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PersonCard({
  label,
  name,
  detail,
  imageUrl,
  tone,
  icon,
}: {
  label: string;
  name: string;
  detail?: string | null;
  imageUrl?: string | null;
  tone?: "customer" | "sales";
  icon?: ReactNode;
}) {
  const roleStyles =
    tone === "customer"
      ? "bg-emerald-100 text-emerald-700"
      : tone === "sales"
        ? "bg-blue-100 text-blue-700"
        : "bg-muted text-muted-foreground";

  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar className={cn("size-11 shrink-0", roleStyles)}>
        {imageUrl ? <AvatarImage src={imageUrl} alt={name} /> : null}
        <AvatarFallback className={roleStyles}>
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/70">
          {label}
        </p>
        <p className="truncate text-sm font-medium text-foreground">{name}</p>
        {detail ? (
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
            {icon}
            <span className="truncate">{detail}</span>
          </p>
        ) : null}
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value?: string | number | null;
}) {
  if (value === null || value === undefined || value === "") return null;

  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/65">
          {label}
        </p>
        <p className="mt-0.5 break-words text-sm text-foreground">{value}</p>
      </div>
    </div>
  );
}

function ClosedBanner({ order }: { order: Order }) {
  if (order.status !== "closed") return null;

  return (
    <div className="rounded-2xl border border-amber-200/80 bg-amber-50 px-4 py-4 text-amber-950 shadow-sm dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-100">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-200">
          <AlertTriangle className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold">Enquiry closed</p>
          {order.closeReason ? (
            <p className="mt-1 text-sm text-amber-900/80 dark:text-amber-100/80">
              {order.closeReason}
            </p>
          ) : null}
          {order.closeNotes ? (
            <p className="mt-1 text-sm text-amber-900/80 dark:text-amber-100/80">
              {order.closeNotes}
            </p>
          ) : null}
          {order.closedAt ? (
            <p className="mt-1 text-xs text-amber-900/70 dark:text-amber-100/70">
              Closed on {formatDateTime(order.closedAt)}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

interface EnquiryDetailPageProps {
  order: Order;
  onSaveEstimation: (productId: string, estimation: ProductEstimation) => void;
  onPostUpdate: (data: { message: string }) => void;
  onCloseEnquiry: (data: { reason: string; notes: string }) => Promise<void>;
  isSavingEstimation?: boolean;
  isPostingUpdate?: boolean;
  isClosingEnquiry?: boolean;
}

export function EnquiryDetailPage({
  order,
  onSaveEstimation,
  onPostUpdate,
  onCloseEnquiry,
  isSavingEstimation,
  isPostingUpdate,
  isClosingEnquiry,
}: EnquiryDetailPageProps) {
  const isClosed = order.status === "closed";
  const stage = deriveEnquiryStage(order);
  const selectedProducts = order.selectedProducts ?? [];
  const customProducts = order.customProducts ?? [];
  const estimations = order.estimations ?? [];
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);

  function handleSaveEstimation(estimation: ProductEstimation) {
    onSaveEstimation(estimation.productId, estimation);
  }

  async function handleCloseEnquiry(data: {
    reason: CloseReason;
    notes: string;
  }) {
    await onCloseEnquiry(data);
    setCloseDialogOpen(false);
  }

  function handlePostUpdate(data: { message: string }) {
    onPostUpdate(data);

    setTimeout(() => {
      document.getElementById("timeline-end")?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }, 100);
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="mb-5">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="-ml-2 gap-1.5 text-muted-foreground"
        >
          <Link href="/orders-and-enquiries">
            <ArrowLeft className="size-3.5" />
            All enquiries
          </Link>
        </Button>
      </div>

      <header className="mb-6 space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {order.customerName}
            </h1>
            <span className="text-base text-muted-foreground">
              {formatRefCode(order.refCode)}
            </span>
            {isClosed ? (
              <span className="rounded-full border border-amber-200 bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
                Closed
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            {!isClosed ? (
              <Button size="sm" asChild className="h-8 gap-1.5 text-xs">
                <Link href={`/orders/new?from=${order.id}`}>
                  <Calendar className="size-3.5" />
                  <span className="hidden sm:inline">Convert to Order</span>
                  <span className="sm:hidden">Convert</span>
                </Link>
              </Button>
            ) : null}
            {!isClosed ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setCloseDialogOpen(true)}
                >
                  <X className="size-3.5" />
                  Close Enquiry
                </Button>
                <CloseEnquiryDialog
                  open={closeDialogOpen}
                  onOpenChange={setCloseDialogOpen}
                  isSubmitting={isClosingEnquiry}
                  onSubmit={handleCloseEnquiry}
                />
              </>
            ) : null}
            <CopyLinkButton />
          </div>
        </div>
      </header>

      {isClosed ? (
        <div className="mb-5">
          <ClosedBanner order={order} />
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card px-5 py-4">
            <EnquiryStageBar currentStage={stage} />
          </section>

          {order.customerNotes ? (
            <section className="rounded-2xl border border-border bg-card px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/65">
                Notes
              </p>
              <p className="mt-2 text-sm leading-6 text-foreground">
                {order.customerNotes}
              </p>
            </section>
          ) : null}

          <section>
            <EnquiryProductList
              selectedProducts={selectedProducts}
              customProducts={customProducts}
              estimations={estimations}
              isClosed={isClosed}
              onSaveEstimation={handleSaveEstimation}
              isSavingEstimation={isSavingEstimation}
            />
          </section>

          <section className="overflow-hidden rounded-2xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                Activity
              </span>
              <span className="text-xs text-muted-foreground">
                {order.activityFeed.length}{" "}
                {order.activityFeed.length === 1 ? "event" : "events"}
              </span>
            </div>

            <div className="px-5 pt-5">
              <ActivityTimeline entries={order.activityFeed} />
            </div>

            <div className="mx-5 border-t border-dashed border-border" />

            {!isClosed ? (
              <div className="px-5 pb-5 pt-4">
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                  Post an update
                </p>
                <ComposeBox
                  onSubmit={handlePostUpdate}
                  isSubmitting={isPostingUpdate}
                />
                {isPostingUpdate ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Posting update...
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="px-5 py-5 text-center text-sm text-muted-foreground">
                This enquiry is closed. No new updates can be posted.
              </div>
            )}

            <div id="timeline-end" />
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <section className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="border-b border-border px-5 py-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/60">
                People
              </p>
            </div>
            <div className="space-y-0">
              <div className="px-5 py-4">
                <PersonCard
                  label="Customer"
                  name={order.customerName}
                  detail={order.customerPhone}
                  tone="customer"
                  icon={<Phone className="size-3.5" />}
                />
              </div>
              <div className="border-t border-border px-5 py-4">
                <PersonCard
                  label="Salesperson"
                  name={order.salespersonName}
                  tone="sales"
                />
              </div>
              {order.createdBy ? (
                <div className="border-t border-border px-5 py-4">
                  <PersonCard
                    label="Created by"
                    name={order.createdBy.name}
                    imageUrl={order.createdBy.image}
                  />
                </div>
              ) : null}
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="border-b border-border px-5 py-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/60">
                Details
              </p>
            </div>
            <div className="space-y-4 px-5 py-5">
              <InfoRow
                icon={<IndianRupee className="size-3.5" />}
                label="Budget range"
                value={
                  order.budget
                    ? new Intl.NumberFormat("en-IN", {
                        style: "currency",
                        currency: "INR",
                        maximumFractionDigits: 0,
                      }).format(order.budget)
                    : "Not provided"
                }
              />
              <InfoRow
                icon={<Gift className="size-3.5" />}
                label="Notes"
                value={order.customerNotes ?? "Not provided"}
              />
              <InfoRow
                icon={<MapPin className="size-3.5" />}
                label="Last updated"
                value={formatDateTime(order.lastUpdatedAt)}
              />
              <InfoRow
                icon={<User className="size-3.5" />}
                label="Ref code"
                value={formatRefCode(order.refCode)}
              />
            </div>
          </section>
        </aside>
      </div>

      <div className="h-16" />
    </div>
  );
}
