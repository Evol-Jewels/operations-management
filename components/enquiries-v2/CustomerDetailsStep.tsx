"use client";

import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";

export interface CustomerDraft {
  phone: string;
  name: string;
}

export function CustomerDetailsStep({
  customer,
  errors,
  isNextDisabled,
  onChange,
  onPhoneValidityChange,
  onNext,
}: {
  customer: CustomerDraft;
  errors: Record<string, string>;
  isNextDisabled?: boolean;
  onChange: (customer: CustomerDraft) => void;
  onPhoneValidityChange: (isValid: boolean) => void;
  onNext: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[58vh] max-w-xl flex-col justify-center">
      <div className="rounded-lg border border-border p-5">
        <div className="mb-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Step 1 of 2
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
            Customer details
          </h1>
        </div>
        <div className="grid gap-4">
          <FormField label="Phone number" error={errors.phone} required>
            <PhoneInput
              value={customer.phone}
              onChange={(phone) => onChange({ ...customer, phone })}
              onValidityChange={onPhoneValidityChange}
              error={errors.phone}
              showErrorMessage={false}
            />
          </FormField>
          <FormField label="Customer name" error={errors.name} required>
            <Input
              value={customer.name}
              placeholder="e.g. Priya Mehta"
              onChange={(event) =>
                onChange({ ...customer, name: event.target.value })
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") onNext();
              }}
              className="h-11"
            />
          </FormField>
        </div>
        <div className="mt-6 flex justify-end">
          <Button type="button" onClick={onNext} disabled={isNextDisabled}>
            Add requirements
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
