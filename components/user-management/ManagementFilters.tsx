import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const hasFilters =
    search !== "" || status !== "ALL" || (role && role !== "ALL");

  return (
    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center xl:flex-nowrap">
      <div className="relative min-w-0 sm:w-56 xl:w-48">
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
          className="h-9 pl-9 pr-10"
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
      <div className="flex flex-wrap items-center gap-2 xl:flex-nowrap">
        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger
            className="h-9 w-32"
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
              className="h-9 w-32"
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
            className="h-9 w-36"
            aria-label={`Sort ${kind} by creation date`}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
          </SelectContent>
        </Select>
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
