"use client";

import { Check, ChevronDown } from "lucide-react";
import {
  type HTMLAttributes,
  type ReactNode,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  JewelryVisual,
  type JewelryVisualKind,
} from "@/components/jewelry/JewelryVisual";
import { DatePicker } from "@/components/ui/date-picker";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  required,
  optional,
  type = "text",
  inputMode,
}: {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  optional?: boolean;
  type?: string;
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  const id = `field-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <FormField
      label={label}
      htmlFor={id}
      required={required}
      optional={optional}
    >
      {type === "date" ? (
        <DatePicker
          id={id}
          value={value}
          placeholder={placeholder}
          onChange={onChange}
        />
      ) : (
        <Input
          id={id}
          type={type}
          inputMode={inputMode}
          value={value ?? ""}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="h-9"
        />
      )}
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
  visualKind,
}: {
  label: string;
  value?: string;
  options: readonly string[];
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  visualKind?: JewelryVisualKind;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchValue = (value ?? "").trim();
  const rankedOptions = useMemo(() => {
    if (!searchValue) return options;
    const normalizedSearch = searchValue.toLocaleLowerCase();

    const getMatchRank = (option: string) => {
      const normalizedOption = option.toLocaleLowerCase();
      if (normalizedOption === normalizedSearch) return 0;
      if (normalizedOption.startsWith(normalizedSearch)) return 1;
      if (
        normalizedOption
          .split(/\s+/)
          .some((word) => word.startsWith(normalizedSearch))
      ) {
        return 2;
      }
      if (normalizedOption.includes(normalizedSearch)) return 3;
      return 4;
    };

    return options
      .map((option, index) => ({ option, index, rank: getMatchRank(option) }))
      .sort((a, b) => a.rank - b.rank || a.index - b.index)
      .map(({ option }) => option);
  }, [options, searchValue]);
  const safeActiveIndex = Math.min(
    activeIndex,
    Math.max(rankedOptions.length - 1, 0),
  );

  useEffect(() => {
    if (open)
      listRef.current?.children[safeActiveIndex]?.scrollIntoView({
        block: "nearest",
      });
  }, [open, safeActiveIndex]);

  const selectOption = (option: string) => {
    onChange(option);
    setActiveIndex(0);
    setOpen(false);
    inputRef.current?.focus();
  };

  return (
    <FormField label={label} htmlFor={id} required={required}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <div className="relative">
            {visualKind && value && options.includes(value) ? (
              <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center">
                <JewelryVisual
                  kind={visualKind}
                  value={value}
                  className="size-5"
                />
              </span>
            ) : null}
            <Input
              ref={inputRef}
              id={id}
              value={value ?? ""}
              placeholder={placeholder}
              onFocus={() => setOpen(true)}
              onClick={() => setOpen(true)}
              onChange={(event) => {
                onChange(event.target.value);
                setActiveIndex(0);
                setOpen(true);
              }}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  setOpen(false);
                  return;
                }
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setOpen(true);
                  setActiveIndex((current) =>
                    open ? Math.min(current + 1, rankedOptions.length - 1) : 0,
                  );
                }
                if (event.key === "ArrowUp") {
                  event.preventDefault();
                  setOpen(true);
                  setActiveIndex((current) => Math.max(current - 1, 0));
                }
                if (
                  event.key === "Enter" &&
                  open &&
                  rankedOptions[safeActiveIndex]
                ) {
                  event.preventDefault();
                  selectOption(rankedOptions[safeActiveIndex]);
                }
              }}
              className={cn(
                "h-9 pr-8",
                visualKind && value && options.includes(value) && "pl-10",
              )}
              autoComplete="off"
              role="combobox"
              aria-expanded={open}
              aria-controls={`${id}-suggestions`}
              aria-autocomplete="list"
              aria-activedescendant={
                open && rankedOptions.length > 0
                  ? `${id}-option-${safeActiveIndex}`
                  : undefined
              }
            />
            <ChevronDown
              aria-hidden="true"
              className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
            />
          </div>
        </PopoverAnchor>
        <PopoverContent
          align="start"
          onOpenAutoFocus={(event) => event.preventDefault()}
          className="max-h-60 w-(--radix-popover-trigger-width) overflow-y-auto p-1"
          id={`${id}-suggestions`}
          role="listbox"
          aria-label={label}
          ref={listRef}
        >
          {rankedOptions.length > 0 ? (
            rankedOptions.map((option, index) => {
              const selected = option === value;
              return (
                <button
                  key={option}
                  id={`${id}-option-${index}`}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => selectOption(option)}
                  className={cn(
                    "flex min-h-9 w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors",
                    (selected || index === safeActiveIndex) &&
                      "bg-accent text-accent-foreground",
                  )}
                >
                  {visualKind ? (
                    <JewelryVisual
                      kind={visualKind}
                      value={option}
                      className="size-6"
                    />
                  ) : null}
                  <span className="min-w-0 flex-1">{option}</span>
                  <Check
                    aria-hidden="true"
                    className={cn(
                      "size-3.5 shrink-0",
                      selected ? "opacity-100" : "opacity-0",
                    )}
                  />
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
