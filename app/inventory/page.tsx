import { RequireInternalAuth } from "@/components/auth/RequireInternalAuth";
import { InventoryPageClient } from "@/components/inventory/InventoryPageClient";

export default function InventoryPage() {
  return (
    <RequireInternalAuth>
      <InventoryPageClient />
    </RequireInternalAuth>
  );
}
