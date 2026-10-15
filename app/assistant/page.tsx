import { Suspense } from "react";
import { AssistantWorkspace } from "@/components/assistant/AssistantWorkspace";
import { RequireInternalAuth } from "@/components/auth/RequireInternalAuth";

export default function AssistantPage() {
  return (
    <RequireInternalAuth roles={["ADMIN", "OPERATIONS", "SALES"]}>
      <Suspense>
        <AssistantWorkspace />
      </Suspense>
    </RequireInternalAuth>
  );
}
