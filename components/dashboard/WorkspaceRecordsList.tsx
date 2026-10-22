"use client";

import { Gem } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { OrderTypeBadge } from "@/components/orders/order-type-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getRecordStatus } from "@/lib/enquiryStatus";
import { getFirstName, getInitials, normalizePerson } from "@/lib/people";
import { cn, formatDate, getUrgencyLevel, isTerminalRecord } from "@/lib/utils";
import { statusBadgeClass } from "@/lib/workspaceRecords";
import type { Order, PersonSummary } from "@/types";
import { DueValue, formatCardDate } from "./KanbanRecordCard";

interface RecordsProps {
  records: Order[];
  onRowClick: (record: Order) => void;
  showOrderType: boolean;
  canOpenDetails?: boolean;
}

function PersonAvatar({
  person,
  className,
}: {
  person?: PersonSummary | string;
  className?: string;
}) {
  const normalized = normalizePerson(person);

  return (
    <Avatar className={cn("size-7 shrink-0", className)}>
      {normalized.image ? (
        <AvatarImage src={normalized.image} alt={normalized.name} />
      ) : null}
      <AvatarFallback className="text-xs font-medium">
        {getInitials(normalized)}
      </AvatarFallback>
    </Avatar>
  );
}

function getReference(record: Order) {
  return record.type === "enquiry"
    ? `#${record.refCode}`
    : (record.orderNumber ?? `#${record.refCode}`);
}

function getOrderTypeLabel(record: Order) {
  if (record.isRefill) return "Stock refill";
  if (record.productType === "EXISTING") return "Stock order";
  return record.productType ? "Custom order" : null;
}

function EmptyRecords() {
  return (
    <div className="rounded-xl border border-dashed border-border py-12 text-center md:py-16">
      <p className="text-sm font-medium text-muted-foreground">
        No records match these filters
      </p>
      <p className="mt-1 text-xs text-muted-foreground/70">
        Clear filters or switch tabs to see more records.
      </p>
    </div>
  );
}

function RecordThumb({ record }: { record: Order }) {
  const [failed, setFailed] = useState(false);
  const cover = record.previewImages?.[0];

  return (
    <div
      className={cn(
        "relative size-12 shrink-0 overflow-hidden rounded-lg border border-border/60",
        cover && !failed ? "bg-white" : "bg-muted/40",
      )}
    >
      {cover && !failed ? (
        <Image
          src={cover}
          alt=""
          fill
          sizes="48px"
          unoptimized
          className="object-contain p-1"
          onError={() => setFailed(true)}
        />
      ) : (
        <Gem
          className="absolute inset-0 m-auto size-5 text-muted-foreground/40"
          strokeWidth={1.5}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

function RecordsMobileList({
  records,
  onRowClick,
  showOrderType,
  canOpenDetails = true,
}: RecordsProps) {
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
      {records.map((record) => {
        const status = getRecordStatus(record);
        const showDue =
          record.type === "order" &&
          Boolean(record.deliveryDate) &&
          !isTerminalRecord(record);
        const meta = [
          showOrderType ? getOrderTypeLabel(record) : null,
          getFirstName(record.createdBy ?? record.salespersonName),
        ].filter((item): item is string => Boolean(item));

        return (
          <li key={record.id}>
            <button
              type="button"
              onClick={() => onRowClick(record)}
              disabled={!canOpenDetails && record.type === "enquiry"}
              className="flex min-h-16 w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none disabled:cursor-default"
            >
              <RecordThumb record={record} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                    {record.customerName}
                  </p>
                  <Badge
                    variant="outline"
                    className={cn(
                      "h-5 shrink-0 px-1.5 text-[10px] whitespace-nowrap",
                      statusBadgeClass(status),
                    )}
                  >
                    {status}
                  </Badge>
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="min-w-0 flex-1 truncate">
                    <span className="font-mono">{getReference(record)}</span>
                    {meta.map((item) => (
                      <span key={item}> · {item}</span>
                    ))}
                  </span>
                  <span className="shrink-0 text-[11px] font-medium tabular-nums">
                    {showDue && record.deliveryDate ? (
                      <DueValue
                        date={record.deliveryDate}
                        urgency={getUrgencyLevel(record.deliveryDate)}
                      />
                    ) : (
                      formatCardDate(record.createdAt)
                    )}
                  </span>
                </div>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function RecordsTable({
  records,
  onRowClick,
  showOrderType,
  canOpenDetails = true,
}: RecordsProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="min-w-52">Customer</TableHead>
              {showOrderType ? <TableHead>Order type</TableHead> : null}
              <TableHead className="min-w-28">Status</TableHead>
              <TableHead className="min-w-28">Created</TableHead>
              <TableHead className="min-w-32">Created By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record) => {
              const status = getRecordStatus(record);
              const href =
                record.type === "enquiry"
                  ? `/enquiries/${record.refCode}`
                  : `/orders/${record.refCode}`;

              return (
                <TableRow
                  key={record.id}
                  className={
                    canOpenDetails || record.type === "order"
                      ? "cursor-pointer"
                      : undefined
                  }
                  onClick={() => onRowClick(record)}
                >
                  <TableCell>
                    <div className="min-w-0">
                      {canOpenDetails ? (
                        <Link
                          href={href}
                          className="font-medium text-foreground"
                        >
                          {record.customerName}
                        </Link>
                      ) : (
                        <span className="font-medium text-foreground">
                          {record.customerName}
                        </span>
                      )}
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {getReference(record)}
                      </p>
                    </div>
                  </TableCell>
                  {showOrderType ? (
                    <TableCell>
                      <OrderTypeBadge
                        productType={record.productType}
                        isRefill={record.isRefill}
                      />
                    </TableCell>
                  ) : null}
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "whitespace-nowrap",
                        statusBadgeClass(status),
                      )}
                    >
                      {status}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatDate(record.createdAt)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <PersonAvatar
                        person={record.createdBy ?? record.salespersonName}
                      />
                      <span className="truncate text-foreground">
                        {getFirstName(
                          record.createdBy ?? record.salespersonName,
                        )}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function WorkspaceRecordsList(props: RecordsProps) {
  if (props.records.length === 0) return <EmptyRecords />;

  return (
    <>
      <div className="md:hidden">
        <RecordsMobileList {...props} />
      </div>
      <div className="hidden md:block">
        <RecordsTable {...props} />
      </div>
    </>
  );
}
