import { RequireInternalAuth } from "@/components/auth/RequireInternalAuth";
import { OrdersEnquiriesWorkspace } from "@/components/dashboard/OrdersEnquiriesWorkspace";

export default function OrdersWorkspacePage() {
  return (
    <RequireInternalAuth>
      <OrdersEnquiriesWorkspace />
    </RequireInternalAuth>
  );
}
