"use client";

import { useMemo } from "react";
import { RequireInternalAuth } from "@/components/auth/RequireInternalAuth";
import {
  AdminDashboard,
  OperationsDashboard,
  SalesDashboard,
} from "@/components/dashboard/RoleDashboards";
import { useEnquiries } from "@/hooks/useEnquiries";
import { useOrders } from "@/hooks/useOrders";
import { getSessionRole } from "@/lib/auth";
import { authClient } from "@/lib/auth-client";
import { mapBackendEnquiryListItemToOrder } from "@/lib/enquiryMappers";
import { mapBackendOrderListItemToOrder } from "@/lib/orderMappers";

function RoleDashboardPage() {
  const { data: session } = authClient.useSession();
  const enquiriesQuery = useEnquiries();
  const ordersQuery = useOrders({ limit: 100 });
  const orders = useMemo(
    () => [
      ...(ordersQuery.data ?? []).map(mapBackendOrderListItemToOrder),
      ...(enquiriesQuery.data ?? []).map(mapBackendEnquiryListItemToOrder),
    ],
    [enquiriesQuery.data, ordersQuery.data],
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
