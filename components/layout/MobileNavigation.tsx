"use client";

import { BookA, Calculator, House, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const mobileRoutes = [
  { href: "/", label: "Home", icon: House },
  { href: "/orders-workspace", label: "Work", icon: BookA },
  { href: "/calculator", label: "Calculator", icon: Calculator },
];

const routesWithMobileNav = new Set([
  "/",
  "/orders-workspace",
  "/calculator",
]);

export function MobileNavigation() {
  const pathname = usePathname();

  if (!routesWithMobileNav.has(pathname)) return null;

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-8px_24px_rgba(0,0,0,0.06)] backdrop-blur-xl md:hidden print-hide"
    >
      <div className="mx-auto grid max-w-md grid-cols-4 items-end gap-1">
        {mobileRoutes.slice(0, 2).map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <MobileNavLink key={item.href} {...item} active={active} />
          );
        })}

        <Link
          href="/enquiries/new"
          className="flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl bg-primary px-2 text-primary-foreground shadow-sm transition-colors active:bg-primary/85"
        >
          <Plus className="size-5" />
          <span className="text-[11px] font-semibold">New enquiry</span>
        </Link>

        <MobileNavLink
          {...mobileRoutes[2]}
          active={pathname.startsWith(mobileRoutes[2].href)}
        />
      </div>
    </nav>
  );
}

function MobileNavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: typeof House;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl px-2 text-muted-foreground transition-colors active:bg-muted",
        active && "bg-muted text-foreground",
      )}
    >
      <Icon className="size-5" />
      <span className="text-[11px] font-medium">{label}</span>
    </Link>
  );
}
