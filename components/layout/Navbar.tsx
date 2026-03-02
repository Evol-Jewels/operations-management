import { MessageSquarePlus, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-12 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Wordmark */}
        <Link
          href="/"
          className="group flex items-center gap-2.5 transition-opacity hover:opacity-80"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded bg-foreground">
            <span className="text-[9px] font-black tracking-widest text-background">
              EJ
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-semibold tracking-tight text-foreground">
              EVOL Jewels
            </span>
            <span className="hidden text-xs text-muted-foreground/60 sm:block">
              / ops
            </span>
          </div>
        </Link>

        {/* Actions */}
        <TooltipProvider>
          <div className="flex items-center gap-1.5">
            {/* New Enquiry — text label on sm+, icon-only on mobile */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground sm:h-7 sm:w-auto sm:px-3"
                  aria-label="New Enquiry"
                >
                  <Link href="/enquiries/new">
                    <MessageSquarePlus className="h-4 w-4 sm:mr-1.5" />
                    <span className="hidden text-xs sm:inline">
                      New Enquiry
                    </span>
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="sm:hidden">
                <p className="text-xs">New Enquiry</p>
              </TooltipContent>
            </Tooltip>

            <Button size="sm" asChild className="h-8 gap-1.5 text-xs sm:h-7">
              <Link href="/orders/new">
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden xs:inline sm:inline">New Order</span>
                <span className="sr-only sm:hidden">New Order</span>
              </Link>
            </Button>
          </div>
        </TooltipProvider>
      </div>
    </header>
  );
}
