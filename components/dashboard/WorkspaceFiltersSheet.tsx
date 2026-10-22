"use client";

import { SlidersHorizontal } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export function FilterField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={htmlFor} className="text-xs text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

export function WorkspaceFiltersSheet({
  activeCount,
  onReset,
  description,
  className,
  children,
}: {
  activeCount: number;
  onReset?: () => void;
  description?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="outline"
          aria-label={
            activeCount ? `Filters, ${activeCount} active` : "Filters"
          }
          className={cn("h-10 shrink-0 gap-1.5 px-3", className)}
        >
          <SlidersHorizontal className="size-4" aria-hidden="true" />
          <span className="max-[379px]:sr-only">Filters</span>
          {activeCount > 0 && (
            <span className="flex size-5 items-center justify-center rounded-full bg-foreground text-[11px] font-semibold tabular-nums text-background">
              {activeCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="gap-0 px-4 pt-5">
        <div className="mx-auto w-full max-w-lg">
          <SheetHeader className="mb-4 space-y-1 text-left">
            <SheetTitle className="text-base">Filters</SheetTitle>
            <SheetDescription className={cn(!description && "sr-only")}>
              {description ?? "Narrow down the records shown"}
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-4">{children}</div>
          <SheetFooter className="mt-6 flex-row gap-2 sm:space-x-0">
            {onReset && (
              <Button
                type="button"
                variant="outline"
                className="h-11 flex-1"
                disabled={activeCount === 0}
                onClick={onReset}
              >
                Clear all
              </Button>
            )}
            <SheetClose asChild>
              <Button type="button" className="h-11 flex-1">
                Done
              </Button>
            </SheetClose>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}
