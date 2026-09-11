"use client";

import { CalendarDays, Check, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { StockSalesAnalyticsRange } from "@/types/stock-sales-api";

export type SalesAnalyticsView =
  | StockSalesAnalyticsRange
  | "month"
  | "year"
  | "allTime";

interface SalesAnalyticsDateFilterProps {
  label: string;
  month: string;
  onMonthChange: (month: string) => void;
  onViewChange: (view: SalesAnalyticsView) => void;
  onYearChange: (year: string) => void;
  view: SalesAnalyticsView;
  year: string;
  yearOptions: string[];
}

const QUICK_RANGES: ReadonlyArray<{
  label: string;
  value: StockSalesAnalyticsRange | "allTime";
}> = [
  { label: "Last month", value: "30" },
  { label: "Last 3 months", value: "90" },
  { label: "360 days", value: "360" },
  { label: "All Time", value: "allTime" },
];

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => {
  const date = new Date(2026, index, 1);

  return {
    label: new Intl.DateTimeFormat("en", { month: "long" }).format(date),
    value: String(index + 1).padStart(2, "0"),
  };
});

export function SalesAnalyticsDateFilter({
  label,
  month,
  onMonthChange,
  onViewChange,
  onYearChange,
  view,
  year,
  yearOptions,
}: SalesAnalyticsDateFilterProps) {
  const [open, setOpen] = useState(false);
  const isCalendarView = view === "month" || view === "year";

  const selectQuickRange = (nextView: StockSalesAnalyticsRange | "allTime") => {
    onViewChange(nextView);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          aria-label={`Date range: ${label}`}
          className="h-9 max-w-full justify-between gap-2 self-start px-3 font-normal"
          variant="outline"
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
        aria-label="Sales period"
        className="w-64 max-w-[calc(100vw-2rem)] p-1"
        collisionPadding={16}
        sideOffset={4}
      >
        <div className="grid">
          {QUICK_RANGES.map((option) => {
            const isSelected = view === option.value;

            return (
              <Button
                aria-pressed={isSelected}
                className={cn(
                  "h-8 w-full justify-between rounded-sm px-2 font-normal has-[>svg]:px-2",
                  isSelected && "bg-accent font-medium text-accent-foreground",
                )}
                key={option.value}
                onClick={() => selectQuickRange(option.value)}
                size="sm"
                type="button"
                variant="ghost"
              >
                {option.label}
                {isSelected && <Check aria-hidden="true" className="size-4" />}
              </Button>
            );
          })}
        </div>

        <div className="mt-1 space-y-2 border-t border-border p-2">
          <div className="grid grid-cols-2 gap-0.5 rounded-md bg-muted p-0.5">
            {(["year", "month"] as const).map((option) => (
              <Button
                aria-pressed={view === option}
                className={cn(
                  "h-7 rounded-sm text-xs",
                  view === option
                    ? "bg-background shadow-xs hover:bg-background"
                    : "text-muted-foreground",
                )}
                key={option}
                onClick={() => onViewChange(option)}
                size="sm"
                type="button"
                variant="ghost"
              >
                {option === "year" ? "Year" : "Month"}
              </Button>
            ))}
          </div>

          {isCalendarView && (
            <div
              className={cn(
                "grid gap-2",
                view === "month"
                  ? "grid-cols-[minmax(0,1fr)_5rem]"
                  : "grid-cols-1",
              )}
            >
              {view === "month" && (
                <Select value={month} onValueChange={onMonthChange}>
                  <SelectTrigger
                    aria-label="Sale month"
                    className="w-full"
                    size="sm"
                  >
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTH_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Select
                value={year}
                onValueChange={(nextYear) => {
                  onYearChange(nextYear);
                  setOpen(false);
                }}
              >
                <SelectTrigger
                  aria-label="Sale year"
                  className="w-full"
                  size="sm"
                >
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
