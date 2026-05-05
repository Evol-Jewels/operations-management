"use client";

import { LoaderCircle, LogOut, MessageSquarePlus, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function Navbar() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const isInternal = session?.user.role === "internal";

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-12 max-w-7xl items-center justify-between px-4 sm:px-6">
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

        <TooltipProvider>
          <div className="flex items-center gap-1.5">
            {isInternal ? (
              <>
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

                <Button
                  size="sm"
                  asChild
                  className="h-8 gap-1.5 text-xs sm:h-7"
                >
                  <Link href="/orders/new">
                    <Plus className="h-3.5 w-3.5" />
                    <span className="hidden xs:inline sm:inline">
                      New Order
                    </span>
                    <span className="sr-only sm:hidden">New Order</span>
                  </Link>
                </Button>
              </>
            ) : null}

            {isPending ? (
              <div className="flex h-8 items-center px-2 text-muted-foreground sm:h-7">
                <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
              </div>
            ) : session ? (
              <>
                <div className="hidden items-center gap-2 rounded-full border border-border bg-card px-2.5 py-1 sm:flex">
                  <span className="text-xs font-medium text-foreground">
                    {session.user.name}
                  </span>
                  <span className="rounded-full bg-muted px-1.5 py-px text-[10px] uppercase tracking-wide text-muted-foreground">
                    {session.user.role}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="h-8 gap-1.5 text-xs sm:h-7"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Sign out</span>
                </Button>
              </>
            ) : (
              <Button size="sm" asChild className="h-8 text-xs sm:h-7">
                <Link href="/login">Sign in</Link>
              </Button>
            )}
          </div>
        </TooltipProvider>
      </div>
    </header>
  );
}
