"use client";

import { ChevronDown, LayoutGrid, List, PackagePlus, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { captureProductEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import type { WorkspaceViewMode } from "./WorkspaceViewToggle";

export interface WorkspaceTab<T extends string> {
  key: T;
  label: string;
  count?: number;
}

const NEW_LINKS = [
  { href: "/enquiries/new", label: "New enquiry", icon: Plus },
  { href: "/orders/new", label: "New order", icon: PackagePlus },
] as const;

function NewRecordActions({ isRepairTab }: { isRepairTab: boolean }) {
  if (isRepairTab) {
    return (
      <Button asChild className="h-10 sm:h-9">
        <Link href="/repairs/new">
          <Plus className="size-4" />
          New repair
        </Link>
      </Button>
    );
  }

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button className="h-10 gap-1.5 sm:hidden">
            <Plus className="size-4" />
            New
            <ChevronDown className="size-3.5 opacity-70" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-48 p-1">
          {NEW_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex h-11 items-center gap-2.5 rounded-md px-3 text-sm font-medium hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
            >
              <Icon className="size-4 text-muted-foreground" />
              {label}
            </Link>
          ))}
        </PopoverContent>
      </Popover>
      {NEW_LINKS.map(({ href, label, icon: Icon }, index) => (
        <Button
          key={href}
          asChild
          variant={index === 0 ? "default" : "secondary"}
          className="hidden sm:inline-flex"
        >
          <Link href={href}>
            <Icon className="size-4" />
            {label}
          </Link>
        </Button>
      ))}
    </>
  );
}

export function WorkspaceHeader<T extends string>({
  isPhotography,
  tabs,
  activeTab,
  onTabChange,
  viewMode,
  onViewModeChange,
  showViewToggle,
}: {
  isPhotography: boolean;
  tabs: WorkspaceTab<T>[];
  activeTab: T;
  onTabChange: (tab: T) => void;
  viewMode: WorkspaceViewMode;
  onViewModeChange: (mode: WorkspaceViewMode) => void;
  showViewToggle: boolean;
}) {
  const activeTabRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const element = activeTabRef.current;
    if (element?.dataset.tab !== activeTab) return;
    element.scrollIntoView({ block: "nearest", inline: "center" });
  }, [activeTab]);

  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {isPhotography ? "Orders" : "Orders and enquiries"}
          </h1>
          <p className="mt-1 hidden max-w-xl text-sm leading-6 text-muted-foreground sm:block">
            {isPhotography
              ? "View orders. Select an order to update its status."
              : "Filter, review, and move production records without crowding the dashboard."}
          </p>
        </div>
        {!isPhotography && (
          <div className="flex shrink-0 items-center gap-2">
            <NewRecordActions isRepairTab={activeTab === "repair"} />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 scrollbar-none sm:mx-0 sm:flex-wrap sm:px-0">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                ref={isActive ? activeTabRef : undefined}
                data-tab={tab.key}
                key={tab.key}
                type="button"
                aria-pressed={isActive}
                onClick={() => onTabChange(tab.key)}
                className={cn(
                  "flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors sm:h-8",
                  isActive
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-background text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
                {isActive && tab.count !== undefined && (
                  <span className="text-xs tabular-nums opacity-70">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div
          className={cn(
            "hidden items-center gap-1 rounded-lg border border-border bg-background p-1",
            showViewToggle && "lg:flex",
          )}
        >
          {(
            [
              { mode: "table", label: "Table", icon: List },
              { mode: "kanban", label: "Kanban", icon: LayoutGrid },
            ] as const
          ).map(({ mode, label, icon: Icon }) => (
            <button
              key={mode}
              type="button"
              onClick={() => {
                onViewModeChange(mode);
                captureProductEvent("workspace_view_changed", {
                  record_type: activeTab,
                  view_mode: mode,
                  surface: "desktop",
                });
              }}
              className={cn(
                "flex min-h-9 cursor-pointer items-center justify-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors",
                viewMode === mode
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
