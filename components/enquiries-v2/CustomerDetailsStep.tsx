"use client";

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
  onChange,
  onPhoneValidityChange,
  onNext,
}: {
  customer: CustomerDraft;
  errors: Record<string, string>;
  onChange: (customer: CustomerDraft) => void;
  onPhoneValidityChange: (isValid: boolean) => void;
  onNext: () => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 sm:rounded-lg sm:border sm:border-border sm:p-5">
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
          autoComplete="name"
          autoCapitalize="words"
          enterKeyHint="next"
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
  );
}
