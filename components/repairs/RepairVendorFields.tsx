"use client";

import { useId } from "react";
import { DatePicker } from "@/components/ui/date-picker";
import { FormField } from "@/components/ui/form-field";
import { VendorNameCombobox } from "@/components/vendors/VendorCombobox";
import type { RepairVendor } from "@/lib/repairs";

export function RepairVendorFields({
  value,
  onChange,
  required = false,
  errors = {},
}: {
  value?: RepairVendor;
  onChange: (value: RepairVendor) => void;
  required?: boolean;
  errors?: Partial<Record<keyof RepairVendor, string>>;
}) {
  const vendorNameId = useId();
  const values = value ?? {
    vendorName: "",
    vendorEstimateDate: "",
    deliveryDate: "",
  };
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField
        className="sm:col-span-2"
        label="Vendor name"
        htmlFor={vendorNameId}
        required={required}
        optional={!required}
        error={errors.vendorName}
      >
        <VendorNameCombobox
          id={vendorNameId}
          value={values.vendorName}
          onChange={(vendorName) => onChange({ ...values, vendorName })}
        />
      </FormField>
      {(
        [
          ["vendorEstimateDate", "Vendor estimate date"],
          ["deliveryDate", "Delivery date"],
        ] as const
      ).map(([key, label]) => (
        <FormField
          key={key}
          label={label}
          htmlFor={key}
          required={required}
          optional={!required}
          error={errors[key]}
        >
          <DatePicker
            id={key}
            value={values[key]}
            onChange={(date) => onChange({ ...values, [key]: date })}
          />
        </FormField>
      ))}
    </div>
  );
}
