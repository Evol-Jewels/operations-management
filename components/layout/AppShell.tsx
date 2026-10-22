"use client";

import { usePathname } from "next/navigation";
import { Suspense, useEffect, useEffectEvent } from "react";
import { AssistantLauncher } from "@/components/assistant/AssistantLauncher";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { MobileTopBar } from "@/components/layout/MobileTopBar";
import {
  SidebarInset,
  SidebarProvider,
  useSidebar,
} from "@/components/ui/sidebar";
import { getSessionRole } from "@/lib/auth";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const BOTTOM_NAV_ROLES = ["ADMIN", "OPERATIONS", "SALES"];
const WIDE_SCREEN_QUERY = "(min-width: 64rem)";

function Loading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  );
}

// Portrait tablets get the icon rail so content has room; wide screens keep the full sidebar.
function SidebarWidthSync() {
  const { setOpen } = useSidebar();
  // Only sync on breakpoint changes so a manual toggle sticks.
  const syncOpen = useEffectEvent((open: boolean) => setOpen(open));

  useEffect(() => {
    const query = window.matchMedia(WIDE_SCREEN_QUERY);
    if (!query.matches) syncOpen(false);
    const onChange = (event: MediaQueryListEvent) => syncOpen(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return null;
}

function isFocusedFlow(pathname: string) {
  return /\/(new|edit)(\/|$)/.test(pathname) || pathname === "/assistant";
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = authClient.useSession();
  const showSidebar = pathname !== "/login";
  // The assistant page manages its own full-height layout.
  const fullBleed = pathname === "/assistant";
  const showBottomNav =
    Boolean(session) &&
    BOTTOM_NAV_ROLES.includes(getSessionRole(session)) &&
    !isFocusedFlow(pathname);

  if (!showSidebar) {
    return (
      <div className="min-h-svh">
        <div className="mx-auto w-full max-w-400 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
          <Suspense fallback={<Loading />}>{children}</Suspense>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider className="h-svh overflow-hidden">
      <SidebarWidthSync />
      <AppSidebar />
      <SidebarInset
        id="app-content"
        className={cn(
          "h-svh overflow-x-clip overflow-y-auto [--mobile-nav-h:0px] [--mobile-top-h:3.5rem] md:[--mobile-top-h:0px]",
          showBottomNav &&
            "[--mobile-nav-h:calc(4rem+env(safe-area-inset-bottom))] md:[--mobile-nav-h:0px]",
        )}
      >
        <MobileTopBar />
        {fullBleed ? (
          <Suspense fallback={<Loading />}>{children}</Suspense>
        ) : (
          <>
            <div className="mx-auto min-h-full w-full max-w-400 shrink-0 px-4 pt-4 pb-[calc(var(--mobile-nav-h)+1.25rem)] sm:px-6 sm:pt-6 md:pb-6">
              <Suspense fallback={<Loading />}>{children}</Suspense>
            </div>
            <Suspense fallback={null}>
              <AssistantLauncher />
            </Suspense>
          </>
        )}
        {showBottomNav && <MobileBottomNav />}
      </SidebarInset>
    </SidebarProvider>
  );
}
