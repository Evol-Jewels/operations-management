"use client";

import { cn } from "@/lib/utils";

export type EnquiryCreateStep = "customer" | "requirements";

export function EnquiryCreateHeader({ step }: { step: EnquiryCreateStep }) {
  return (
    <header className="mb-6 border-b border-border pb-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            New enquiry
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
            {step === "customer" ? "Capture customer" : "Custom requirements"}
          </h1>
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <StepPill active={step === "customer"} label="Customer" />
          <StepPill active={step === "requirements"} label="Requirements" />
        </div>
      </div>
      <div className="mt-5 h-1 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full bg-primary transition-all duration-300",
            step === "customer" ? "w-0" : "w-1/2",
          )}
        />
      </div>
    </header>
  );
}

function StepPill({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium",
        active
          ? "border-primary/20 bg-primary/10 text-primary"
          : "border-border bg-background text-muted-foreground",
      )}
    >
      {label}
    </span>
  );
}
