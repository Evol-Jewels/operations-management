import type { AuthSession } from "@/lib/auth-client";

type SessionUserWithProfile = NonNullable<AuthSession>["user"] & {
  profile?: {
    role?: string | null;
  } | null;
};

export function getSessionRole(session: AuthSession | null | undefined) {
  const user = session?.user as SessionUserWithProfile | undefined;
  return user?.profile?.role ?? user?.role ?? "customer";
}

export function getUserRole(session: AuthSession | null | undefined) {
  const user = session?.user as SessionUserWithProfile | undefined;
  return user?.role ?? "customer";
}
