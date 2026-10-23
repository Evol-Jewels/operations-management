"use client";

import { useBulkOrderRecord } from "@/hooks/useBulkOrders";

const formatMoney = (value: string) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value));

export function BulkDocumentTotals({ refCode }: { refCode: number }) {
  const { data: order } = useBulkOrderRecord(refCode);
  if (!order) return null;
  const rows = [
    ["Document subtotal", order.quotedSubtotal],
    [`Tax (${order.taxRate}%)`, order.taxAmount],
    ["Rounding", order.roundingAmount],
    ["Document total", order.quotedTotal],
  ];
  return (
    <div className="space-y-3 border-t p-4 sm:px-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Document totals</h2>
        {order.documentUrl && (
          <a
            href={order.documentUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs underline underline-offset-4"
          >
            View packing list
          </a>
        )}
      </div>
      <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-3 text-sm">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="font-medium tabular-nums">{formatMoney(value)}</dd>
          </div>
        ))}
      </dl>
      {order.reconciliation?.hasDifference && (
        <p
          aria-live="polite"
          className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs leading-5 text-amber-800 dark:text-amber-300"
        >
          Reconciliation: document subtotal differs from all lines by{" "}
          {formatMoney(order.reconciliation.subtotalDifference)}; document total
          differs from subtotal, tax and rounding by{" "}
          {formatMoney(order.reconciliation.totalDifference)}.
        </p>
      )}
    </div>
  );
}
