"use client";

import { format } from "date-fns";
import { CalendarDays, Check, ChevronDown } from "lucide-react";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { DateFilter } from "./WorkspaceRecordFilters";

const QUICK_RANGES: ReadonlyArray<{ value: DateFilter; label: string }> = [
  { value: "all", label: "All time" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
];

function parseLocalDate(value: string) {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatSelectedDate(value: string, pattern: string) {
  const date = parseLocalDate(value);
  return date ? format(date, pattern) : value;
}

export function WorkspaceDateRangeFilter({
  value,
  from,
  to,
  onValueChange,
  onRangeChange,
}: {
  value: DateFilter;
  from: string;
  to: string;
  onValueChange: (value: DateFilter) => void;
  onRangeChange: (from: string, to: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected: DateRange | undefined =
    from || to
      ? { from: parseLocalDate(from), to: parseLocalDate(to) }
      : undefined;
  const label =
    value === "custom"
      ? from && to
        ? `${formatSelectedDate(from, "dd MMM")} – ${formatSelectedDate(to, "dd MMM yyyy")}`
        : from
          ? `From ${formatSelectedDate(from, "dd MMM yyyy")}`
          : "Custom range"
      : (QUICK_RANGES.find((range) => range.value === value)?.label ??
        "All time");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          aria-label={`Created date: ${label}`}
          className="h-9 max-w-full justify-between gap-2 px-3 font-normal"
        >
          <span className="flex min-w-0 items-center gap-2">
            <CalendarDays
              aria-hidden="true"
              className="size-4 text-muted-foreground"
            />
            <span className="truncate">{label}</span>
          </span>
          <ChevronDown
            aria-hidden="true"
            className={cn(
              "size-4 text-muted-foreground opacity-50 transition-transform duration-200 motion-reduce:transition-none",
              open && "rotate-180",
            )}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={4}
        collisionPadding={16}
        aria-label="Created date range"
        className="w-auto max-w-[calc(100vw-2rem)] p-1"
      >
        <div className="grid">
          {QUICK_RANGES.map((range) => (
            <Button
              key={range.value}
              type="button"
              size="sm"
              variant="ghost"
              aria-pressed={value === range.value}
              className={cn(
                "h-8 w-full justify-between rounded-sm px-2 font-normal has-[>svg]:px-2",
                value === range.value &&
                  "bg-accent font-medium text-accent-foreground",
              )}
              onClick={() => {
                onValueChange(range.value);
                setOpen(false);
              }}
            >
              {range.label}
              {value === range.value && (
                <Check aria-hidden="true" className="size-4" />
              )}
            </Button>
          ))}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            aria-pressed={value === "custom"}
            className={cn(
              "h-8 w-full justify-between rounded-sm px-2 font-normal has-[>svg]:px-2",
              value === "custom" &&
                "bg-accent font-medium text-accent-foreground",
            )}
            onClick={() => onValueChange("custom")}
          >
            Custom range
            {value === "custom" && (
              <Check aria-hidden="true" className="size-4" />
            )}
          </Button>
        </div>
        {value === "custom" && (
          <div className="mt-1 border-t border-border pt-1">
            <Calendar
              mode="range"
              selected={selected}
              defaultMonth={selected?.from}
              onSelect={(range) => {
                onRangeChange(
                  range?.from ? format(range.from, "yyyy-MM-dd") : "",
                  range?.to ? format(range.to, "yyyy-MM-dd") : "",
                );
                if (range?.to) setOpen(false);
              }}
              className="mx-auto"
            />
            <p className="px-2 pb-2 text-xs text-muted-foreground">
              Choose a start and end date. Dates are inclusive.
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
