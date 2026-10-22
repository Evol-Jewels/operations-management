"use client";

import { SlidersHorizontal } from "lucide-react";
import { type ReactNode, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { FilterSheet } from "./FilterSheet";

export function AnalyticsFilterPopover({
  count,
  onReset,
  className,
  children,
}: {
  count: number;
  onReset: () => void;
  className?: string;
  children: ReactNode;
}) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  const trigger = (
    <Button
      variant={count > 0 && isMobile ? "default" : "outline"}
      className={cn("h-10 shrink-0 gap-2 md:h-9", className)}
      onClick={isMobile ? () => setOpen(true) : undefined}
    >
      <SlidersHorizontal className="size-4" />
      Filters
      {count > 0 && (
        <Badge variant="secondary" className="min-w-5 justify-center px-1.5">
          {count}
        </Badge>
      )}
    </Button>
  );

  if (isMobile) {
    return (
      <>
        {trigger}
        <FilterSheet
          open={open}
          onOpenChange={setOpen}
          resetLabel="Reset filters"
          resetDisabled={!count}
          onReset={onReset}
        >
          {children}
        </FilterSheet>
      </>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        align="end"
        className="max-h-[min(36rem,80dvh)] w-[min(25rem,calc(100vw-2rem))] space-y-3 overflow-y-auto p-4"
      >
        <div className="flex items-center justify-between gap-3 border-b pb-2">
          <h2 className="text-sm font-semibold">Filters</h2>
          <Button variant="ghost" size="sm" disabled={!count} onClick={onReset}>
            Reset filters
          </Button>
        </div>
        {children}
      </PopoverContent>
    </Popover>
  );
}
