"use client";

import { Check } from "lucide-react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface StageBarProps {
  currentStage: string;
  cadDesignRequired?: boolean;
  stages?: readonly string[];
}

const ORDER_STAGES = [
  "New",
  "CAD Design",
  "In Production",
  "Certification",
  "At Store",
  "In Photoshoot",
  "Editing",
  "Post Editing",
  "Website Upload",
  "In Transit",
  "Delivered",
  "Closed",
];

const ENQUIRY_STAGES = [
  "Enquiry",
  "Estimation",
  "CAD Design",
  "Order Confirmed",
];

export function StageBar({
  currentStage,
  cadDesignRequired = true,
  stages,
}: StageBarProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const currentRef = useRef<HTMLDivElement>(null);
  const baseStages =
    stages ??
    (ORDER_STAGES.includes(currentStage) ? ORDER_STAGES : ENQUIRY_STAGES);
  const visibleStages = cadDesignRequired
    ? baseStages
    : baseStages.filter((s) => s !== "CAD Design");

  const currentIndex = visibleStages.indexOf(currentStage);

  useEffect(() => {
    const scroller = scrollerRef.current;
    const current = currentRef.current;
    if (!scroller || !current || currentIndex < 0) return;
    scroller.scrollLeft =
      current.offsetLeft - (scroller.clientWidth - current.offsetWidth) / 2;
  }, [currentIndex]);

  return (
    <div className="w-full">
      {currentIndex >= 0 ? (
        <p className="mb-2 text-xs text-muted-foreground sm:hidden">
          Step {currentIndex + 1} of {visibleStages.length}
          <span className="mx-1.5 text-muted-foreground/50">·</span>
          <span className="font-medium text-foreground">{currentStage}</span>
        </p>
      ) : null}
      <div
        ref={scrollerRef}
        className="-mx-1 overflow-x-auto overscroll-x-contain px-1 pb-2 [scrollbar-width:none] sm:[scrollbar-width:auto]"
      >
        <div className="relative flex min-w-max items-start">
          {visibleStages.map((stage, i) => {
            const isPast = i < currentIndex;
            const isCurrent = i === currentIndex;
            const isFuture = i > currentIndex;
            const isComplete = isPast || (isCurrent && stage === "Closed");

            return (
              <div
                key={stage}
                ref={isCurrent ? currentRef : undefined}
                aria-current={isCurrent ? "step" : undefined}
                className="relative flex w-[4.25rem] flex-col items-center gap-1.5 sm:w-auto sm:min-w-20 sm:flex-1 sm:gap-2"
              >
                {i > 0 && (
                  <div
                    className={cn(
                      "absolute left-0 right-1/2 top-3 h-px transition-colors duration-500 sm:top-[14px]",
                      isPast || isCurrent || isComplete
                        ? "bg-foreground"
                        : "bg-border",
                    )}
                  />
                )}
                {i < visibleStages.length - 1 && (
                  <div
                    className={cn(
                      "absolute left-1/2 right-0 top-3 h-px transition-colors duration-500 sm:top-[14px]",
                      isComplete ? "bg-foreground" : "bg-border",
                    )}
                  />
                )}

                <div
                  className={cn(
                    "relative z-10 flex size-6 items-center justify-center rounded-full border-2 transition-all duration-300 sm:size-7",
                    isComplete &&
                      "border-foreground bg-foreground text-background",
                    isCurrent &&
                      !isComplete &&
                      "border-foreground bg-background shadow-[0_0_0_3px_var(--color-muted)]",
                    isFuture && "border-border bg-background",
                  )}
                >
                  {isComplete ? (
                    <Check className="size-3 sm:size-3.5" strokeWidth={2.5} />
                  ) : isCurrent ? (
                    <div className="size-2 rounded-full bg-foreground sm:size-2.5" />
                  ) : (
                    <div className="size-1.5 rounded-full bg-border sm:size-2" />
                  )}
                </div>

                <span
                  className={cn(
                    "px-0.5 text-center text-[10px] leading-tight",
                    isCurrent && "font-semibold text-foreground",
                    isComplete && !isCurrent && "text-muted-foreground",
                    isFuture && "text-muted-foreground/60",
                  )}
                >
                  {stage}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
