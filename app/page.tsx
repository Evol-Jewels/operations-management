"use client";

import { RequireInternalAuth } from "@/components/auth/RequireInternalAuth";
import { AdminAnalyticsDashboard } from "@/components/dashboard/AdminAnalyticsDashboard";
import { RecentActivities } from "@/components/dashboard/RecentActivities";
import { TodaysFocus } from "@/components/dashboard/TodaysFocus";
import { useOrdersStore } from "@/lib/stores/orders-store";

export default function DashboardPage() {
  const orders = useOrdersStore((state) => state.records);

  return (
    <RequireInternalAuth>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <AdminAnalyticsDashboard orders={orders} />
          <TodaysFocus orders={orders} />
        </div>
        <div className="xl:sticky xl:top-6 xl:self-start">
          <RecentActivities
            orders={orders}
            className="xl:max-h-[calc(100vh-3rem)]"
          />
        </div>
      </div>
    </RequireInternalAuth>
  );
}
