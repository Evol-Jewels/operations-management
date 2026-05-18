"use client";

import { LoaderCircle, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getSessionRole } from "@/lib/auth";
import { authClient } from "@/lib/auth-client";

export function Navbar() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/75 print-hide">
      <div className="mx-auto flex h-12 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <Link
            href="/orders-and-enquiries"
            className="group flex items-center gap-2.5 transition-opacity hover:opacity-80 md:hidden"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded bg-foreground">
              <span className="text-[9px] font-black tracking-widest text-background">
                EJ
              </span>
            </div>
            <span className="text-sm font-semibold tracking-tight text-foreground">
              EVOL Jewels
            </span>
          </Link>
        </div>

        <TooltipProvider>
          <div className="flex items-center gap-3">
            {isPending ? (
              <div className="flex h-8 items-center px-2 text-muted-foreground sm:h-7">
                <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
              </div>
            ) : session ? (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full p-0 hover:bg-muted/50"
                  >
                    <Avatar className="h-8 w-8">
                      {session.user.image && (
                        <AvatarImage
                          src={session.user.image}
                          alt={session.user.name}
                        />
                      )}
                      <AvatarFallback className="text-xs font-medium">
                        {session.user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-60 p-0" align="end" sideOffset={8}>
                  <div className="flex flex-col gap-0">
                    <div className="flex flex-col gap-1 p-3 pb-2">
                      <p className="text-sm font-semibold leading-none tracking-tight">
                        {session.user.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {session.user.email}
                      </p>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between px-3 py-2">
                      <span className="text-xs text-muted-foreground">
                        Role
                      </span>
                      <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium capitalize text-secondary-foreground">
                        {getSessionRole(session)}
                      </span>
                    </div>
                    <Separator />
                    <Button
                      variant="ghost"
                      className="w-full justify-start rounded-none px-3 py-2 text-sm font-normal hover:bg-destructive/10 hover:text-destructive"
                      onClick={handleSignOut}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
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
