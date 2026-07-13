"use client";

import { format, isValid, parse } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  value?: string;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  includeTime?: boolean;
}

function parseValue(value: string | undefined, includeTime: boolean) {
  if (!value) return undefined;
  const parsed = parse(value, includeTime ? "yyyy-MM-dd'T'HH:mm" : "yyyy-MM-dd", new Date());
  return isValid(parsed) ? parsed : undefined;
}

export function DatePicker({
  value,
  onChange,
  id,
  placeholder = "Select date",
  className,
  disabled,
  includeTime = false,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = parseValue(value, includeTime);
  const time = selected ? format(selected, "HH:mm") : "09:00";

  const commitDate = (date: Date) => {
    const datePart = format(date, "yyyy-MM-dd");
    onChange(includeTime ? `${datePart}T${time}` : datePart);
    if (!includeTime) setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className={cn("relative", className)}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              "h-9 w-full justify-start gap-2 px-3 text-left font-normal",
              !selected && "text-muted-foreground",
              value && "pr-9",
            )}
          >
            <CalendarIcon className="size-4 text-muted-foreground" />
            <span className="truncate">
              {selected ? format(selected, includeTime ? "dd MMM yyyy, HH:mm" : "dd MMM yyyy") : placeholder}
            </span>
          </Button>
        </PopoverTrigger>
        {value && !disabled && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Clear date"
            onClick={() => onChange("")}
            className="absolute top-1/2 right-1 z-10 size-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </Button>
        )}
      </div>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          onSelect={(date) => date && commitDate(date)}
          autoFocus
        />
        {includeTime && (
          <div className="flex items-center gap-3 border-t p-3">
            <label htmlFor={`${id ?? "date"}-time`} className="text-sm font-medium">
              Time
            </label>
            <Input
              id={`${id ?? "date"}-time`}
              type="time"
              value={time}
              className="h-9 w-32"
              onChange={(event) => {
                const datePart = selected ? format(selected, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd");
                onChange(`${datePart}T${event.target.value}`);
              }}
            />
            <Button type="button" size="sm" className="ml-auto" onClick={() => setOpen(false)}>
              Done
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
