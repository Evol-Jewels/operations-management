"use client";

import { ArrowLeft, Check, Copy, GitPullRequest } from "lucide-react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useState } from "react";
import { UrgencyDot } from "@/components/dashboard/UrgencyDot";
import { ActivityTimeline } from "@/components/order/ActivityTimeline";
import { ComposeBox } from "@/components/order/ComposeBox";
import { DownloadPDFButton } from "@/components/order/DownloadPDFButton";
import { OrderDetails } from "@/components/order/OrderDetails";
import { OrderPrintView } from "@/components/order/OrderPrintView";
import { ProductionSpecCard } from "@/components/order/ProductionSpecCard";
import { StageBar } from "@/components/order/StageBar";
import { StageHint } from "@/components/order/StageHint";
import { Button } from "@/components/ui/button";
import { getOrderByToken } from "@/lib/mock-data";
import {
  cn,
  formatDate,
  formatDaysRemaining,
  getUrgencyLevel,
} from "@/lib/utils";
import type { ActivityEntry, ActorRole, Order, Stage } from "@/types";

// ─── Copy link button ─────────────────────────────────────────────────────────

function CopyLinkButton() {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className="h-8 gap-1.5 text-xs"
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-emerald-600" />
          Copied
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" />
          Copy link
        </>
      )}
    </Button>
  );
}

// ─── Actors bar — who is involved in this order ───────────────────────────────

