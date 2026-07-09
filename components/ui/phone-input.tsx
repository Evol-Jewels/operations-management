"use client";

import type { IntlTelInputRef } from "@intl-tel-input/react/with-utils";
import IntlTelInput from "@intl-tel-input/react/with-utils";
import "intl-tel-input/styles";
import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  id?: string;
  className?: string;
  disabled?: boolean;
  showErrorMessage?: boolean;
  onKeyDown?: (e: KeyboardEvent) => void;
  onValidityChange?: (isValid: boolean) => void;
}

export function PhoneInput({
  value,
  onChange,
  error,
  id,
  className,
  disabled = false,
  showErrorMessage = true,
  onKeyDown,
  onValidityChange,
}: PhoneInputProps) {
  const itiRef = useRef<IntlTelInputRef>(null);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    if (!itiRef.current || !value) return;
    const instance = itiRef.current.getInstance();
    if (!instance) return;

    const current = instance.getNumber();

    if (current !== value) {
      instance.setNumber(value);
    }
  }, [value]);

  useEffect(() => {
    onValidityChange?.(isValid);
  }, [isValid, onValidityChange]);

  return (
    <div className={cn("w-full", error && "iti-error", className)}>
      <IntlTelInput
        ref={itiRef}
        value={value}
        onChangeNumber={onChange}
        onChangeValidity={setIsValid}
        initialCountry="in"
        formatAsYouType={true}
        strictMode={true}
        disabled={disabled}
        inputProps={{
          id: id,
          onKeyDown: onKeyDown,
          className: cn("text-base", error && "border-destructive"),
        }}
      />
      {showErrorMessage && error ? (
        <p className="mt-2 text-sm text-destructive">{error}</p>
      ) : null}
    </div>
  );
}

export function validatePhone(phone: string): string | null {
  if (!phone?.trim()) return "Phone number is required";

  const e164Regex = /^\+[1-9]\d{1,14}$/;
  if (!e164Regex.test(phone)) return "Enter a valid phone number";

  return null;
}
