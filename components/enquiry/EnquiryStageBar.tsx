"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type EnquiryStage =
  | "Enquiry Created"
  | "Estimation Submitted"
  | "Closed / Converted";

const ENQUIRY_STAGES: EnquiryStage[] = [
  "Enquiry Created",
  "Estimation Submitted",
  "Closed / Converted",
];

interface EnquiryStageBarProps {
  currentStage: EnquiryStage;
}

export function EnquiryStageBar({ currentStage }: EnquiryStageBarProps) {
  const currentIndex = ENQUIRY_STAGES.indexOf(currentStage);

  return (
    <div className="relative grid w-full grid-cols-3 gap-2">
      <div className="absolute left-[12%] right-[12%] top-4 h-px bg-border" />
      {ENQUIRY_STAGES.map((stage, index) => {
        const isCurrent = index === currentIndex;
        const isComplete = index < currentIndex;

        return (
          <div
            key={stage}
            className="relative z-10 flex min-w-0 flex-col items-center gap-1.5 text-center"
          >
            <div
              className={cn(
                "flex size-8 items-center justify-center rounded-full border-2 bg-card transition-colors",
                isCurrent && "border-foreground",
                isComplete && "border-foreground bg-foreground text-background",
                !isCurrent &&
                  !isComplete &&
                  "border-border text-muted-foreground",
              )}
            >
              {isComplete ? (
                <Check className="size-3.5" />
              ) : (
                <span
                  className={cn(
                    "size-2 rounded-full",
                    isCurrent ? "bg-foreground" : "bg-muted-foreground/25",
                  )}
                />
              )}
            </div>
            <p
              className={cn(
                "text-xs font-medium leading-snug",
                isCurrent || isComplete
                  ? "text-foreground"
                  : "text-muted-foreground/60",
              )}
            >
              {stage}
            </p>
          </div>
        );
      })}
    </div>
  );
}
