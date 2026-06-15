import { RequireInternalAuth } from "@/components/auth/RequireInternalAuth";
import { ProfilePageClient } from "@/components/profile/ProfilePageClient";

export default function ProfilePage() {
  return (
    <RequireInternalAuth>
      <ProfilePageClient />
    </RequireInternalAuth>
  );
}
