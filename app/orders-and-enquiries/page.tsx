import { RequireInternalAuth } from "@/components/auth/RequireInternalAuth";
import { OrdersEnquiriesWorkspace } from "@/components/dashboard/OrdersEnquiriesWorkspace";

export default function OrdersAndEnquiriesPage() {
  return (
    <RequireInternalAuth>
      <OrdersEnquiriesWorkspace />
    </RequireInternalAuth>
  );
}
