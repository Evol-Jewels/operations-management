"use client";

import { RequireInternalAuth } from "@/components/auth/RequireInternalAuth";

function OrdersAnalyticsComingSoon() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-28 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full border border-border bg-muted/50">
        <span className="text-4xl">📊</span>
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Orders Dashboard
        </h1>
        <p className="text-base text-muted-foreground">
          Orders analytics are not available yet.
        </p>
        <p className="text-sm text-muted-foreground">Coming soon!</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <RequireInternalAuth>
      <OrdersAnalyticsComingSoon />
    </RequireInternalAuth>
  );
}
