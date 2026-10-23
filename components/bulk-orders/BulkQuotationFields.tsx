"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  SectionShell,
  TextField,
} from "@/components/requirements/RequirementFields";
import type { RequirementDraft } from "@/components/requirements/requirement-form-types";
import { Button } from "@/components/ui/button";
import type { BackendQuotationBreakdown } from "@/types/bulk-order-api";
import { quotationSubtotal } from "./bulk-order-edit";

export function BulkQuotationFields({
  quote,
  draft,
  onChange,
}: {
  quote: BackendQuotationBreakdown;
  draft: RequirementDraft;
  onChange: (quote: BackendQuotationBreakdown) => void;
}) {
  const [chargeIds, setChargeIds] = useState(() =>
    quote.other.map(() => crypto.randomUUID()),
  );
  let total = "—";
  try {
    total = quotationSubtotal(quote);
  } catch {
    /* Show the validation error when saving. */
  }
  return (
    <SectionShell eyebrow="Quotation" title="Line quotation · INR">
      <p className="text-xs text-muted-foreground">
        Amounts cover the complete line quantity.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {(["metal", "labour"] as const).map((key) => (
          <div key={key} className="space-y-3 rounded-lg border p-3">
            <TextField
              label={`${key === "metal" ? "Metal" : "Labour"} rate`}
              inputMode="decimal"
              value={quote[key].rate ?? ""}
              onChange={(rate) =>
                onChange({
                  ...quote,
                  [key]: { ...quote[key], rate: rate || undefined },
                })
              }
            />
            <TextField
              label={`${key === "metal" ? "Metal" : "Labour"} amount`}
              inputMode="decimal"
              value={quote[key].amount}
              onChange={(amount) =>
                onChange({ ...quote, [key]: { ...quote[key], amount } })
              }
            />
          </div>
        ))}
      </div>
      {(["diamonds", "colorStones"] as const).flatMap((key) =>
        quote[key].map((row, index) => {
          const spec = draft[key].find((stone) => stone.id === row.specId);
          const name = `${key === "diamonds" ? "Diamond" : "Color stone"} ${index + 1}`;
          const update = (patch: Partial<typeof row>) =>
            onChange({
              ...quote,
              [key]: quote[key].map((value) =>
                value.specId === row.specId ? { ...value, ...patch } : value,
              ),
            });
          return (
            <div
              key={`${key}-${row.specId}`}
              className="space-y-3 rounded-lg border p-3"
            >
              <p className="text-xs font-medium">
                {name}
                {spec?.shape ? ` · ${spec.shape}` : ""}
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label={`${name} rate`}
                  inputMode="decimal"
                  value={row.rate ?? ""}
                  onChange={(rate) => update({ rate: rate || undefined })}
                />
                <TextField
                  label={`${name} amount`}
                  inputMode="decimal"
                  value={row.amount}
                  onChange={(amount) => update({ amount })}
                />
              </div>
            </div>
          );
        }),
      )}
      {quote.other.map((row, index) => (
        <div key={chargeIds[index]} className="flex items-end gap-2">
          <div className="grid min-w-0 flex-1 gap-4 sm:grid-cols-2">
            <TextField
              label={`Other charge ${index + 1}`}
              value={row.code}
              onChange={(code) =>
                onChange({
                  ...quote,
                  other: quote.other.map((value, i) =>
                    i === index ? { ...value, code } : value,
                  ),
                })
              }
            />
            <TextField
              label={`Other amount ${index + 1}`}
              inputMode="decimal"
              value={row.amount}
              onChange={(amount) =>
                onChange({
                  ...quote,
                  other: quote.other.map((value, i) =>
                    i === index ? { ...value, amount } : value,
                  ),
                })
              }
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Remove other charge ${index + 1}`}
            onClick={() => {
              setChargeIds(chargeIds.filter((_, i) => i !== index));
              onChange({
                ...quote,
                other: quote.other.filter((_, i) => i !== index),
              });
            }}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          setChargeIds([...chargeIds, crypto.randomUUID()]);
          onChange({
            ...quote,
            other: [
              ...quote.other,
              { code: `Charge ${quote.other.length + 1}`, amount: "0.00" },
            ],
          });
        }}
      >
        <Plus className="size-4" />
        Add charge
      </Button>
      <TextField
        label="Setting amount"
        inputMode="decimal"
        value={quote.setting}
        onChange={(setting) => onChange({ ...quote, setting })}
      />
      <div className="flex justify-between rounded-lg bg-muted px-4 py-3 text-sm font-semibold">
        <span>Line subtotal</span>
        <output className="tabular-nums">{total}</output>
      </div>
    </SectionShell>
  );
}
