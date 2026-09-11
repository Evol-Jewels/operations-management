"use client";

import { SlidersHorizontal } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function AnalyticsFilterPopover({
  count,
  onReset,
  children,
}: {
  count: number;
  onReset: () => void;
  children: ReactNode;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-9 shrink-0 gap-2">
          <SlidersHorizontal className="size-4" />
          Filters
          {count > 0 && (
            <Badge
              variant="secondary"
              className="min-w-5 justify-center px-1.5"
            >
              {count}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
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
