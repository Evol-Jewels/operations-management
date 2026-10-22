"use client";

import { Check } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { StatusDot } from "./KanbanRecordCard";

export function MoveStageSheet({
  open,
  onOpenChange,
  title,
  description,
  stages,
  currentStage,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  stages: readonly string[];
  currentStage?: string;
  onSelect: (stage: string) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="gap-0 px-4 pt-5">
        <div className="mx-auto w-full max-w-lg">
          <SheetHeader className="mb-3 space-y-1 text-left">
            <SheetTitle className="text-base">{title}</SheetTitle>
            {description && <SheetDescription>{description}</SheetDescription>}
          </SheetHeader>
          <ul className="grid gap-1">
            {stages.map((stage) => {
              const isCurrent = stage === currentStage;
              return (
                <li key={stage}>
                  <button
                    type="button"
                    disabled={isCurrent}
                    onClick={() => {
                      onOpenChange(false);
                      onSelect(stage);
                    }}
                    className={cn(
                      "flex h-11 w-full cursor-pointer items-center gap-3 rounded-lg px-3 text-left text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default",
                      isCurrent && "bg-muted/60 font-medium",
                    )}
                  >
                    <StatusDot status={stage} className="size-2" />
                    <span className="flex-1">{stage}</span>
                    {isCurrent && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Check className="size-3.5" aria-hidden="true" />
                        Current
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </SheetContent>
    </Sheet>
  );
}
