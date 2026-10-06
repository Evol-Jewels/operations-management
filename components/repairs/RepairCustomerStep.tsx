"use client";

import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  onNext,
}: {
  draft: RepairDraft;
  errors: Partial<Record<keyof RepairDraft, string>>;
  onChange: (patch: Partial<RepairDraft>) => void;
  onNext: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[58vh] max-w-xl flex-col justify-center">
      <div className="rounded-lg border border-border p-5">
        <div className="mb-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            New repair · Step 1 of 2
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
            Repair for
          </h1>
        </div>
        <div className="grid gap-4">
          <FormField label="Product type" htmlFor="productType" required>
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
                  className="h-11"
                />
              </FormField>
            </>
          )}
        </div>
        <div className="mt-6 flex justify-end">
          <Button type="button" onClick={onNext}>
            Add repair details
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
