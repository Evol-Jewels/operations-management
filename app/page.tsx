"use client";

import { useMemo } from "react";
import { RequireInternalAuth } from "@/components/auth/RequireInternalAuth";
import {
  AdminDashboard,
  OperationsDashboard,
  SalesDashboard,
} from "@/components/dashboard/RoleDashboards";
import { useEnquiries } from "@/hooks/useEnquiries";
import { getSessionRole } from "@/lib/auth";
import { authClient } from "@/lib/auth-client";
import { mapBackendEnquiryListItemToOrder } from "@/lib/enquiryMappers";
import { useOrdersStore } from "@/lib/stores/orders-store";

function RoleDashboardPage() {
  const { data: session } = authClient.useSession();
  const storeRecords = useOrdersStore((state) => state.records);
  const enquiriesQuery = useEnquiries();
  const orders = useMemo(
    () => [
      ...storeRecords.filter((record) => record.type === "order"),
      ...(enquiriesQuery.data ?? []).map(mapBackendEnquiryListItemToOrder),
    ],
    [enquiriesQuery.data, storeRecords],
  );
  const role = getSessionRole(session).toUpperCase();

  if (role === "ADMIN") return <AdminDashboard orders={orders} />;
  if (role === "OPERATIONS") return <OperationsDashboard orders={orders} />;
  return <SalesDashboard orders={orders} />;
}

export default function DashboardPage() {
  return (
    <RequireInternalAuth>
      <RoleDashboardPage />
    </RequireInternalAuth>
  );
}
