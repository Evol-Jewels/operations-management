"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export function FilterSheet({
  open,
  onOpenChange,
  resetLabel,
  resetDisabled,
  onReset,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resetLabel: string;
  resetDisabled?: boolean;
  onReset: () => void;
  children: ReactNode;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="flex flex-col gap-0 overflow-hidden p-0 pb-0"
      >
        <SheetHeader className="space-y-1 border-b px-4 pt-3 pb-3 text-left">
          <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-muted-foreground/30" />
          <SheetTitle className="text-base">Filters</SheetTitle>
          <SheetDescription className="sr-only">
            Refine the results shown on this page.
          </SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {children}
        </div>
        <div className="grid grid-cols-2 gap-2 border-t bg-background px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <Button
            type="button"
            variant="outline"
            className="h-11"
            disabled={resetDisabled}
            onClick={onReset}
          >
            {resetLabel}
          </Button>
          <Button
            type="button"
            className="h-11"
            onClick={() => onOpenChange(false)}
          >
            Show results
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
