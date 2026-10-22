"use client";

import type { ReactNode } from "react";
import { CreateFlowProgress } from "@/components/orders/create-flow-layout";

export type EnquiryCreateStep = "customer" | "requirements";

export function EnquiryCreateHeader({
  step,
  action,
}: {
  step: EnquiryCreateStep;
  action?: ReactNode;
}) {
  const isCustomer = step === "customer";
  return (
    <header className="mb-5 space-y-4 sm:mb-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            New enquiry
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {isCustomer
              ? "Customer details"
              : "What is the customer interested in?"}
          </h1>
        </div>
        {action}
      </div>
      <CreateFlowProgress
        step={isCustomer ? 1 : 2}
        total={2}
        label={isCustomer ? "Customer" : "Requirements"}
      />
    </header>
  );
}
