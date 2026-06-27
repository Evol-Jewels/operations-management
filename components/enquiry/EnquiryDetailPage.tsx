"use client";

import { AlertTriangle, ArrowLeft, Calendar, X } from "lucide-react";
import Link from "next/link";
import { type ReactNode, useState } from "react";
import { EnquiryProductList } from "@/components/enquiry/EnquiryProductList";
import {
  type EnquiryStage,
  EnquiryStageBar,
} from "@/components/enquiry/EnquiryStageBar";
import { ActivityTimeline } from "@/components/order/ActivityTimeline";
import { ComposeBox } from "@/components/order/ComposeBox";
import { RelativeTime } from "@/components/RelativeTime";
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
import { getSessionRole } from "@/lib/auth";
import { authClient } from "@/lib/auth-client";
import {
  type EnquiryUiStatus,
  getOrderEnquiryUiStatus,
  isEnquiryClosed,
} from "@/lib/enquiryStatus";
import { getInitials } from "@/lib/people";
import { cn, formatCurrency } from "@/lib/utils";
import type { Order, ProductEstimation } from "@/types";

function enquiryStatusBadgeClass(status: EnquiryUiStatus): string {
  switch (status) {
    case "Closed":
      return "border border-muted-foreground/20 bg-muted text-foreground dark:border-muted-foreground/20 dark:bg-muted/50";
    case "Converted":
      return "border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300";
    case "Estimated":
      return "border border-amber-500/20 bg-amber-500/10 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300";
    default:
      return "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300";
  }
}

function enquiryStatusDotClass(status: EnquiryUiStatus): string {
  switch (status) {
    case "Closed":
      return "bg-muted-foreground";
    case "Converted":
      return "bg-emerald-500";
    case "Estimated":
      return "bg-amber-500";
    default:
      return "bg-emerald-500";
  }
}

function deriveEnquiryStage(order: Order): EnquiryStage {
  const status = getOrderEnquiryUiStatus(order);
  if (status === "Closed" || status === "Converted")
    return "Closed / Converted";
  if (status === "Estimated") return "Estimation Submitted";
  return "Enquiry Created";
}

function formatProductCount(count: number) {
  return `${count} product${count === 1 ? "" : "s"}`;
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
  name,
  detail,
  imageUrl,
  tone,
}: {
  name: string;
  detail?: string | null;
  imageUrl?: string | null;
  tone?: "customer" | "sales";
}) {
  const roleStyles =
    tone === "customer"
      ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
      : tone === "sales"
        ? "bg-blue-500/10 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
        : "bg-muted text-muted-foreground";

  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar
        className={cn("size-8 shrink-0 text-xs font-semibold", roleStyles)}
      >
        {imageUrl ? <AvatarImage src={imageUrl} alt={name} /> : null}
        <AvatarFallback className={roleStyles}>
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{name}</p>
        {detail ? (
          <p className="mt-0.5 text-xs leading-4 text-muted-foreground">
            <span className="truncate">{detail}</span>
          </p>
        ) : null}
      </div>
    </div>
  );
}

function DetailMetric({ label, value }: { label: string; value?: ReactNode }) {
  if (value === null || value === undefined || value === "") return null;

  return (
    <div className="flex items-center justify-between gap-5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-right text-sm font-medium tabular-nums text-foreground">
        {value}
      </dd>
    </div>
  );
}

