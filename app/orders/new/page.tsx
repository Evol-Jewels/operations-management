"use client";

import { RequireInternalAuth } from "@/components/auth/RequireInternalAuth";

function OrdersComingSoon() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center justify-center gap-6 py-28 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-muted/50">
        <span className="text-2xl">🔨</span>
      </div>
      <div className="space-y-2">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Create New Order
        </h1>
        <p className="text-sm text-muted-foreground">
          Orders are not available yet.
        </p>
        <p className="text-sm text-muted-foreground">Coming soon!</p>
      </div>
    </div>
  );
}

export default function NewOrderPage() {
  return (
    <RequireInternalAuth>
      <OrdersComingSoon />
    </RequireInternalAuth>
  );
}
