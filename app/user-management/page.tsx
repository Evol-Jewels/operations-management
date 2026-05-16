import { RequireInternalAuth } from "@/components/auth/RequireInternalAuth";

export default function UserManagementPage() {
  return (
    <RequireInternalAuth>
      User Management
    </RequireInternalAuth>
  );
}
