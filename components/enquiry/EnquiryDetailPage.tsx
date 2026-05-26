"use client";

import { ArrowLeft, Calendar, Check, Copy, Phone, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { EnquiryProductList } from "@/components/enquiry/EnquiryProductList";
import {
  type EnquiryStage,
  EnquiryStageBar,
} from "@/components/enquiry/EnquiryStageBar";
import { ActivityTimeline } from "@/components/order/ActivityTimeline";
import { ComposeBox } from "@/components/order/ComposeBox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getFirstName, getInitials } from "@/lib/people";
import { cn, formatDate, formatDateTime } from "@/lib/utils";
import type { ActorRole, Order, ProductEstimation, Stage } from "@/types";
import { ACTOR_ROLE_COLORS } from "@/types";

function deriveEnquiryStage(order: Order): EnquiryStage {
  if (order.status === "closed") return "Closed / Converted";
  if (order.currentStage === "Estimation" || order.estimations?.length) {
    return "Estimation Submitted";
  }
  return "Enquiry Created";
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
          <Check className="size-3.5 text-muted-foreground" />
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

function ContactCard({
  icon,
  label,
  name,
  detail,
  actorRole,
  imageUrl,
}: {
  icon?: React.ReactNode;
  label: string;
  name: string;
  detail?: string;
  actorRole?: ActorRole;
  imageUrl?: string | null;
}) {
  const colors = actorRole ? ACTOR_ROLE_COLORS[actorRole] : null;

  return (
    <div className="flex min-w-0 items-center gap-3">
      {imageUrl || actorRole ? (
        <Avatar
          className={cn(
            "size-11 shrink-0 text-sm font-semibold",
            colors
              ? [colors.bg, colors.text]
              : "bg-muted text-muted-foreground",
          )}
        >
          {imageUrl ? <AvatarImage src={imageUrl} alt={name} /> : null}
          <AvatarFallback
            className={cn(
              colors
                ? [colors.bg, colors.text]
                : "bg-muted text-muted-foreground",
            )}
          >
            {getInitials(name)}
          </AvatarFallback>
        </Avatar>
      ) : (
        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="truncate text-base font-medium text-foreground">{name}</p>
        {detail ? (
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
            {label === "Customer" ? <Phone className="size-3.5" /> : null}
            {detail}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function ClosedBanner({ order }: { order: Order }) {
  if (order.status !== "closed") return null;

  return (
    <div className="rounded-xl border border-border bg-muted/30 px-4 py-3.5">
      <div className="flex items-start gap-3">
        <X className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">
            Enquiry Closed
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
      document
        .getElementById("timeline-end")
        ?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 100);
  }

  return (
    <div className="mx-auto w-full max-w-4xl">
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
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-border bg-background px-3 py-1 text-sm text-muted-foreground">
            Enquiry
          </span>
          {isClosed ? (
            <span className="rounded-full border border-border bg-muted px-3 py-1 text-sm text-muted-foreground">
              Closed
            </span>
          ) : null}
          <div className="ml-auto flex flex-wrap items-center gap-2">
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
        </div>

        <h1 className="mb-5 text-2xl font-semibold tracking-tight text-foreground">
          {order.customerName}
        </h1>
      </header>

      {isClosed ? (
        <div className="mb-5">
          <ClosedBanner order={order} />
        </div>
      ) : null}

      <div className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(20rem,1fr)]">
        <section className="flex items-center rounded-xl border border-border bg-card p-4">
          <EnquiryStageBar currentStage={stage} />
        </section>

        <section className="rounded-xl border border-border bg-card px-5 py-5">
          <div className="grid gap-5 sm:grid-cols-3 lg:grid-cols-1">
            <ContactCard
              label="Customer"
              name={order.customerName}
              detail={order.customerPhone}
              actorRole="customer"
            />
            <ContactCard
              label="Salesperson"
              name={getFirstName(order.salespersonName)}
              actorRole="sales"
            />
            <ContactCard
              label="Created By"
              name={getFirstName(order.createdBy)}
              actorRole="sales"
              imageUrl={order.createdBy?.image}
            />
            <ContactCard
              label="Created"
              name={formatDate(order.createdAt)}
              icon={<Calendar className="size-5" />}
            />
          </div>
        </section>
      </div>

      <section className="mb-6">
        <EnquiryProductList
          selectedProducts={selectedProducts}
          customProducts={customProducts}
          estimations={estimations}
          isClosed={isClosed}
          onSaveEstimation={handleSaveEstimation}
          isSavingEstimation={isSavingEstimation}
        />
      </section>

      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Activity
          </span>
          <span className="text-sm text-muted-foreground">
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
            <p className="mb-3 text-[0.625rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
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

      <div className="h-16" />
    </div>
  );
}
