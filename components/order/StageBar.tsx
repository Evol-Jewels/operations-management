"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Stage } from "@/types";

interface StageBarProps {
  currentStage: Stage;
  cadDesignRequired: boolean;
}

export function StageBar({ currentStage, cadDesignRequired }: StageBarProps) {
  const orderStages: Stage[] = [
    "New",
    "CAD Design",
    "In Production",
    "Certification",
    "At Store",
    "In Transit",
    "Delivered",
    "Closed",
  ];
  const enquiryStages: Stage[] = [
    "Enquiry",
    "Estimation",
    "CAD Design",
    "Order Confirmed",
  ];
  const baseStages = orderStages.includes(currentStage)
    ? orderStages
    : enquiryStages;
  const visibleStages = cadDesignRequired
    ? baseStages
    : baseStages.filter((s) => s !== "CAD Design");

  const currentIndex = visibleStages.indexOf(currentStage);

  return (
    <div className="w-full">
      {/* Desktop: horizontal timeline */}
      <div className="hidden sm:block">
        <div className="relative flex items-start">
          {/* Connecting line behind nodes */}
          <div className="absolute left-0 right-0 top-[14px] h-px bg-border" />

          {visibleStages.map((stage, i) => {
            const isPast = i < currentIndex;
            const isCurrent = i === currentIndex;
            const isFuture = i > currentIndex;
            const isComplete = isPast || (isCurrent && stage === "Closed");

            return (
              <div
                key={stage}
                className="relative flex flex-1 flex-col items-center gap-2"
              >
                {/* Progress line — filled for past stages */}
                {i > 0 && (
                  <div
                    className={cn(
                      "absolute left-0 right-1/2 top-[14px] h-px transition-colors duration-500",
                      isPast || isCurrent || isComplete
                        ? "bg-foreground"
                        : "bg-border",
                    )}
                  />
                )}
                {i < visibleStages.length - 1 && (
                  <div
                    className={cn(
                      "absolute left-1/2 right-0 top-[14px] h-px transition-colors duration-500",
                      isComplete ? "bg-foreground" : "bg-border",
                    )}
                  />
                )}

                {/* Node */}
                <div
                  className={cn(
                    "relative z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all duration-300",
                    isComplete &&
                      "border-foreground bg-foreground text-background",
                    isCurrent &&
                      !isComplete &&
                      "border-foreground bg-background shadow-[0_0_0_3px_oklch(0.92_0.004_286.32)]",
                    isFuture && "border-border bg-background",
                  )}
                >
                  {isComplete ? (
                    <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                  ) : isCurrent ? (
                    <div className="h-2.5 w-2.5 rounded-full bg-foreground" />
                  ) : (
                    <div className="h-2 w-2 rounded-full bg-border" />
                  )}
                </div>

                {/* Label */}
                <span
                  className={cn(
                    "text-center text-[10px] leading-tight",
                    isCurrent && "font-semibold text-foreground",
                    isComplete && !isCurrent && "text-muted-foreground",
                    isFuture && "text-muted-foreground/50",
                  )}
                >
                  {stage}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile: compact vertical list */}
      <div className="sm:hidden">
        <div className="space-y-1">
          {visibleStages.map((stage, i) => {
            const isPast = i < currentIndex;
            const isCurrent = i === currentIndex;
            const isComplete = isPast || (isCurrent && stage === "Closed");

            return (
              <div key={stage} className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border",
                    isComplete &&
                      "border-foreground bg-foreground text-background",
                    isCurrent &&
                      !isComplete &&
                      "border-foreground bg-background",
                    !isComplete && !isCurrent && "border-border",
                  )}
                >
                  {isComplete ? (
                    <Check className="h-2.5 w-2.5" strokeWidth={3} />
                  ) : isCurrent ? (
                    <div className="h-1.5 w-1.5 rounded-full bg-foreground" />
                  ) : null}
                </div>
                <span
                  className={cn(
                    "text-sm",
                    isCurrent && "font-medium text-foreground",
                    isComplete &&
                      !isCurrent &&
                      "text-muted-foreground line-through",
                    !isComplete && !isCurrent && "text-muted-foreground/50",
                  )}
                >
                  {stage}
                </span>
                {isCurrent && !isComplete && (
                  <span className="ml-auto rounded-full bg-foreground px-2 py-0.5 text-[10px] font-medium text-background">
                    Current
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
