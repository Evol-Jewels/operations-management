"use client";

import { type ReactNode, useEffect, useState } from "react";

export function formatWeight(value: number, decimals = 3) {
  return value.toFixed(decimals).replace(/\.?0+$/, "");
}

export function NumericLineInput({
  value,
  onChange,
  placeholder,
  suffix,
  min = 0,
  step = 0.001,
  ariaLabel,
}: {
  value: number;
  onChange: (value: number) => void;
  placeholder: string;
  suffix?: string;
  min?: number;
  step?: number;
  ariaLabel?: string;
}) {
  const [inputValue, setInputValue] = useState(value ? String(value) : "");

  useEffect(() => {
    const parsedInput = inputValue === "" ? 0 : Number(inputValue);

    if (parsedInput !== value) {
      setInputValue(value ? String(value) : "");
    }
  }, [inputValue, value]);

  function handleChange(nextValue: string) {
    if (!/^\d*(?:\.\d*)?$/.test(nextValue)) return;

    setInputValue(nextValue);
    const numericValue = nextValue === "" ? 0 : Number(nextValue);

    if (Number.isFinite(numericValue)) {
      onChange(numericValue);
    }
  }

  return (
    <div className="flex h-10 items-end gap-2 border-b border-border pb-1.5 focus-within:border-foreground md:h-9">
      <input
        type="text"
        role="spinbutton"
        inputMode="decimal"
        value={inputValue}
        onChange={(event) => handleChange(event.target.value)}
        placeholder={placeholder}
        aria-valuemin={min}
        aria-valuenow={value}
        aria-label={ariaLabel}
        data-step={step}
        className="min-w-0 flex-1 bg-transparent px-0 text-base outline-none placeholder:text-muted-foreground/35 md:text-sm"
      />
      {suffix ? (
        <span className="shrink-0 pb-0.5 text-sm text-muted-foreground">
          {suffix}
        </span>
      ) : null}
    </div>
  );
}

export const fieldLabelClassName =
  "block text-xs font-medium text-muted-foreground";

export function SectionLabel({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm font-semibold">{title}</p>
      {action}
    </div>
  );
}
