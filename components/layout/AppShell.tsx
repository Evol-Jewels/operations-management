"use client";

import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { AssistantLauncher } from "@/components/assistant/AssistantLauncher";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { MobileGoldRateAction } from "@/components/layout/MobileGoldRateAction";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

function Loading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showSidebar = pathname !== "/login";
  // The assistant page manages its own full-height layout.
  const fullBleed = pathname === "/assistant";

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
      <AppSidebar />
      <SidebarInset
        id="app-content"
        className="h-svh overflow-x-clip overflow-y-auto"
      >
        <SidebarTrigger className="fixed top-4 left-4 z-40 rounded-full border border-border/70 bg-background/90 shadow-sm backdrop-blur md:hidden print-hide" />
        {fullBleed ? (
          <Suspense fallback={<Loading />}>{children}</Suspense>
        ) : (
          <>
            <MobileGoldRateAction />
            <div className="mx-auto min-h-full w-full max-w-400 px-4 pt-16 pb-5 sm:p-6">
              <Suspense fallback={<Loading />}>{children}</Suspense>
            </div>
            <Suspense fallback={null}>
              <AssistantLauncher />
            </Suspense>
          </>
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}
