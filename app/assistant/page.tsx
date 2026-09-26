import { InventoryChat } from "@/components/agent/InventoryChat";
import { RequireInternalAuth } from "@/components/auth/RequireInternalAuth";

export default function AssistantPage() {
  return (
    <RequireInternalAuth>
      <InventoryChat />
    </RequireInternalAuth>
  );
}
