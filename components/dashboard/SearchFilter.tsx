"use client";

import { ChevronDown, Search, User, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { Stage } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export type TypeFilter = "all" | "order" | "enquiry";

interface SearchFilterProps {
  search: string;
  onSearchChange: (val: string) => void;
  typeFilter: TypeFilter;
  onTypeChange: (val: TypeFilter) => void;
  typeCounts: Record<TypeFilter, number>;
  staffSearch: string;
  onStaffChange: (val: string) => void;
  allPeople: { sales: string[]; vendors: string[] };
  activeFilters: { key: string; label: string; onRemove: () => void }[];
  hasFilters: boolean;
  onClear: () => void;
  /** Optional pills rendered inline to the right of the search input */
  quickFilters?: React.ReactNode;
  /** View mode toggle (List / Board) rendered at the right end of the search row */
  viewToggle?: React.ReactNode;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SearchFilter({
  search,
  onSearchChange,
  typeFilter,
  onTypeChange,
  typeCounts,
  staffSearch,
  onStaffChange,
  allPeople,
  activeFilters,
  hasFilters,
  onClear,
  quickFilters,
  viewToggle,
}: SearchFilterProps) {
  const [staffOpen, setStaffOpen] = useState(false);

  // Derive counts for people (how many records each person is associated with)
  const peopleWithCounts = [
    ...allPeople.sales.map((name) => ({
      name,
      role: "Salesperson" as const,
      count: typeCounts[typeFilter] || 0, // Simplified count
    })),
    ...allPeople.vendors.map((name) => ({
      name,
      role: "Vendor" as const,
      count: 0, // Will be calculated if needed
    })),
  ];

  // Filter people based on search
  const filteredPeople = staffSearch.trim()
    ? peopleWithCounts.filter((p) =>
        p.name.toLowerCase().includes(staffSearch.trim().toLowerCase()),
      )
    : peopleWithCounts;

  return (
    <div className="space-y-2.5">
      {/* Row 1: Search + optional view toggle on the right */}
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search customer, order #, vendor, category…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-9 w-full pl-8 text-sm"
          />
        </div>
        {viewToggle && <div className="flex-shrink-0">{viewToggle}</div>}
      </div>

      {/* Row 2: Type toggle + Staff selector on left, quick-filter pills on right */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Type toggle */}
        <div className="flex items-center rounded-lg border border-border bg-card p-0.5">
          {(
            [
              { key: "all", label: "All" },
              { key: "order", label: "Orders" },
              { key: "enquiry", label: "Enquiries" },
            ] as { key: TypeFilter; label: string }[]
          ).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => onTypeChange(key)}
              className={cn(
                "relative flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                typeFilter === key
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
              <span
                className={cn(
                  "rounded-full px-1.5 py-px text-[10px]",
                  typeFilter === key
                    ? "bg-background/20 text-background"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {typeCounts[key] || 0}
              </span>
            </button>
          ))}
        </div>

        {/* Staff/Vendor combobox — flex-1 on mobile so it fills remaining space */}
        <Popover open={staffOpen} onOpenChange={setStaffOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={staffOpen}
              className="h-9 flex-1 justify-between px-3 text-xs sm:flex-none sm:w-[180px]"
            >
              <div className="flex items-center gap-2 min-w-0">
                <User className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                <span
                  className={cn(
                    "truncate",
                    staffSearch ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {staffSearch || "All people"}
                </span>
              </div>
              <ChevronDown className="ml-2 h-3 w-3 flex-shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[240px] p-0" align="start">
            <Command>
              <CommandInput
                placeholder="Search staff or vendor…"
                value={staffSearch}
                onValueChange={onStaffChange}
              />
              <CommandList>
                <CommandEmpty>No person found.</CommandEmpty>
                <CommandGroup heading="Sales staff">
                  {allPeople.sales.map((name) => (
                    <CommandItem
                      key={name}
                      value={name}
                      onSelect={(currentValue) => {
                        onStaffChange(
                          currentValue === staffSearch ? "" : currentValue,
                        );
                        setStaffOpen(false);
                      }}
                    >
                      <div className="flex flex-1 items-center justify-between">
                        <span>{name}</span>
                        {staffSearch === name && (
                          <span className="text-[10px] text-muted-foreground">
                            Selected
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandGroup heading="Vendors">
                  {allPeople.vendors.map((name) => (
                    <CommandItem
                      key={name}
                      value={name}
                      onSelect={(currentValue) => {
                        onStaffChange(
                          currentValue === staffSearch ? "" : currentValue,
                        );
                        setStaffOpen(false);
                      }}
                    >
                      <div className="flex flex-1 items-center justify-between">
                        <span>{name}</span>
                        {staffSearch === name && (
                          <span className="text-[10px] text-muted-foreground">
                            Selected
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Quick filters slot — urgency / risk pills, pushed to the right */}
        {quickFilters && (
          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            {quickFilters}
          </div>
        )}
      </div>

      {/* Row 3: Active filter chips + Clear all */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-muted-foreground">
            Active filters:
          </span>
          {activeFilters.map((filter) => (
            <button
              key={filter.key}
              onClick={filter.onRemove}
              className="group inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs text-foreground transition-colors hover:border-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              {filter.label}
              <X className="h-3 w-3 opacity-50 group-hover:opacity-100" />
            </button>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="ml-auto h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}
