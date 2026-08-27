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
  { label: "30 days", value: "30" },
  { label: "90 days", value: "90" },
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
          className="h-11 w-full justify-between gap-3 px-3 font-normal sm:w-auto sm:min-w-48"
          variant="outline"
        >
          <span className="flex min-w-0 items-center gap-2">
            <CalendarDays className="size-4 text-muted-foreground" />
            <span className="truncate">{label}</span>
          </span>
          <ChevronDown
            className={cn(
              "size-4 text-muted-foreground transition-transform duration-200",
              open && "rotate-180",
            )}
          />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-[min(22rem,calc(100vw-2rem))] space-y-4 p-3"
        sideOffset={8}
      >
        <div className="grid gap-0.5">
          {QUICK_RANGES.map((option) => {
            const isSelected = view === option.value;

            return (
              <button
                aria-pressed={isSelected}
                className={cn(
                  "flex min-h-11 w-full cursor-pointer items-center justify-between rounded-md px-3 text-left text-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                  isSelected && "bg-accent font-medium text-accent-foreground",
                )}
                key={option.value}
                onClick={() => selectQuickRange(option.value)}
                type="button"
              >
                {option.label}
                {isSelected && <Check aria-hidden="true" className="size-4" />}
              </button>
            );
          })}
        </div>

        <div className="border-t border-border pt-3">
          <div className="grid grid-cols-2 rounded-md bg-muted p-1">
            {(["year", "month"] as const).map((option) => (
              <Button
                aria-pressed={view === option}
                className="h-9"
                key={option}
                onClick={() => onViewChange(option)}
                size="sm"
                type="button"
                variant={view === option ? "secondary" : "ghost"}
              >
                {option === "year" ? "Year" : "Month"}
              </Button>
            ))}
          </div>

          {isCalendarView && (
            <div
              className={cn(
                "mt-2 grid gap-2",
                view === "month"
                  ? "grid-cols-[minmax(0,1fr)_7rem]"
                  : "grid-cols-1",
              )}
            >
              {view === "month" && (
                <Select value={month} onValueChange={onMonthChange}>
                  <SelectTrigger
                    aria-label="Sale month"
                    className="h-11 w-full"
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
                <SelectTrigger aria-label="Sale year" className="h-11 w-full">
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
