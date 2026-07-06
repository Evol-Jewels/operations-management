"use client";

import { ArrowLeft, Check, Copy } from "lucide-react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { UrgencyDot } from "@/components/dashboard/UrgencyDot";
import { ActivityTimeline } from "@/components/order/ActivityTimeline";
import { CloseEnquiryDialog } from "@/components/order/CloseEnquiryDialog";
import { ComposeBox } from "@/components/order/ComposeBox";
import { DownloadPDFButton } from "@/components/order/DownloadPDFButton";
import { OrderDetails } from "@/components/order/OrderDetails";
import { OrderPrintView } from "@/components/order/OrderPrintView";
import { ProductionSpecCard } from "@/components/order/ProductionSpecCard";
import { StageBar } from "@/components/order/StageBar";
import { StageHint } from "@/components/order/StageHint";
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
import { useMyInternalProfile } from "@/hooks/useInternalProfile";
import {
  orderKeys,
  useOrderDetails,
  useUpdateOrderStatus,
} from "@/hooks/useOrders";
import { useComments, useCreateComment } from "@/hooks/useSourceActivity";
import { mapBackendOrderDetailsToOrder } from "@/lib/orderMappers";
import { cn, formatDaysRemaining, getUrgencyLevel } from "@/lib/utils";
import type { ActorRole, Order } from "@/types";
import type { BackendOrderStatus } from "@/types/order-api";

