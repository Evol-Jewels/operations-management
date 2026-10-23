"use client";

import { ReceiptText, X } from "lucide-react";
import { type ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn, formatCurrency } from "@/lib/utils";

export function CalculatorTotalBar({
  total,
  hint,
  className,
  children,
}: {
  total: number | null;
  hint: string;
  className?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      data-fab-avoid
      className={cn(
        "sticky bottom-[calc(var(--mobile-nav-h,0px)+0.5rem)] z-20 flex min-h-14 items-center gap-3 rounded-xl border border-border bg-background/95 py-2 pr-2 pl-4 shadow-lg backdrop-blur supports-backdrop-filter:bg-background/80",
        className,
      )}
    >
      {total === null ? (
        <p className="text-sm text-muted-foreground">{hint}</p>
      ) : (
        <>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">Total incl. GST</p>
            <p className="truncate text-lg font-semibold leading-tight tabular">
              {formatCurrency(total)}
            </p>
          </div>
          <Sheet open={open} onOpenChange={setOpen}>
            <Button
              type="button"
              className="h-10 shrink-0"
              onClick={() => setOpen(true)}
            >
              <ReceiptText className="size-4" />
              Breakup
            </Button>
            <SheetContent side="bottom" className="gap-3 px-4 pt-3">
              <div className="flex items-center justify-between gap-3">
                <SheetTitle className="text-base">Estimate breakup</SheetTitle>
                <SheetClose asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-10"
                    aria-label="Close breakup"
                  >
                    <X className="size-5" />
                  </Button>
                </SheetClose>
              </div>
              <SheetDescription className="sr-only">
                Price breakup for the current calculator estimate.
              </SheetDescription>
              {children}
            </SheetContent>
          </Sheet>
        </>
      )}
    </div>
  );
}
