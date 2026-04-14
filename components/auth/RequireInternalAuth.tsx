"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";

function LoadingState() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <p className="text-sm text-muted-foreground">Checking session...</p>
    </div>
  );
}

function UnauthorizedState() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-24 text-center">
      <h1 className="text-lg font-semibold text-foreground">
        Internal access required
      </h1>
      <p className="text-sm text-muted-foreground">
        Your account is signed in, but it does not have access to the
        operations dashboard.
      </p>
      <Link
        href="/orders/evl-001-priya-ring"
        className="text-sm font-medium text-foreground underline underline-offset-4"
      >
        Open a shared order page
      </Link>
    </div>
  );
}

export function RequireInternalAuth({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session, isPending } = authClient.useSession();
  const queryString = searchParams.toString();
  const nextPath = pathname
    ? `${pathname}${queryString ? `?${queryString}` : ""}`
    : "";

  useEffect(() => {
    if (isPending) return;
    if (!session) {
      const next = nextPath ? `?next=${encodeURIComponent(nextPath)}` : "";
      router.replace(`/login${next}`);
    }
  }, [isPending, nextPath, router, session]);

  if (isPending || !session) {
    return <LoadingState />;
  }

  if (session.user.role !== "internal") {
    return <UnauthorizedState />;
  }

  return <>{children}</>;
}
