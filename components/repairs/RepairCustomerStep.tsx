"use client";

import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { RepairDraft } from "@/lib/repairs";

export function RepairCustomerStep({
  draft,
  errors,
  onChange,
}: {
  draft: RepairDraft;
  errors: Partial<Record<keyof RepairDraft, string>>;
  onChange: (patch: Partial<RepairDraft>) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 sm:rounded-lg sm:border sm:border-border sm:p-5">
      <FormField
        label="Repair for"
        htmlFor="productType"
        required
        className="sm:col-span-2"
      >
        <Select
          value={draft.productType}
          onValueChange={(value) => {
            if (value === "Customer" || value === "Stock")
              onChange({ productType: value });
          }}
        >
          <SelectTrigger id="productType" className="h-11 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Customer">Customer</SelectItem>
            <SelectItem value="Stock">Stock</SelectItem>
          </SelectContent>
        </Select>
      </FormField>
      {draft.productType === "Customer" && (
        <>
          <FormField
            label="Phone number"
            htmlFor="customerPhone"
            required
            error={errors.customerPhone}
          >
            <PhoneInput
              id="customerPhone"
              value={draft.customerPhone}
              onChange={(customerPhone) => onChange({ customerPhone })}
              error={errors.customerPhone}
              showErrorMessage={false}
            />
          </FormField>
          <FormField
            label="Customer name"
            htmlFor="customerName"
            required
            error={errors.customerName}
          >
            <Input
              id="customerName"
              autoComplete="name"
              placeholder="e.g. Priya Mehta"
              value={draft.customerName}
              onChange={(event) =>
                onChange({ customerName: event.target.value })
              }
              aria-invalid={Boolean(errors.customerName)}
              maxLength={150}
              autoCapitalize="words"
              className="h-11"
            />
          </FormField>
        </>
      )}
    </div>
  );
}
