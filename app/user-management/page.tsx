import { RequireInternalAuth } from "@/components/auth/RequireInternalAuth";
import { UserManagementPageClient } from "@/components/user-management/UserManagementPageClient";

export default function UserManagementPage() {
  return (
    <RequireInternalAuth>
      <UserManagementPageClient />
    </RequireInternalAuth>
  );
}
