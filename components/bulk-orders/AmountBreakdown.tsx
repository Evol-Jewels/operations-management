import { IndianRupee } from "lucide-react";
import { SpecSection } from "@/components/order/SpecSection";
import type { BulkOrderAmounts } from "@/lib/bulkOrders";
import { formatCurrency } from "@/lib/utils";

const ROWS: Array<{
  key: keyof Omit<BulkOrderAmounts, "quoted">;
  label: string;
}> = [
  { key: "metal", label: "Gold / metal" },
  { key: "stone", label: "Diamond / stone" },
  { key: "other", label: "Other / certificate" },
  { key: "labour", label: "Labour / making" },
];

export function AmountBreakdown({
  title = "Amount breakdown",
  amounts,
}: {
  title?: string;
  amounts: BulkOrderAmounts;
}) {
  return (
    <SpecSection icon={IndianRupee} title={title}>
      <dl className="space-y-1.5 text-sm">
        {ROWS.map((row) => (
          <div
            key={row.key}
            className="flex items-center justify-between gap-3"
          >
            <dt className="text-xs text-muted-foreground">{row.label}</dt>
            <dd className="tabular-nums text-foreground">
              {formatCurrency(amounts[row.key])}
            </dd>
          </div>
        ))}
        <div className="flex items-center justify-between gap-3 border-t border-dashed border-border pt-2">
          <dt className="text-xs font-medium text-foreground">Quoted amount</dt>
          <dd className="font-semibold tabular-nums text-foreground">
            {formatCurrency(amounts.quoted)}
          </dd>
        </div>
      </dl>
    </SpecSection>
  );
}
