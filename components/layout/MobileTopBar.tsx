"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { MobileGoldRateAction } from "@/components/layout/MobileGoldRateAction";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";

export function MobileTopBar() {
  const { toggleSidebar } = useSidebar();

  return (
    <header
      data-mobile-top-bar
      className="print-hide sticky top-0 z-30 flex h-(--mobile-top-h) shrink-0 items-center gap-2 border-b border-border/60 bg-background/90 px-2 backdrop-blur md:hidden"
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-10"
        onClick={toggleSidebar}
        aria-label="Open menu"
      >
        <Menu className="size-5" />
      </Button>
      <Link href="/" className="mr-auto flex items-center" aria-label="Home">
        <img
          src="/evol-logo.webp"
          alt="EVOL"
          className="h-6 w-auto dark:brightness-0 dark:invert"
        />
      </Link>
      <div className="pr-1">
        <MobileGoldRateAction />
      </div>
    </header>
  );
}