function ClosedBanner({ order }: { order: Order }) {
  if (!isEnquiryClosed(order)) return null;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-4 text-amber-950 shadow-sm dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100">
      <AlertTriangle className="size-4" />
      <p className="text-sm font-semibold">Enquiry closed</p>
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
  const isClosed = isEnquiryClosed(order);
  const isConverted = order.enquiryStatus === "CONVERTED";
  const isFinalized = isClosed || isConverted;
  const enquiryStatus = getOrderEnquiryUiStatus(order);
  const stage = deriveEnquiryStage(order);
  const selectedProducts = order.selectedProducts ?? [];
  const customProducts = order.customProducts ?? [];
  const estimations = order.estimations ?? [];
  const productCount = selectedProducts.length + customProducts.length;
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const { data: session } = authClient.useSession();
  const sessionRole = session ? getSessionRole(session) : "";
  const canConvertToOrder = ["ADMIN", "OPERATIONS"].includes(sessionRole);
  const canManageEstimations = ["ADMIN", "OPERATIONS"].includes(sessionRole);

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
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-5">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="-ml-2 gap-1.5 text-muted-foreground"
        >
          <Link href="/orders-workspace">
            <ArrowLeft className="size-3.5" />
            All enquiries
          </Link>
        </Button>
      </div>

      <header className="mb-7 border-b border-border pb-6">
        <div className="flex flex-col gap-5 lg:flex-row items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex min-w-0 flex-wrap items-baseline gap-x-2">
              <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">
                {order.customerName}
              </h1>
              <span className="text-2xl font-normal text-muted-foreground sm:text-3xl">
                {`#${order.refCode}`}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground sm:text-base">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium",
                  enquiryStatusBadgeClass(enquiryStatus),
                )}
              >
                <span
                  className={cn(
                    "size-2 rounded-full",
                    enquiryStatusDotClass(enquiryStatus),
                  )}
                />
                {enquiryStatus}
              </span>
              <span>
                {order.salespersonName} opened this enquiry{" "}
                <RelativeTime isoString={order.createdAt} />
              </span>
              <span className="text-muted-foreground/50">·</span>
              <span>{formatProductCount(productCount)}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            {!isFinalized && canConvertToOrder ? (
              <Button
                size="sm"
                asChild
                className="bg-foreground text-background hover:bg-foreground/90"
              >
                <Link href={`/orders/new?from=${order.id}`}>
                  <Calendar className="size-4" />
                  <span className="hidden sm:inline">Convert to Order</span>
                  <span className="sm:hidden">Convert</span>
                </Link>
              </Button>
            ) : null}
            {!isFinalized ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCloseDialogOpen(true)}
                >
                  <X className="size-4" />
                  Close enquiry
                </Button>
                <CloseEnquiryDialog
                  open={closeDialogOpen}
                  onOpenChange={setCloseDialogOpen}
                  isSubmitting={isClosingEnquiry}
                  onSubmit={handleCloseEnquiry}
                />
              </>
            ) : null}
          </div>
        </div>
      </header>

      {isClosed ? (
        <div className="mb-5">
          <ClosedBanner order={order} />
        </div>
      ) : null}

      <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_370px]">
        <div className="space-y-6">
          <EnquiryStageBar currentStage={stage} />

          {order.customerNotes || order.budget ? (
            <section className="rounded-xl border border-border bg-card px-6 py-6">
              <div className="flex items-start justify-between gap-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Notes
                </p>
                {order.budget ? (
                  <p className="shrink-0 text-sm text-muted-foreground">
                    Budget{" "}
                    <span className="font-medium text-foreground">
                      {formatCurrency(order.budget)}
                    </span>
                  </p>
                ) : null}
              </div>
              <p className="mt-4 text-base leading-7 text-foreground">
                {order.customerNotes ?? "No notes added."}
              </p>
            </section>
          ) : null}

          <section className="my-8">
            <EnquiryProductList
              selectedProducts={selectedProducts}
              customProducts={customProducts}
              estimations={estimations}
              isFinalized={isFinalized}
              canManageEstimations={canManageEstimations}
              onSaveEstimation={handleSaveEstimation}
              isSavingEstimation={isSavingEstimation}
            />
          </section>

          <section>
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Activity
              </span>
              <span className="text-xs text-muted-foreground">
                {order.activityFeed.length}{" "}
                {order.activityFeed.length === 1 ? "event" : "events"}
              </span>
            </div>

            <div>
              <ActivityTimeline entries={order.activityFeed} />
            </div>

            <div className="border-t border-dashed border-border" />

            <div className="pt-4">
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

            <div id="timeline-end" />
          </section>
        </div>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <section className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="px-5 py-5">
              <p className="mb-5 text-sm font-semibold text-foreground">
                People
              </p>
              <div className="space-y-5">
                <PersonCard
                  name={order.customerName}
                  detail={order.customerPhone}
                  tone="customer"
                />
                <PersonCard
                  name={order.salespersonName}
                  detail="Salesperson"
                  tone="sales"
                />
                {order.createdBy ? (
                  <PersonCard
                    name={order.createdBy.name}
                    detail="Created by"
                    imageUrl={order.createdBy.image}
                  />
                ) : null}
              </div>
            </div>

            <div className="border-t border-border px-5 py-5">
              <p className="mb-4 text-sm font-semibold text-foreground">
                Details
              </p>
              <dl className="space-y-4">
                <DetailMetric label="Ref code" value={`#${order.refCode}`} />
                <DetailMetric label="Products" value={productCount} />
                <DetailMetric label="Estimates" value={estimations.length} />
                <DetailMetric
                  label="Updated"
                  value=<RelativeTime isoString={order.lastUpdatedAt} />
                />
              </dl>
            </div>
          </section>
        </aside>
      </div>

      <div className="h-16" />
    </div>
  );
}
