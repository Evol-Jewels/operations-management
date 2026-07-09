"use client";

import { Check } from "lucide-react";
import { useMemo, useRef, useState, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
import { cn } from "@/lib/utils";

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  required,
  type = "text",
}: {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
}) {
  const id = `field-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <FormField label={label} htmlFor={id} required={required}>
      <Input
        id={id}
        type={type}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-9"
      />
    </FormField>
  );
}

export function OptionTextField({
  label,
  value,
  options,
  onChange,
  placeholder = "Select or type",
  required,
}: {
  label: string;
  value?: string;
  options: readonly string[];
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  const id = `field-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchValue = (value ?? "").trim().toLowerCase();
  const filteredOptions = useMemo(() => {
    if (!searchValue) return options;
    return options.filter((option) =>
      option.toLowerCase().includes(searchValue),
    );
  }, [options, searchValue]);

  return (
    <FormField label={label} htmlFor={id} required={required}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <Input
            ref={inputRef}
            id={id}
            value={value ?? ""}
            placeholder={placeholder}
            onFocus={() => setOpen(true)}
            onChange={(event) => {
              onChange(event.target.value);
              setOpen(true);
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") setOpen(false);
            }}
            className="h-9"
            autoComplete="off"
          />
        </PopoverAnchor>
        <PopoverContent
          align="start"
          onOpenAutoFocus={(event) => event.preventDefault()}
          className="max-h-60 w-(--radix-popover-trigger-width) overflow-y-auto p-1"
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => {
              const selected = option === value;
              return (
                <button
                  key={option}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onChange(option);
                    setOpen(false);
                    inputRef.current?.focus();
                  }}
                  className={cn(
                    "hover:bg-accent hover:text-accent-foreground flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm",
                    selected && "bg-accent text-accent-foreground",
                  )}
                >
                  <Check
                    className={cn(
                      "size-3.5",
                      selected ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span>{option}</span>
                </button>
              );
            })
          ) : (
            <p className="px-2 py-2 text-sm text-muted-foreground">
              No suggestions found.
            </p>
          )}
        </PopoverContent>
      </Popover>
    </FormField>
  );
}

export function NotesField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const id = `field-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <FormField label={label} htmlFor={id} optional className="sm:col-span-2">
      <Textarea
        id={id}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-20 resize-none"
      />
    </FormField>
  );
}

export function SectionShell({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4 border-t border-border pt-5 first:border-t-0 first:pt-0">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          {eyebrow}
        </p>
        <h3 className="mt-1 text-sm font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </section>
  );
}
