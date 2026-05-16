"use client";

import {
  Boxes,
  Calculator,
  ChevronsLeft,
  House,
  LogOut,
  MessageSquare,
  ShieldUser,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { getSessionRole } from "@/lib/auth";
import { authClient } from "@/lib/auth-client";

const navItems = [
  {
    icon: House,
    label: "Home",
    href: "/",
  },
  {
    icon: MessageSquare,
    label: "Orders and Enquiries",
    href: "/orders-and-enquiries",
  },
  {
    icon: Calculator,
    label: "Calculator",
    href: "/calculator",
  },
  {
    icon: Boxes,
    label: "Manage Products and Price",
    href: "/manage-products-and-price",
  },
  {
    icon: ShieldUser,
    label: "User Management",
    href: "/user-management",
  },
];

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

export function AppSidebar() {
  const pathname = usePathname();
  const { data: session } = authClient.useSession();
  const { state, toggleSidebar } = useSidebar();

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="py-3">
        <div className="flex items-center gap-2 px-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <SidebarMenu className="flex-1">
            <SidebarMenuItem>
              {state === "collapsed" ? (
                <SidebarMenuButton
                  size="lg"
                  tooltip="Expand sidebar"
                  onClick={toggleSidebar}
                  className="group/logo !h-10 !w-10 !justify-center !p-0"
                >
                  <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background">
                    <span className="text-[10px] font-black tracking-widest transition-opacity group-hover/logo:opacity-0">
                      EJ
                    </span>
                    <ChevronsLeft className="absolute h-4 w-4 rotate-180 opacity-0 transition-opacity group-hover/logo:opacity-100" />
                  </div>
                </SidebarMenuButton>
              ) : (
                <SidebarMenuButton size="lg" asChild>
                  <Link
                    href="/orders-and-enquiries"
                    className="flex w-full items-center gap-2.5"
                  >
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-foreground text-background">
                      <span className="text-[10px] font-black tracking-widest">
                        EJ
                      </span>
                    </div>
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-semibold tracking-tight">
                        EVOL Jewels
                      </span>
                      <span className="text-[11px] text-muted-foreground/70">
                        Operations
                      </span>
                    </div>
                  </Link>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          </SidebarMenu>

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={toggleSidebar}
            className="hidden shrink-0 md:inline-flex group-data-[collapsible=icon]:hidden"
            aria-label="Collapse sidebar"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
        </div>
      </SidebarHeader>

      <SidebarSeparator className="mx-3" />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                    tooltip={item.label}
                    className="bg-transparent text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[active=true]:shadow-none"
                  >
                    <Link
                      href={item.href}
                      className="flex w-full min-w-0 items-center gap-2 overflow-hidden group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0"
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator className="mx-3" />

      <SidebarFooter>
        {session ? (
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex w-full min-w-0 items-center gap-2 overflow-hidden rounded-lg p-2 text-left transition-colors hover:bg-sidebar-accent group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
              >
                <Avatar className="h-7 w-7 flex-shrink-0 border border-sidebar-border">
                  <AvatarFallback className="bg-blue-100 text-[10px] font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    {initials(session.user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-col items-start group-data-[collapsible=icon]:hidden">
                  <span className="truncate text-sm font-medium leading-none">
                    {session.user.name.split(" ")[0]}
                  </span>
                  <span className="mt-0.5 truncate text-[11px] text-muted-foreground">
                    {session.user.email}
                  </span>
                </div>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-60 p-0" align="start" side="top">
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
                  <span className="text-xs text-muted-foreground">Role</span>
                  <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium capitalize text-secondary-foreground">
                    {getSessionRole(session)}
                  </span>
                </div>
                <Separator />
                <button
                  type="button"
                  onClick={async () => {
                    await authClient.signOut();
                    window.location.href = "/login";
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm font-normal text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          <SidebarMenuButton
            asChild
            tooltip="Sign in"
            className="text-muted-foreground"
          >
            <Link
              href="/login"
              className="flex w-full min-w-0 items-center justify-center overflow-hidden"
            >
              <span className="text-sm font-medium">Sign in</span>
            </Link>
          </SidebarMenuButton>
        )}
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
