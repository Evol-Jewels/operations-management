"use client";

import { formatDistanceToNowStrict } from "date-fns";
import { PackagePlus } from "lucide-react";
import Link from "next/link";
import { type ReactNode, useState } from "react";
import { toast } from "sonner";
import { BulkThumbnail } from "@/components/bulk-orders/BulkItemThumbnail";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useRefillRequests,
  useUpdateRefillRequestStatus,
} from "@/hooks/useRefillRequests";
import { getPreviewImageUrls } from "@/lib/inventory-media";
import { getFirstName } from "@/lib/people";
import { formatRefillRef } from "@/lib/refillRequestsApi";
import { cn } from "@/lib/utils";
import type {
  RefillRequest,
  RefillRequestStatus,
} from "@/types/refill-request-api";

const STATUS_LABELS: Record<RefillRequestStatus, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In progress",
  PLACED: "Placed",
  CANCELLED: "Cancelled",
};

const STATUS_CLASSES: Record<RefillRequestStatus, string> = {
  PENDING:
    "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  IN_PROGRESS:
    "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  PLACED:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  CANCELLED: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400",
};

const STATUSES = Object.keys(STATUS_LABELS) as RefillRequestStatus[];

type RefillFilter = "OPEN" | "ALL" | RefillRequestStatus;

function matchesFilter(filter: RefillFilter, status: RefillRequestStatus) {
  if (filter === "ALL") return true;
  if (filter === "OPEN")
    return status === "PENDING" || status === "IN_PROGRESS";
  return status === filter;
}

function timeAgo(value: string) {
  return formatDistanceToNowStrict(new Date(value), { addSuffix: true });
}

function RefillRequestCard({ request }: { request: RefillRequest }) {
  const updateStatus = useUpdateRefillRequestStatus();
  const count = request.items.length;
  const pieces = request.items.reduce(
    (total, item) => total + item.quantity,
    0,
  );

  return (
    <article className="space-y-3 rounded-xl border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium">{request.vendor.name}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            <span className="font-mono">
              {formatRefillRef(request.refCode)}
            </span>{" "}
            · {count} {count === 1 ? "product" : "products"} · {pieces} pcs ·{" "}
            {getFirstName(request.createdBy)} {timeAgo(request.createdAt)}
          </p>
        </div>
        <Select
          value={request.status}
          disabled={updateStatus.isPending}
          onValueChange={(value) => {
            const status = STATUSES.find((option) => option === value);
            if (!status || status === "PENDING") return;
            updateStatus.mutate(
              { refCode: request.refCode, status },
              { onError: (error) => toast.error(error.message) },
            );
          }}
        >
          <SelectTrigger
            size="sm"
            aria-label={`Status of ${formatRefillRef(request.refCode)}`}
            className={cn("w-36", STATUS_CLASSES[request.status])}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            {STATUSES.map((status) => (
              <SelectItem
                key={status}
                value={status}
                disabled={status === "PENDING"}
              >
                {STATUS_LABELS[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {request.notes ? (
        <p className="whitespace-pre-wrap text-sm text-muted-foreground">
          {request.notes}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {request.items.map((item) => (
          <Link
            key={item.productCode}
            href={`/inventory?productCode=${encodeURIComponent(item.productCode)}`}
            title={item.name}
            className="flex items-center gap-2 rounded-lg border p-1 pr-2.5 transition-colors hover:bg-muted/50"
          >
            <BulkThumbnail
              src={
                item.image ? getPreviewImageUrls([item.image])[0] : undefined
              }
              alt={item.name}
              className="size-8"
            />
            <span className="font-mono text-xs">{item.productCode}</span>
            <span className="text-xs font-medium tabular-nums text-muted-foreground">
              ×{item.quantity}
            </span>
          </Link>
        ))}
      </div>

      {request.status !== "PENDING" && request.statusUpdatedBy ? (
        <p className="text-xs text-muted-foreground">
          Marked {STATUS_LABELS[request.status].toLowerCase()} by{" "}
          {getFirstName(request.statusUpdatedBy)} {timeAgo(request.updatedAt)}
        </p>
      ) : null}
    </article>
  );
}

export function RefillRequestsList({
  heading,
}: {
  heading: (count: number) => ReactNode;
}) {
  const [filter, setFilter] = useState<RefillFilter>("OPEN");
  const requestsQuery = useRefillRequests();
  const requests = (requestsQuery.data ?? []).filter((request) =>
    matchesFilter(filter, request.status),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {heading(requests.length)}
        <Select
          value={filter}
          onValueChange={(value) =>
            setFilter(
              value === "ALL"
                ? "ALL"
                : (STATUSES.find((status) => status === value) ?? "OPEN"),
            )
          }
        >
          <SelectTrigger aria-label="Filter refill requests by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="OPEN">Pending & in progress</SelectItem>
            <SelectItem value="ALL">All statuses</SelectItem>
            {STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {STATUS_LABELS[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {requestsQuery.isLoading ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          Loading refill requests...
        </p>
      ) : requestsQuery.isError ? (
        <p className="py-16 text-center text-sm text-destructive">
          {requestsQuery.error.message}
        </p>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <PackagePlus className="size-7 text-muted-foreground" />
          <p className="text-sm font-medium">
            {filter === "OPEN"
              ? "No open refill requests"
              : "No refill requests match this filter"}
          </p>
          <p className="max-w-sm px-4 text-sm text-muted-foreground">
            Select products in Recent sales to request a refill from their
            vendor.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {requests.map((request) => (
            <RefillRequestCard key={request.id} request={request} />
          ))}
        </div>
      )}
    </div>
  );
}
