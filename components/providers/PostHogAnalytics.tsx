"use client";

import { usePathname } from "next/navigation";
import posthog from "posthog-js";
import { useEffect } from "react";
import { getSessionRole, getUserRole } from "@/lib/auth";
import { authClient } from "@/lib/auth-client";

type AnalyticsUser = {
  id?: string;
  email?: string | null;
  name?: string | null;
  role?: string | null;
  profile?: {
    role?: string | null;
  } | null;
};

export function PostHogAnalytics() {
  const pathname = usePathname();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!pathname || !process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN) return;

    posthog.capture("$pageview", {
      // Query parameters can contain product codes, searches, and record IDs.
      // Keep page analytics useful without copying that business data to PostHog.
      $current_url: `${window.location.origin}${pathname}`,
      $pathname: pathname,
      app_area: pathname.split("/").filter(Boolean)[0] || "dashboard",
    });
  }, [pathname]);

  useEffect(() => {
    if (isPending || !process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN) return;

    if (!session?.user) {
      posthog.reset();
      return;
    }

    const user = session.user as AnalyticsUser;
    const distinctId = user.id || user.email;

    if (!distinctId) return;

    posthog.identify(distinctId, {
      email: user.email,
      name: user.name,
      user_role: getUserRole(session),
      internal_role: getSessionRole(session),
    });
  }, [isPending, session]);

  return null;
}