function ActorsBar({ order }: { order: Order }) {
  const actors = [
    { role: "sales" as ActorRole, label: "Sales", name: order.salespersonName },
    ...(order.vendorName
      ? [
          {
            role: "vendor" as ActorRole,
            label: "Vendor",
            name: order.vendorName,
          },
        ]
      : []),
    {
      role: "customer" as ActorRole,
      label: "Customer",
      name: order.customerName,
    },
  ];

  const roleColors: Record<ActorRole, string> = {
    sales: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    vendor: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    owner:
      "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
    customer:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {actors.map(({ role, label, name }) => (
        <div
          key={role}
          className="flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1"
        >
          <div
            className={cn(
              "flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold",
              roleColors[role],
            )}
          >
            {name.slice(0, 2).toUpperCase()}
          </div>
          <span className="text-xs text-muted-foreground">{label}:</span>
          <span className="text-xs font-medium text-foreground">{name}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OrderPage() {
  const params = useParams();
  const token = params.token as string;

  const initialOrder = getOrderByToken(token);
  if (!initialOrder) notFound();

  const [order, setOrder] = useState<Order>(initialOrder);

  const urgency = getUrgencyLevel(order.deliveryDate);
  const daysLabel = formatDaysRemaining(order.deliveryDate);

  function handlePostUpdate({
    name,
    role,
    note,
    newStage,
  }: {
    name: string;
    role: ActorRole;
    note: string;
    newStage: Stage | null;
  }) {
    const timestamp = new Date().toISOString();
    const newEntries: ActivityEntry[] = [];

    if (newStage && newStage !== order.currentStage) {
      newEntries.push({
        id: `act-${Date.now()}-stage`,
        orderId: order.id,
        postedBy: name,
        actorRole: role,
        timestamp,
        type: "stage_change",
        previousStage: order.currentStage,
        newStage,
        note: note || undefined,
      });
    } else if (note) {
      newEntries.push({
        id: `act-${Date.now()}-note`,
        orderId: order.id,
        postedBy: name,
        actorRole: role,
        timestamp,
        type: "note",
        note,
      });
    }

    if (newEntries.length === 0) return;

    setOrder((prev) => ({
      ...prev,
      currentStage: newStage ?? prev.currentStage,
      lastUpdatedAt: timestamp,
      activityFeed: [...prev.activityFeed, ...newEntries],
    }));

    // Scroll to bottom of timeline after a tick
    setTimeout(() => {
      document
        .getElementById("timeline-end")
        ?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 100);
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* ── Back nav ─────────────────────────────────────────────────── */}
      <div className="mb-5">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="-ml-2 gap-1.5 text-muted-foreground"
        >
          <Link href="/">
            <ArrowLeft className="h-3.5 w-3.5" />
            All orders
          </Link>
        </Button>
      </div>

      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="mb-6">
        {/* Customer name — first on mobile for immediate context */}
        <h1 className="mb-2 text-xl font-semibold tracking-tight text-foreground">
          {order.customerName}
          <span className="ml-2 font-normal text-muted-foreground">·</span>
          <span className="ml-2 text-base font-normal text-muted-foreground">
            {order.category}
          </span>
        </h1>

        {/* Type + order number + urgency + actions — wraps cleanly on mobile */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-medium",
              order.type === "order"
                ? "bg-foreground text-background"
                : "border border-border text-muted-foreground",
            )}
          >
            {order.type === "order" ? "Order" : "Enquiry"}
          </span>
          {order.orderNumber && (
            <span className="font-mono text-sm text-muted-foreground">
              {order.orderNumber}
            </span>
          )}
          {/* Urgency */}
          {order.deliveryDate && (
            <span
              className={cn(
                "flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                urgency === "overdue" &&
                  "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400",
                urgency === "due-soon" &&
                  "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
                urgency === "on-track" &&
                  "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
              )}
            >
              <UrgencyDot level={urgency} />
              {daysLabel}
            </span>
          )}
          {/* Actions — pushed right, wraps on mobile if needed */}
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {order.type === "enquiry" && (
              <Button size="sm" asChild className="h-8 gap-1.5 text-xs">
                <Link href={`/orders/new?from=${order.id}`}>
                  <GitPullRequest className="h-3.5 w-3.5" />
                  <span className="hidden xs:inline sm:inline">
                    Convert to Order
                  </span>
                  <span className="xs:hidden sm:hidden">Convert</span>
                </Link>
              </Button>
            )}
            <CopyLinkButton />
            <DownloadPDFButton />
          </div>
        </div>

        {/* Actors bar */}
        <ActorsBar order={order} />
      </div>

      {/* ── Stage hint — contextual next step for this stage ─────────── */}
      <div className="mb-5">
        <StageHint currentStage={order.currentStage} />
      </div>

      {/* ── Stage Bar ────────────────────────────────────────────────── */}
      <div className="mb-5 rounded-xl border border-border bg-card px-5 py-4">
        <StageBar
          currentStage={order.currentStage}
          cadDesignRequired={order.cadDesignRequired}
        />
      </div>

      {/* ── Production Spec Card — vendor-facing work order summary ─────── */}
      {order.type === "order" && (
        <div className="mb-5">
          <ProductionSpecCard order={order} />
        </div>
      )}

      {/* ── Order Details (collapsible, default open) ────────────────── */}
      <div className="mb-5">
        <OrderDetails order={order} defaultOpen={false} />
      </div>

      {/* ── Timeline ─────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {/* Timeline header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
            Activity
          </span>
          <span className="text-xs text-muted-foreground">
            {order.activityFeed.length}{" "}
            {order.activityFeed.length === 1 ? "event" : "events"}
          </span>
        </div>

        {/* Events */}
        <div className="px-5 pt-5">
          <ActivityTimeline entries={order.activityFeed} />
        </div>

        {/* Divider between timeline and compose */}
        <div className="mx-5 border-t border-dashed border-border" />

        {/* Compose box — inline continuation of the thread */}
        <div className="px-5 pb-5 pt-4">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
            Post an update
          </p>
          <ComposeBox
            currentStage={order.currentStage}
            onSubmit={handlePostUpdate}
          />
        </div>

        {/* Scroll anchor */}
        <div id="timeline-end" />
      </div>

      <div className="h-16" />

      {/* ── Print-only document — hidden in UI, shown when printing ── */}
      <OrderPrintView order={order} />
    </div>
  );
}