const ORDER_STATUS_OPTIONS: Array<{
  value: BackendOrderStatus;
  label: string;
}> = [
  { value: "NEW", label: "New" },
  { value: "IN_PRODUCTION", label: "In Production" },
  { value: "CAD_DESIGN", label: "CAD Design" },
  { value: "IN_TRANSIT", label: "In Transit" },
  { value: "CERTIFICATION", label: "Certification" },
  { value: "AT_STORE", label: "At Store" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CLOSED", label: "Closed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const LOCKED_ORDER_STATUSES = new Set<BackendOrderStatus>([
  "CLOSED",
  "CANCELLED",
]);

const NOTE_REQUIRED_STATUSES = new Set<BackendOrderStatus>([
  "CLOSED",
  "CANCELLED",
]);

function getOrderStatusLabel(status: BackendOrderStatus): string {
  return (
    ORDER_STATUS_OPTIONS.find((option) => option.value === status)?.label ??
    status
  );
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

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

function OrderStatusControl({
  refCode,
  status,
  canUpdate,
}: {
  refCode: string | number;
  status?: BackendOrderStatus;
  canUpdate: boolean;
}) {
  const updateStatus = useUpdateOrderStatus(refCode);
  const createCommentMutation = useCreateComment("ORDER", Number(refCode), {
    invalidateQueryKeys: [orderKeys.detail(refCode)],
  });
  const [pendingStatus, setPendingStatus] = useState<BackendOrderStatus | null>(
    null,
  );
  const [statusNote, setStatusNote] = useState("");

  if (!status) return null;

  const isLocked = LOCKED_ORDER_STATUSES.has(status);
  const label = getOrderStatusLabel(status);
  const pendingStatusLabel = pendingStatus
    ? getOrderStatusLabel(pendingStatus)
    : "";
  const isUpdating = updateStatus.isPending || createCommentMutation.isPending;

  async function handleStatusChange(nextStatus: BackendOrderStatus) {
    try {
      await updateStatus.mutateAsync({ status: nextStatus });
      toast.success(
        `Order status changed to ${getOrderStatusLabel(nextStatus)}`,
      );
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not update order status"));
    }
  }

  async function handleConfirmTerminalStatus() {
    const note = statusNote.trim();
    if (!pendingStatus || !note) return;

    try {
      await updateStatus.mutateAsync({ status: pendingStatus });
      await createCommentMutation.mutateAsync(note);
      toast.success(`Order status changed to ${pendingStatusLabel}`);
      setPendingStatus(null);
      setStatusNote("");
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not update order status"));
    }
  }

  if (!canUpdate) {
    return (
      <span className="inline-flex h-8 items-center rounded-md border border-border bg-muted/30 px-2.5 text-xs font-medium text-muted-foreground">
        {label}
      </span>
    );
  }

  return (
    <>
      <Select
        value={status}
        disabled={isLocked || isUpdating}
        onValueChange={(nextStatus) => {
          const typedStatus = nextStatus as BackendOrderStatus;
          if (typedStatus === status) return;

          if (NOTE_REQUIRED_STATUSES.has(typedStatus)) {
            setPendingStatus(typedStatus);
            setStatusNote("");
            return;
          }

          void handleStatusChange(typedStatus);
        }}
      >
        <SelectTrigger
          size="sm"
          className="h-8 min-w-36 text-xs"
          title={
            isLocked ? "Closed and cancelled orders are locked" : undefined
          }
        >
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent align="end">
          {ORDER_STATUS_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Dialog
        open={Boolean(pendingStatus)}
        onOpenChange={(open) => {
          if (open) return;
          setPendingStatus(null);
          setStatusNote("");
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mark order as {pendingStatusLabel}</DialogTitle>
            <DialogDescription>
              Add the required note for this status change. It will be posted to
              the order activity as a comment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="terminal-status-note">
              Notes <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="terminal-status-note"
              value={statusNote}
              onChange={(event) => setStatusNote(event.target.value)}
              placeholder="Add the closing or cancellation note..."
              rows={4}
              disabled={isUpdating}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              disabled={!statusNote.trim() || isUpdating}
              onClick={handleConfirmTerminalStatus}
            >
              {isUpdating ? "Saving..." : `Mark as ${pendingStatusLabel}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
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
    sales:
      "bg-blue-500/10 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
    vendor:
      "bg-amber-500/10 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
    owner:
      "bg-purple-500/10 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
    customer:
      "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
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
            {name?.slice(0, 2).toUpperCase()}
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
  const refCode = params.token as string;
  const numericRefCode = Number(refCode);
  const orderQuery = useOrderDetails(refCode);
  const profileQuery = useMyInternalProfile();
  const sessionRole = profileQuery.data?.profile?.role;
  const canUpdateOrderStatus =
    sessionRole === "OPERATIONS" || sessionRole === "ADMIN";
  const commentsQuery = useComments("ORDER", numericRefCode);
  const createCommentMutation = useCreateComment("ORDER", numericRefCode, {
    invalidateQueryKeys: [orderKeys.detail(refCode)],
  });
  const order = orderQuery.data
    ? mapBackendOrderDetailsToOrder(orderQuery.data, commentsQuery.data ?? [])
    : null;

  if (orderQuery.isError) notFound();
  if (orderQuery.isLoading || !order) {
    return (
      <div className="mx-auto max-w-3xl py-20 text-center text-sm text-muted-foreground">
        Loading record...
      </div>
    );
  }

  const urgency = getUrgencyLevel(order.deliveryDate);
  const daysLabel = formatDaysRemaining(order.deliveryDate);
  const isTerminalOrder =
    order.orderStatus === "CLOSED" || order.orderStatus === "CANCELLED";

  async function handlePostUpdate({ message }: { message: string }) {
    const note = message.trim();
    if (!note) return;

    await createCommentMutation.mutateAsync(note);

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
          <Link href="/orders-workspace">
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
          {order.deliveryDate && !isTerminalOrder && (
            <span
              className={cn(
                "flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                urgency === "overdue" &&
                  "bg-red-500/10 text-red-600 dark:bg-red-500/10 dark:text-red-400",
                urgency === "due-soon" &&
                  "bg-amber-500/10 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
                urgency === "on-track" &&
                  "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
              )}
            >
              <UrgencyDot level={urgency} />
              {daysLabel}
            </span>
          )}
          {/* Actions — pushed right, wraps on mobile if needed */}
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <OrderStatusControl
              refCode={refCode}
              status={order.orderStatus}
              canUpdate={canUpdateOrderStatus}
            />
            {order.type === "enquiry" && order.status !== "closed" && (
              <CloseEnquiryDialog orderId={order.id} />
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
      {order.orderStatus !== "CANCELLED" && (
        <div className="mb-5 rounded-xl border border-border bg-card px-5 py-4">
          <StageBar
            currentStage={order.currentStage}
            cadDesignRequired={order.cadDesignRequired}
          />
        </div>
      )}

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
          <ComposeBox onSubmit={handlePostUpdate} />
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
