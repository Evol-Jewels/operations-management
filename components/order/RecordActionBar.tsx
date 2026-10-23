"use client";

import { MessageSquarePlus } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const COMPOSER_ID = "activity-message";

export function focusActivityComposer() {
  const composer = document.getElementById(COMPOSER_ID);
  if (!composer) return;
  (composer.closest("form") ?? composer).scrollIntoView({
    behavior: "smooth",
    block: "end",
  });
  composer.focus({ preventScroll: true });
}

/**
 * Inline on tablet/desktop; pinned above the bottom tab bar on phones so the
 * record's primary actions stay reachable while scrolling.
 */
export function RecordActionBar({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      data-fab-avoid
      className={cn(
        "flex items-center gap-2 print-hide",
        "max-md:fixed max-md:inset-x-0 max-md:bottom-[var(--mobile-nav-h,0px)] max-md:z-30 max-md:border-t max-md:border-border max-md:bg-background/95 max-md:px-4 max-md:py-2.5 max-md:shadow-[0_-4px_16px_-8px_rgb(0_0_0/0.12)] max-md:backdrop-blur max-md:[&_[data-slot=select-trigger]]:h-10! max-md:[&_[data-slot=select-trigger]]:flex-1 max-md:[&_[data-slot=select-trigger]]:text-sm max-md:[&>a]:h-10 max-md:[&>button]:h-10",
        className,
      )}
    >
      {children}
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={focusActivityComposer}
        aria-label="Post an update"
        className="size-10 shrink-0 md:hidden"
      >
        <MessageSquarePlus className="size-4" />
      </Button>
    </div>
  );
}

/** Reserves room at the end of a record page for the pinned phone action bar. */
export function RecordActionBarSpacer() {
  return <div aria-hidden="true" className="h-16 max-md:h-20" />;
}
