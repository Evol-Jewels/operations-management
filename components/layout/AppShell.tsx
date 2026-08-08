"use client";

import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { MobileGoldRateAction } from "@/components/layout/MobileGoldRateAction";
import { MobileNavigation } from "@/components/layout/MobileNavigation";
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
        <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-border/70 bg-background/95 px-3 backdrop-blur-xl md:hidden print-hide">
          <SidebarTrigger className="size-11 rounded-xl border-0 bg-transparent shadow-none" />
          <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-sm font-semibold tracking-[0.16em]">
            EVOL
          </span>
          <MobileGoldRateAction />
        </header>
        <div className="mx-auto min-h-full w-full max-w-400 px-4 pt-[4.5rem] pb-24 sm:p-6">
          <Suspense fallback={<Loading />}>{children}</Suspense>
        </div>
        <MobileNavigation />
      </SidebarInset>
    </SidebarProvider>
  );
}
