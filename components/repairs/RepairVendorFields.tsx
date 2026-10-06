"use client";

import { OptionTextField } from "@/components/requirements/RequirementFields";
import { DatePicker } from "@/components/ui/date-picker";
import { FormField } from "@/components/ui/form-field";
import { REPAIR_VENDORS, type RepairVendor } from "@/lib/repairs";

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
  const values = value ?? {
    vendorName: "",
    vendorEstimateDate: "",
    deliveryDate: "",
  };
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <OptionTextField
          label="Vendor name"
          value={values.vendorName}
          options={REPAIR_VENDORS}
          required={required}
          onChange={(vendorName) => onChange({ ...values, vendorName })}
        />
        {errors.vendorName && (
          <p className="mt-1 text-[11px] text-destructive">
            {errors.vendorName}
          </p>
        )}
      </div>
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
