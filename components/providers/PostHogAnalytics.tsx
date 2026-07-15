"use client";

import { usePathname, useSearchParams } from "next/navigation";
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

type SearchParamsLike = {
  toString: () => string;
};

function getCurrentUrl(pathname: string, searchParams: SearchParamsLike) {
  const queryString = searchParams.toString();
  return `${window.location.origin}${pathname}${queryString ? `?${queryString}` : ""}`;
}

export function PostHogAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!pathname || !process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN) return;

    posthog.capture("$pageview", {
      $current_url: getCurrentUrl(pathname, searchParams),
      app_area: pathname.split("/").filter(Boolean)[0] || "dashboard",
    });
  }, [pathname, searchParams]);

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
