import { RequireInternalAuth } from "@/components/auth/RequireInternalAuth";
import { ProductAnalyticsPageClient } from "@/components/inventory/ProductAnalyticsPageClient";

export default function InventoryAnalyticsPage() {
  return (
    <RequireInternalAuth roles={["ADMIN", "OPERATIONS"]}>
      <ProductAnalyticsPageClient />
    </RequireInternalAuth>
  );
}
