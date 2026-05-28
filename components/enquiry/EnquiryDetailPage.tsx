"use client";

import {
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
import { useState, type ReactNode } from "react";
import { EnquiryProductList } from "@/components/enquiry/EnquiryProductList";
import {
  type EnquiryStage,
  EnquiryStageBar,
} from "@/components/enquiry/EnquiryStageBar";
import { ActivityTimeline } from "@/components/order/ActivityTimeline";
import { ComposeBox } from "@/components/order/ComposeBox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/lib/people";
import { cn, formatDate, formatDateTime } from "@/lib/utils";
import type { ActorRole, Order, ProductEstimation, Stage } from "@/types";

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

function PersonCard({
  label,
  name,
  detail,
  imageUrl,
  role,
  icon,
}: {
  label: string;
  name: string;
  detail?: string | null;
  imageUrl?: string | null;
  role?: "customer" | "sales";
  icon?: ReactNode;
}) {
  const roleStyles =
    role === "customer"
      ? "bg-emerald-100 text-emerald-700"
      : role === "sales"
        ? "bg-blue-100 text-blue-700"
        : "bg-muted text-muted-foreground";

  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar className={cn("size-11 shrink-0", roleStyles)}>
        {imageUrl ? <AvatarImage src={imageUrl} alt={name} /> : null}
        <AvatarFallback className={roleStyles}>{getInitials(name)}</AvatarFallback>
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
    <div className="rounded-2xl border border-border bg-muted/30 px-4 py-4">
      <div className="flex items-start gap-3">
        <X className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">
            Enquiry closed
          </p>
          {order.closeReason ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {order.closeReason}
            </p>
          ) : null}
          {order.closeNotes ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {order.closeNotes}
            </p>
          ) : null}
          {order.closedAt ? (
            <p className="mt-1 text-xs text-muted-foreground/70">
              Closed on {formatDateTime(order.closedAt)}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SummaryChip({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-1.5 whitespace-nowrap">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium tabular-nums text-foreground">
        {value}
      </span>
    </div>
  );
}

interface EnquiryDetailPageProps {
  order: Order;
  onSaveEstimation: (productId: string, estimation: ProductEstimation) => void;
  onPostUpdate: (data: {
    name: string;
    role: ActorRole;
    note: string;
    newStage: Stage | null;
  }) => void;
  onCloseEnquiry: () => void;
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

  function handleSaveEstimation(estimation: ProductEstimation) {
    onSaveEstimation(estimation.productId, estimation);
  }

  function handlePostUpdate(data: {
    name: string;
    role: ActorRole;
    note: string;
    newStage: Stage | null;
  }) {
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

      <header className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          Enquiry {formatRefCode(order.refCode)}
        </p>

        <div className="mt-2 flex flex-wrap items-end gap-x-3 gap-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {order.customerName}
          </h1>
          <span className="pb-0.5 text-base text-muted-foreground">
            {formatRefCode(order.refCode)}
          </span>
          {isClosed ? (
            <span className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              Closed
            </span>
          ) : null}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
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
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCloseEnquiry}
              disabled={isClosingEnquiry}
              className="gap-1.5"
            >
              <X className="size-3.5" />
              Close Enquiry
            </Button>
          ) : null}
          <CopyLinkButton />
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

          <section className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl border border-border bg-card px-5 py-4">
            <SummaryChip label="Products" value={selectedProducts.length + customProducts.length} />
            <SummaryChip
              label="Estimated"
              value={`${estimations.length} of ${selectedProducts.length + customProducts.length}`}
            />
            {order.budget ? (
              <SummaryChip
                label="Budget"
                value={new Intl.NumberFormat("en-IN", {
                  style: "currency",
                  currency: "INR",
                  maximumFractionDigits: 0,
                }).format(order.budget)}
              />
            ) : null}
            <SummaryChip label="Updated" value={formatDate(order.lastUpdatedAt)} />
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

          <section className="overflow-hidden rounded-2xl border border-border bg-card">
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
                  currentStage={order.currentStage}
                  onSubmit={handlePostUpdate}
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
                  role="customer"
                  icon={<Phone className="size-3.5" />}
                />
              </div>
              <div className="border-t border-border px-5 py-4">
                <PersonCard
                  label="Salesperson"
                  name={order.salespersonName}
                  role="sales"
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
                icon={<Calendar className="size-3.5" />}
                label="Created"
                value={formatDate(order.createdAt)}
              />
              <InfoRow
                icon={<MapPin className="size-3.5" />}
                label="Last updated"
                value={formatDate(order.lastUpdatedAt)}
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
