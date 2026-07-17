"use client";

import { useMemo } from "react";
import { RequireInternalAuth } from "@/components/auth/RequireInternalAuth";
import {
  AdminDashboard,
  OperationsDashboard,
  SalesDashboard,
} from "@/components/dashboard/RoleDashboards";
import { useMyEnquiries } from "@/hooks/useEnquiries";
import { useOrdersEnquiriesAnalytics } from "@/hooks/useOrdersEnquiriesAnalytics";
import { useOrders } from "@/hooks/useOrders";
import { getSessionRole } from "@/lib/auth";
import { authClient } from "@/lib/auth-client";
import { mapBackendEnquiryListItemToOrder } from "@/lib/enquiryMappers";
import { mapBackendOrderListItemToOrder } from "@/lib/orderMappers";

function RoleDashboardPage() {
  const { data: session } = authClient.useSession();
  const role = getSessionRole(session).toUpperCase();
  const isSales = role === "SALES";
  const salesPersonId = session?.user.id;
  const analyticsQuery = useOrdersEnquiriesAnalytics();
  const enquiriesQuery = useMyEnquiries({ enabled: isSales });
  const ordersQuery = useOrders(
    { limit: 100, salesPerson: salesPersonId },
    { enabled: isSales && Boolean(salesPersonId) },
  );
  const orders = useMemo(
    () => [
      ...(ordersQuery.data ?? []).map(mapBackendOrderListItemToOrder),
      ...(enquiriesQuery.data ?? []).map(mapBackendEnquiryListItemToOrder),
    ],
    [enquiriesQuery.data, ordersQuery.data],
  );
  const analyticsProps = {
    analytics: analyticsQuery.data,
    analyticsError: analyticsQuery.error,
    analyticsLoading: analyticsQuery.isPending,
    onRetryAnalytics: () => void analyticsQuery.refetch(),
  };

  if (role === "ADMIN") return <AdminDashboard {...analyticsProps} />;
  if (role === "OPERATIONS") {
    return <OperationsDashboard {...analyticsProps} />;
  }
  return <SalesDashboard orders={orders} {...analyticsProps} />;
}

export default function DashboardPage() {
  return (
    <RequireInternalAuth>
      <RoleDashboardPage />
    </RequireInternalAuth>
  );
}
