"use client";

import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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

const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
export function isValidMonth(value: string) {
  return /^[1-9]\d{3}-(0[1-9]|1[0-2])$/.test(value);
}

export function MonthPicker({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: string;
  min?: string;
  max?: string;
  onChange: (value: string) => void;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());
  const firstYear = min ? Number(min.slice(0, 4)) : 1000;
  const lastYear = max ? Number(max.slice(0, 4)) : 9999;
  const startYear = Math.max(firstYear, Math.min(year - 50, lastYear - 100));
  const endYear = Math.min(lastYear, Math.max(year + 50, firstYear + 100));
  const valid = isValidMonth(value);
  return (
    <div className="min-w-0 space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Popover
        open={open}
        onOpenChange={(next) => {
          if (next)
            setYear(
              Math.max(
                firstYear,
                Math.min(
                  lastYear,
                  valid ? Number(value.slice(0, 4)) : new Date().getFullYear(),
                ),
              ),
            );
          setOpen(next);
        }}
      >
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            className="h-9 w-full justify-start gap-2 px-2 font-normal"
            aria-invalid={Boolean(value && !valid)}
          >
            <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
            {valid
              ? `${months[Number(value.slice(5)) - 1]} ${value.slice(0, 4)}`
              : "Any month"}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64 space-y-3 p-3">
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              aria-label="Previous year"
              disabled={year <= firstYear}
              onClick={() => setYear(year - 1)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Select
              value={String(year)}
              onValueChange={(next) => setYear(Number(next))}
            >
              <SelectTrigger className="flex-1" aria-label={`${label} year`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from(
                  { length: endYear - startYear + 1 },
                  (_, index) => startYear + index,
                ).map((item) => (
                  <SelectItem key={item} value={String(item)}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="icon"
              variant="ghost"
              aria-label="Next year"
              disabled={year >= lastYear}
              onClick={() => setYear(year + 1)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {months.map((month, index) => {
              const next = `${year}-${String(index + 1).padStart(2, "0")}`;
              return (
                <Button
                  key={month}
                  variant={value === next ? "secondary" : "ghost"}
                  aria-pressed={value === next}
                  disabled={Boolean((min && next < min) || (max && next > max))}
                  onClick={() => {
                    onChange(next);
                    setOpen(false);
                  }}
                >
                  {month}
                </Button>
              );
            })}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            disabled={!value}
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
          >
            Clear {label.toLowerCase()} month
          </Button>
        </PopoverContent>
      </Popover>
    </div>
  );
}
