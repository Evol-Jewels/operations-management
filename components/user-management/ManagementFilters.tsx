import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { formatLabel } from "@/components/user-management/format";
import { INTERNAL_PROFILE_ROLES } from "@/types/user-management";

export type CreationDateOrder = "newest" | "oldest";

interface ManagementFiltersProps {
  kind: "users" | "invites";
  search: string;
  onSearchChange: (value: string) => void;
  status: string;
  statuses: readonly string[];
  onStatusChange: (value: string) => void;
  role?: string;
  onRoleChange?: (value: string) => void;
  sort: CreationDateOrder;
  onSortChange: (value: CreationDateOrder) => void;
  onReset: () => void;
}

export function ManagementFilters({
  kind,
  search,
  onSearchChange,
  status,
  statuses,
  onStatusChange,
  role,
  onRoleChange,
  sort,
  onSortChange,
  onReset,
}: ManagementFiltersProps) {
  const activeCount =
    (status !== "ALL" ? 1 : 0) + (role && role !== "ALL" ? 1 : 0);
  const hasFilters = search !== "" || activeCount > 0;

  function renderSelects(triggerClassName: string) {
    return (
      <>
        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger
            className={triggerClassName}
            aria-label={`Filter ${kind} by status`}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {statuses.map((item) => (
              <SelectItem key={item} value={item}>
                {formatLabel(item)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {role !== undefined && onRoleChange && (
          <Select value={role} onValueChange={onRoleChange}>
            <SelectTrigger
              className={triggerClassName}
              aria-label="Filter users by role"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All roles</SelectItem>
              {INTERNAL_PROFILE_ROLES.map((item) => (
                <SelectItem key={item} value={item}>
                  {formatLabel(item)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select
          value={sort}
          onValueChange={(value) => {
            if (value === "newest" || value === "oldest") onSortChange(value);
          }}
        >
          <SelectTrigger
            className={triggerClassName}
            aria-label={`Sort ${kind} by creation date`}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
          </SelectContent>
        </Select>
      </>
    );
  }

  return (
    <div className="flex min-w-0 gap-2 sm:flex-row sm:flex-wrap sm:items-center xl:flex-nowrap">
      <div className="relative min-w-0 flex-1 sm:w-56 sm:flex-none xl:w-48">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-label={
            kind === "users"
              ? "Search users by name, email or username"
              : "Search invites by email or username"
          }
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={`Search ${kind}`}
          className="h-10 pl-9 pr-10 sm:h-9"
        />
        {search && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="absolute right-0.5 top-1/2 -translate-y-1/2"
            onClick={() => onSearchChange("")}
            aria-label={`Clear ${kind} search`}
          >
            <X className="size-3.5" />
          </Button>
        )}
      </div>
      <Sheet>
        <SheetTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="h-10 shrink-0 gap-1.5 px-3 sm:hidden"
            aria-label={
              activeCount ? `Filters, ${activeCount} active` : "Filters"
            }
          >
            <SlidersHorizontal className="size-4" />
            Filters
            {activeCount > 0 && (
              <span className="flex size-5 items-center justify-center rounded-full bg-foreground text-[11px] font-semibold tabular-nums text-background">
                {activeCount}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="gap-0 px-4 pt-5">
          <SheetHeader className="mb-4 text-left">
            <SheetTitle className="text-base">
              Filter {kind === "users" ? "users" : "invites"}
            </SheetTitle>
            <SheetDescription className="sr-only">
              Narrow down the {kind} shown
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-3">{renderSelects("h-11 w-full")}</div>
          <SheetFooter className="mt-6 flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-11 flex-1"
              disabled={!hasFilters}
              onClick={onReset}
            >
              Clear all
            </Button>
            <SheetClose asChild>
              <Button type="button" className="h-11 flex-1">
                Done
              </Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      <div className="hidden flex-wrap items-center gap-2 sm:flex xl:flex-nowrap">
        {renderSelects("h-9 w-36")}
        {hasFilters && (
          <Button type="button" variant="ghost" size="sm" onClick={onReset}>
            <X className="size-3.5" />
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}
