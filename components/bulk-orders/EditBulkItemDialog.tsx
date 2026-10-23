"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ColorStoneDetailsSection } from "@/components/requirements/ColorStoneDetailsSection";
import { DiamondDetailsSection } from "@/components/requirements/DiamondDetailsSection";
import { RequirementBasicsSection } from "@/components/requirements/RequirementBasicsSection";
import {
  NotesField,
  OptionTextField,
  SectionShell,
  TextField,
} from "@/components/requirements/RequirementFields";
import {
  CERTIFICATIONS,
  METAL_TYPES,
  POLISH_OPTIONS,
} from "@/components/requirements/requirement-options";
import { useUpdateBulkOrderItem } from "@/hooks/useBulkOrders";
import { formatBulkOrderRef } from "@/lib/bulkOrders";
import type { BackendBulkOrderItem } from "@/types/bulk-order-api";
import { BulkEditDialog } from "./BulkEditDialog";
import { BulkQuotationFields } from "./BulkQuotationFields";
import {
  buildItemPatch,
  buildProductInput,
  centsToMoney,
  createItemDraft,
  moneyToCents,
  quotationSubtotal,
  syncStoneQuotes,
} from "./bulk-order-edit";

export function EditBulkItemDialog({
  refCode,
  item,
  onClose,
}: {
  refCode: number;
  item: BackendBulkOrderItem;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(() => createItemDraft(item));
  const [fields, setFields] = useState({
    vendorDesignNumber: item.vendorDesignNumber,
    quantity: String(item.quantity),
    notes: item.notes ?? "",
    estimatedDeliveryDate: item.estimatedDeliveryDate ?? "",
    vendorDeliveryDate: item.vendorDeliveryDate ?? "",
    isCadRequired: item.isCadRequired,
  });
  const [weights, setWeights] = useState({
    size:
      item.customProduct?.size == null ? "" : String(item.customProduct.size),
    gross: item.customProduct?.metalGrossWeight ?? "",
    pure: item.customProduct?.metalPureWeight ?? "",
  });
  const [quote, setQuote] = useState(() =>
    structuredClone(item.quotationBreakdown),
  );
  const currentQuote = syncStoneQuotes(quote, draft);
  const mutation = useUpdateBulkOrderItem(refCode, item.refCode);
  const field = (
    key: Exclude<keyof typeof fields, "isCadRequired">,
    label: string,
    type = "text",
  ) => (
    <TextField
      label={label}
      type={type}
      value={fields[key]}
      onChange={(value) => setFields({ ...fields, [key]: value })}
    />
  );
  const updateDetails = (key: string, value: string) =>
    setDraft({ ...draft, details: { ...draft.details, [key]: value } });
  return (
    <BulkEditDialog
      title="Edit bulk order item"
      description={`${formatBulkOrderRef(refCode)} · Item ${item.bulkSerialNumber} · ${item.vendorDesignNumber}`}
      pending={mutation.isPending}
      onClose={onClose}
      onSave={async () => {
        const component = (row: { rate?: string; amount: string }) => ({
          ...(row.rate?.trim()
            ? { rate: centsToMoney(moneyToCents(row.rate)) }
            : {}),
          amount: centsToMoney(moneyToCents(row.amount)),
        });
        const quotationBreakdown = {
          metal: component(currentQuote.metal),
          labour: component(currentQuote.labour),
          diamonds: currentQuote.diamonds.map((row) => ({
            specId: row.specId,
            ...component(row),
          })),
          colorStones: currentQuote.colorStones.map((row) => ({
            specId: row.specId,
            ...component(row),
          })),
          other: currentQuote.other.map((row) => {
            if (!row.code.trim())
              throw new Error("Enter a name for each other charge.");
            return {
              code: row.code.trim(),
              amount: centsToMoney(moneyToCents(row.amount)),
            };
          }),
          setting: centsToMoney(moneyToCents(currentQuote.setting)),
        };
        const input = buildItemPatch(item, {
          ...fields,
          vendorDesignNumber: fields.vendorDesignNumber.trim(),
          quantity: Number(fields.quantity),
          notes: fields.notes.trim() || null,
          estimatedDeliveryDate: fields.estimatedDeliveryDate || null,
          vendorDeliveryDate: fields.vendorDeliveryDate || null,
          customProduct: buildProductInput(item, draft, weights),
          requirementSpecification: {
            ...item.customProduct?.requirementSpecification,
            details: Object.fromEntries(
              Object.entries(draft.details).map(([key, value]) => [
                key,
                value?.trim() || undefined,
              ]),
            ),
            diamonds: draft.diamonds.map((row) => ({ ...row })),
            colorStones: draft.colorStones.map((row) => ({ ...row })),
            notes: draft.notes.trim() || undefined,
          },
          quotationBreakdown,
          quotedSubtotal: quotationSubtotal(quotationBreakdown),
        });
        if (!Object.keys(input).length) {
          onClose();
          return;
        }
        await mutation.mutateAsync(input);
        toast.success("Bulk order item updated");
        onClose();
      }}
    >
      <SectionShell eyebrow="Item" title="Design and delivery">
        <div className="grid gap-4 sm:grid-cols-2">
          {field("vendorDesignNumber", "Vendor design number")}
          {field("quantity", "Quantity", "number")}
          {field("estimatedDeliveryDate", "Estimated delivery date", "date")}
          {field("vendorDeliveryDate", "Vendor delivery date", "date")}
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={fields.isCadRequired}
            onChange={(event) =>
              setFields({ ...fields, isCadRequired: event.target.checked })
            }
            className="size-4 accent-primary"
          />
          CAD design required
        </label>
        <NotesField
          label="Item notes"
          value={fields.notes}
          onChange={(notes) => setFields({ ...fields, notes })}
        />
      </SectionShell>
      <RequirementBasicsSection
        value={draft}
        onChange={setDraft}
        hideDeliveryDate
      />
      <SectionShell eyebrow="Metal" title="Metal and weights">
        <div className="grid gap-4 sm:grid-cols-2">
          <OptionTextField
            label="Metal type"
            options={METAL_TYPES}
            value={draft.metalType}
            onChange={(metalType) => setDraft({ ...draft, metalType })}
          />
          <TextField
            label="Metal purity"
            value={draft.metalPurity}
            onChange={(metalPurity) => setDraft({ ...draft, metalPurity })}
          />
          <TextField
            label="Metal color"
            value={draft.details.metalColor}
            onChange={(value) => updateDetails("metalColor", value)}
          />
          <TextField
            label="Numeric size"
            inputMode="decimal"
            value={weights.size}
            onChange={(size) => setWeights({ ...weights, size })}
          />
          <TextField
            label="Net metal weight (g)"
            inputMode="decimal"
            value={draft.metalWeight}
            onChange={(metalWeight) => setDraft({ ...draft, metalWeight })}
          />
          <TextField
            label="Gross weight (g)"
            inputMode="decimal"
            value={weights.gross}
            onChange={(gross) => setWeights({ ...weights, gross })}
          />
          <TextField
            label="Pure metal weight (g)"
            inputMode="decimal"
            value={weights.pure}
            onChange={(pure) => setWeights({ ...weights, pure })}
          />
          <OptionTextField
            label="Polish"
            options={POLISH_OPTIONS}
            value={draft.details.polish}
            onChange={(value) => updateDetails("polish", value)}
          />
          <OptionTextField
            label="Certification"
            options={CERTIFICATIONS}
            value={draft.details.certification}
            onChange={(value) => updateDetails("certification", value)}
          />
        </div>
        <NotesField
          label="Special notes"
          value={draft.details.specialNotes}
          onChange={(value) => updateDetails("specialNotes", value)}
        />
        <NotesField
          label="Requirement notes"
          value={draft.notes}
          onChange={(notes) => setDraft({ ...draft, notes })}
        />
      </SectionShell>
      <DiamondDetailsSection value={draft} onChange={setDraft} />
      <ColorStoneDetailsSection value={draft} onChange={setDraft} />
      <BulkQuotationFields
        quote={currentQuote}
        draft={draft}
        onChange={setQuote}
      />
    </BulkEditDialog>
  );
}
