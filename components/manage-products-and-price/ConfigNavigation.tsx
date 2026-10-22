"use client";

import {
  ChevronRight,
  CircleDollarSign,
  Layers3,
  LayoutGrid,
  ReceiptText,
  Truck,
} from "lucide-react";
import { type ReactNode, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export type ConfigTab = "stores" | "stones" | "system" | "vendors";

type SectionInfo = {
  tab: ConfigTab;
  label: string;
  title: string;
  description: string;
  icon: ReactNode;
};

const SECTIONS: SectionInfo[] = [
  {
    tab: "stores",
    label: "Stores",
    title: "Stores & Locations",
    description: "Manage store and warehouse locations used across the app.",
    icon: <CircleDollarSign className="h-5 w-5" />,
  },
  {
    tab: "stones",
    label: "Stones",
    title: "Stones & Slabs",
    description: "Manage stone types and their per-carat slab ranges.",
    icon: <Layers3 className="h-5 w-5" />,
  },
  {
    tab: "system",
    label: "System",
    title: "System Config",
    description: "Edit shared GST and making keys from system config.",
    icon: <ReceiptText className="h-5 w-5" />,
  },
  {
    tab: "vendors",
    label: "Vendors",
    title: "Vendors",
    description: "Manage vendor names and email addresses used for orders.",
    icon: <Truck className="h-5 w-5" />,
  },
];

function visibleSections(canManageVendors: boolean) {
  return SECTIONS.filter(
    (section) => section.tab !== "vendors" || canManageVendors,
  );
}

export function ConfigOverview({
  canManageVendors,
  onOpen,
}: {
  canManageVendors: boolean;
  onOpen: (tab: ConfigTab) => void;
}) {
  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          Manage Config & Pricing
        </h1>
        <p className="mt-2 hidden max-w-2xl text-sm text-muted-foreground sm:block">
          Manage backend pricing records for store locations, stone types, and
          stone slab ranges.
        </p>
      </div>

      <div className="grid gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-4">
        {visibleSections(canManageVendors).map((section) => (
          <button
            key={section.tab}
            type="button"
            onClick={() => onOpen(section.tab)}
            className="group flex cursor-pointer items-center gap-4 rounded-xl border border-border bg-card p-4 text-left shadow-sm outline-none transition-colors hover:border-foreground/30 hover:bg-muted/20 focus-visible:ring-2 focus-visible:ring-ring/40 md:min-h-36 md:items-start md:p-5"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground md:size-auto md:bg-transparent md:pt-0.5">
              {section.icon}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-foreground">
                {section.title}
              </h2>
              <p className="mt-0.5 text-sm leading-5 text-muted-foreground md:mt-2">
                {section.description}
              </p>
            </div>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground md:hidden" />
          </button>
        ))}
      </div>
    </div>
  );
}

export function ConfigSectionNav({
  active,
  canManageVendors,
  onOverview,
  onSelect,
}: {
  active: ConfigTab;
  canManageVendors: boolean;
  onOverview: () => void;
  onSelect: (tab: ConfigTab) => void;
}) {
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, []);

  const itemClass =
    "flex h-11 shrink-0 cursor-pointer items-center gap-2 border-b-2 px-1 text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:text-foreground";

  return (
    <nav
      aria-label="Config sections"
      className="-mx-4 mb-4 flex shrink-0 gap-5 overflow-x-auto border-b border-border px-4 [scrollbar-width:none] sm:mx-0 sm:mb-5 sm:px-0 [&::-webkit-scrollbar]:hidden"
    >
      <button
        type="button"
        onClick={onOverview}
        className={cn(
          itemClass,
          "border-transparent text-muted-foreground hover:text-foreground",
        )}
      >
        <LayoutGrid className="size-4" />
        All
      </button>
      {visibleSections(canManageVendors).map((section) => (
        <button
          key={section.tab}
          ref={section.tab === active ? activeRef : undefined}
          type="button"
          onClick={() => onSelect(section.tab)}
          aria-current={section.tab === active ? "page" : undefined}
          className={cn(
            itemClass,
            section.tab === active
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          {section.label}
        </button>
      ))}
    </nav>
  );
}
