"use client";

import {
  BookA,
  Boxes,
  Calculator,
  House,
  LogOut,
  MoonStar,
  PackagePlus,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  ShieldUser,
  SunMedium,
  Warehouse,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/components/providers/ThemeProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
    icon: BookA,
    label: "Orders and Enquiries",
    href: "/orders-and-enquiries",
  },
  {
    icon: Calculator,
    label: "Calculator",
    href: "/calculator",
  },
  {
    icon: Warehouse,
    label: "Inventory",
    href: "/inventory",
  },
  {
    icon: Boxes,
    label: "Manage Config & Pricing",
    href: "/manage-products-and-price",
    roles: ["ADMIN", "OPERATIONS"],
  },
  {
    icon: ShieldUser,
    label: "User Management",
    href: "/user-management",
    roles: ["ADMIN"],
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
  const { theme, setTheme } = useTheme();

  const sessionRole = session ? getSessionRole(session) : "";
  const canCreateOrder = ["ADMIN", "OPERATIONS"].includes(sessionRole);
  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(`${href}/`);
  };
  const visibleNavItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(sessionRole),
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="py-3">
        <div className="flex items-center justify-between">
          <SidebarMenu className="flex-1">
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                tooltip={
                  state === "collapsed"
                    ? "Open sidebar"
                    : "Orders and Enquiries"
                }
                onClick={state === "collapsed" ? toggleSidebar : undefined}
                asChild={state === "expanded"}
                className="group/logo"
              >
                <div className="relative flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
                  <div
                    className={`relative ${state === "collapsed" ? "w-full" : "w-1/3"}`}
                  >
                    <Avatar
                      className={`rounded-sm ${state === "collapsed" ? "group-hover:opacity-0 size-6" : "size-8"} w-full`}
                    >
                      <AvatarImage
                        src={
                          theme === "dark"
                            ? "/evol-logo-white.webp"
                            : "/evol-logo.webp"
                        }
                        alt="EVOL"
                        className="object-contain dark:brightness-0 dark:invert"
                      />
                      <AvatarFallback className="bg-sidebar-accent text-xs font-semibold">
                        Evol
                      </AvatarFallback>
                    </Avatar>
                    {state === "collapsed" && (
                      <PanelLeftOpen className="absolute inset-0 m-auto h-5 w-5 opacity-0 transition-opacity group-hover:opacity-100" />
                    )}
                  </div>
                  <div className="flex flex-col items-start group-data-[collapsible=icon]:hidden">
                    <span className="text-sm font-semibold">EVOL</span>
                    <Badge
                      variant="default"
                      className="mt-1 h-4 px-1.5 text-[10px] font-medium"
                    >
                      Operations
                    </Badge>
                  </div>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          {state === "expanded" && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={toggleSidebar}
              className="shrink-0"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="h-5 w-5" />
            </Button>
          )}
        </div>
      </SidebarHeader>

      <SidebarSeparator className="mx-3" />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleNavItems.map((item) => (
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
                      <item.icon className="h-5 w-5" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/enquiries/new"}
                  tooltip="Create New Enquiry"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground data-[active=true]:bg-primary/90 data-[active=true]:text-primary-foreground data-[active=true]:shadow-none mt-3"
                >
                  <Link
                    href="/enquiries/new"
                    className="flex w-full min-w-0 items-center gap-2 overflow-hidden"
                  >
                    <Plus className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate group-data-[collapsible=icon]:hidden">
                      Create New Enquiry
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {canCreateOrder && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === "/orders/new"}
                    tooltip="Create New Order"
                    className="my-1 bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:text-secondary-foreground data-[active=true]:bg-secondary data-[active=true]:text-secondary-foreground data-[active=true]:shadow-none"
                  >
                    <Link
                      href="/orders/new"
                      className="flex w-full min-w-0 items-center gap-2 overflow-hidden"
                    >
                      <PackagePlus className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate group-data-[collapsible=icon]:hidden">
                        Create New Order
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator className="mx-3" />

      <SidebarFooter>
        <div className="group-data-[collapsible=icon]:px-0">
          <div className="rounded-xl border border-sidebar-border bg-sidebar-accent/40 p-1 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:w-fit">
            <div className="flex items-center gap-1 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-2">
              <Button
                type="button"
                variant={theme === "light" ? "default" : "ghost"}
                size="sm"
                onClick={() => setTheme("light")}
                className="h-8 justify-center gap-2 px-3 group-data-[collapsible=icon]:size-6 group-data-[collapsible=icon]:flex-none group-data-[collapsible=icon]:px-0"
                aria-pressed={theme === "light"}
                aria-label="Switch to light theme"
              >
                <SunMedium className="h-4 w-4" />
                <span className="group-data-[collapsible=icon]:hidden">
                  Light
                </span>
              </Button>
              <Button
                type="button"
                variant={theme === "dark" ? "default" : "ghost"}
                size="sm"
                onClick={() => setTheme("dark")}
                className="h-8 flex-1 justify-center gap-2 px-3 group-data-[collapsible=icon]:size-6 group-data-[collapsible=icon]:flex-none group-data-[collapsible=icon]:px-0"
                aria-pressed={theme === "dark"}
                aria-label="Switch to dark theme"
              >
                <MoonStar className="h-4 w-4" />
                <span className="group-data-[collapsible=icon]:hidden">
                  Dark
                </span>
              </Button>
            </div>
          </div>
        </div>

        {session ? (
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex w-full min-w-0 items-center gap-2 overflow-hidden rounded-lg p-2 text-left transition-colors hover:bg-sidebar-accent group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
              >
                <Avatar className="h-7 w-7 flex-shrink-0 border border-sidebar-border">
                  <AvatarFallback className="bg-sidebar-accent text-[10px] font-semibold text-sidebar-accent-foreground">
                    {initials(session.user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-col items-start group-data-[collapsible=icon]:hidden">
                  <span className="truncate text-sm font-medium">
                    {session.user.name.split(" ")[0]}
                  </span>
                </div>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-60 p-0" align="start" side="top">
              <div className="flex flex-col gap-0">
                <div className="flex flex-col gap-1 p-3 pb-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-sm font-medium">
                        {initials(session.user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 flex flex-col">
                      <p className="text-sm font-semibold tracking-tight">
                        {session.user.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {session.user.email}
                      </p>
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-xs text-muted-foreground">Role</span>
                  <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium capitalize text-secondary-foreground">
                    {getSessionRole(session)}
                  </span>
                </div>
                <Separator />
                <Link
                  href="/profile"
                  className="block w-full px-3 py-2 text-sm font-normal text-left hover:bg-sidebar-accent/50"
                >
                  Edit Profile
                </Link>
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
