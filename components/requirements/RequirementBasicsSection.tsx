"use client";

import { OptionTextField, SectionShell, TextField } from "./RequirementFields";
import type { RequirementDraft } from "./requirement-form-types";
import { ORDER_TYPES, PRODUCT_CATEGORIES } from "./requirement-options";

export function RequirementBasicsSection({
  value,
  onChange,
  hideDeliveryDate = false,
}: {
  value: RequirementDraft;
  onChange: (value: RequirementDraft) => void;
  hideDeliveryDate?: boolean;
}) {
  const updateDetails = (patch: Partial<RequirementDraft["details"]>) =>
    onChange({ ...value, details: { ...value.details, ...patch } });

  return (
    <SectionShell eyebrow="Requirement" title="Order and product details">
      <div className="grid gap-4 sm:grid-cols-2">
        <OptionTextField
          label="Order type"
          value={value.details.orderType}
          options={ORDER_TYPES}
          onChange={(orderType) => updateDetails({ orderType })}
        />
        {!hideDeliveryDate && (
          <TextField
            label="Estimated delivery date"
            type="date"
            value={value.details.deliveryDate}
            onChange={(deliveryDate) => updateDetails({ deliveryDate })}
            required
          />
        )}
        <OptionTextField
          label="Product category"
          value={value.category}
          options={PRODUCT_CATEGORIES}
          onChange={(category) => onChange({ ...value, category })}
          required
        />
        <TextField
          label="Product subcategory"
          value={value.details.subcategory}
          placeholder="Solitaire ring, tennis bracelet..."
          onChange={(subcategory) => updateDetails({ subcategory })}
        />
        <TextField
          label="Product size"
          value={value.details.productSize}
          placeholder="Ring size 13, necklace length..."
          onChange={(productSize) => updateDetails({ productSize })}
        />
        <TextField
          label="Setting type"
          value={value.details.settingType}
          placeholder="Prong, pave, bezel..."
          onChange={(settingType) => updateDetails({ settingType })}
        />
        <TextField
          label="Finding type"
          value={value.details.findingType}
          placeholder="Hidden halo, screw back..."
          onChange={(findingType) => updateDetails({ findingType })}
        />
        <TextField
          label="Budget / price range"
          value={value.details.budgetRange}
          placeholder="2.2L - 2.6L"
          onChange={(budgetRange) => updateDetails({ budgetRange })}
        />
      </div>
    </SectionShell>
  );
}
