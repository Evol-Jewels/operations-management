"use client";

import { useMemo, useState } from "react";
import { RequireInternalAuth } from "@/components/auth/RequireInternalAuth";
import {
  AdminDashboard,
  OperationsDashboard,
  SalesDashboard,
  type SalesTab,
} from "@/components/dashboard/RoleDashboards";
import { useMyEnquiries, useOpenStoreEnquiries } from "@/hooks/useEnquiries";
import { useMyInternalProfile } from "@/hooks/useInternalProfile";
import { useOpenStoreOrders, useOrders } from "@/hooks/useOrders";
import { useOrdersEnquiriesAnalytics } from "@/hooks/useOrdersEnquiriesAnalytics";
import { getSessionRole } from "@/lib/auth";
import { authClient } from "@/lib/auth-client";
import { mapBackendEnquiryListItemToOrder } from "@/lib/enquiryMappers";
import { mapBackendOrderListItemToOrder } from "@/lib/orderMappers";

function RoleDashboardPage() {
  const { data: session } = authClient.useSession();
  const role = getSessionRole(session).toUpperCase();
  const isSales = role === "SALES";
  const salesPersonId = session?.user.id;
  const [activeSalesTab, setActiveSalesTab] = useState<SalesTab>("orders");
  const analyticsQuery = useOrdersEnquiriesAnalytics();
  const enquiriesQuery = useMyEnquiries({
    enabled: isSales && activeSalesTab === "enquiries",
  });
  const ordersQuery = useOrders(
    { limit: 100, salesPerson: salesPersonId },
    {
      enabled: isSales && activeSalesTab === "orders" && Boolean(salesPersonId),
    },
  );
  const profileQuery = useMyInternalProfile();
  const storeLocation = isSales ? profileQuery.data?.profile?.location : null;
  const hasStoreLocation = Boolean(storeLocation?.id);
  const storeOrdersQuery = useOpenStoreOrders({
    enabled: isSales && hasStoreLocation && activeSalesTab === "store-orders",
  });
  const storeEnquiriesQuery = useOpenStoreEnquiries({
    enabled:
      isSales && hasStoreLocation && activeSalesTab === "store-enquiries",
  });
  const orders = useMemo(
    () => [
      ...(ordersQuery.data ?? []).map(mapBackendOrderListItemToOrder),
      ...(enquiriesQuery.data ?? []).map(mapBackendEnquiryListItemToOrder),
    ],
    [enquiriesQuery.data, ordersQuery.data],
  );
  const storeOrders = useMemo(
    () => [
      ...(storeOrdersQuery.data ?? []).map(mapBackendOrderListItemToOrder),
      ...(storeEnquiriesQuery.data ?? []).map(mapBackendEnquiryListItemToOrder),
    ],
    [storeEnquiriesQuery.data, storeOrdersQuery.data],
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
  return (
    <SalesDashboard
      activeTab={activeSalesTab}
      onActiveTabChange={setActiveSalesTab}
      orders={orders}
      storeOrders={storeOrders}
      storeLocation={storeLocation ?? null}
      storeRecordsLoading={
        hasStoreLocation &&
        (activeSalesTab === "store-orders"
          ? storeOrdersQuery.isLoading
          : storeEnquiriesQuery.isLoading)
      }
      storeRecordsError={
        activeSalesTab === "store-orders"
          ? storeOrdersQuery.error
          : storeEnquiriesQuery.error
      }
      {...analyticsProps}
    />
  );
}

export default function DashboardPage() {
  return (
    <RequireInternalAuth>
      <RoleDashboardPage />
    </RequireInternalAuth>
  );
}
