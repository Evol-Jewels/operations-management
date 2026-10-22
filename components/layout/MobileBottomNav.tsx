"use client";

import {
  BookA,
  Calculator,
  FilePlus2,
  House,
  PackagePlus,
  Plus,
  Warehouse,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const tabs = [
  { icon: House, label: "Home", href: "/" },
  { icon: BookA, label: "Orders", href: "/orders-workspace" },
  { icon: Calculator, label: "Calculator", href: "/calculator" },
  { icon: Warehouse, label: "Inventory", href: "/inventory" },
];

const createActions = [
  {
    icon: FilePlus2,
    label: "New enquiry",
    description: "Capture a customer requirement",
    href: "/enquiries/new",
  },
  {
    icon: PackagePlus,
    label: "New order",
    description: "Stock or custom order",
    href: "/orders/new",
  },
  {
    icon: Wrench,
    label: "New repair",
    description: "Log a repair or service job",
    href: "/repairs/new",
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/inventory") return pathname === "/inventory";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function TabLink({
  icon: Icon,
  label,
  href,
  active,
}: (typeof tabs)[number] & { active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
        active ? "text-foreground" : "text-muted-foreground",
      )}
    >
      <span
        className={cn(
          "flex h-7 w-12 items-center justify-center rounded-full transition-colors",
          active && "bg-accent",
        )}
      >
        <Icon className="size-5" />
      </span>
      <span className="truncate">{label}</span>
    </Link>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const [createOpen, setCreateOpen] = useState(false);
  const [left, right] = [tabs.slice(0, 2), tabs.slice(2)];

  return (
    <>
      <nav
        aria-label="Primary"
        className="print-hide fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background pb-[env(safe-area-inset-bottom)] shadow-[0_-1px_8px_rgb(0_0_0/0.04)] md:hidden"
      >
        <div className="mx-auto flex h-16 max-w-lg items-stretch px-1">
          {left.map((tab) => (
            <TabLink
              key={tab.href}
              {...tab}
              active={isActive(pathname, tab.href)}
            />
          ))}
          <div className="flex flex-1 items-center justify-center">
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              aria-label="Create new"
              className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform active:scale-95"
            >
              <Plus className="size-6" />
            </button>
          </div>
          {right.map((tab) => (
            <TabLink
              key={tab.href}
              {...tab}
              active={isActive(pathname, tab.href)}
            />
          ))}
        </div>
      </nav>

      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent side="bottom" className="gap-2 px-4 pt-5">
          <SheetHeader className="text-left">
            <SheetTitle>Create new</SheetTitle>
            <SheetDescription className="sr-only">
              Start a new enquiry, order or repair.
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-2">
            {createActions.map(({ icon: Icon, label, description, href }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setCreateOpen(false)}
                className="flex items-center gap-3 rounded-xl border border-border/70 bg-card p-3 transition-colors hover:bg-accent active:bg-accent"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                  <Icon className="size-5" />
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="text-sm font-semibold">{label}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {description}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
