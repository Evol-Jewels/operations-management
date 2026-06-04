"use client";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { InternalUserWithProfile } from "@/types/user-management";

interface UsersTableProps {
  users: InternalUserWithProfile[];
  isLoading: boolean;
  onFilterInvitesByUser: (user: InternalUserWithProfile) => void;
}

const statusStyles = {
  ACTIVE: "border-emerald-200 bg-emerald-50 text-emerald-700",
  INACTIVE: "border-slate-200 bg-slate-50 text-slate-700",
  BLOCKED: "border-red-200 bg-red-50 text-red-700",
};

function formatDate(value: string | null) {
  if (!value) return "Not set";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function initials(name: string, email: string) {
  const source = name.trim() || email.trim();
  return source.slice(0, 2).toUpperCase();
}

export function UsersTable({
  users,
  isLoading,
  onFilterInvitesByUser,
}: UsersTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-md border border-border/70 px-4 py-5 text-sm text-muted-foreground">
        Loading users...
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        No internal users match these filters.
      </div>
    );
  }

  return (
    <div className="min-h-0 h-[30vh] overflow-y-auto rounded-md border border-border/70">
      <div className="space-y-3 p-3 sm:hidden">
        {users.map((user) => (
          <button
            key={user.id}
            type="button"
            onClick={() => onFilterInvitesByUser(user)}
            className="w-full rounded-md border border-border/70 bg-background p-4 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold text-foreground">
                {initials(user.name, user.email)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">
                      {user.username || user.name || "Unnamed user"}
                    </p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn("shrink-0 border", statusStyles[user.status])}
                  >
                    {user.status}
                  </Badge>
                </div>
                <div className="mt-4 grid gap-2 text-xs text-muted-foreground">
                  <div className="flex justify-between gap-3">
                    <span>Role</span>
                    <span className="font-medium text-foreground">
                      {user.profile?.role ?? "No role"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span>Created</span>
                    <span className="font-medium text-foreground">
                      {formatDate(user.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow
                key={user.id}
                className="cursor-pointer"
                onClick={() => onFilterInvitesByUser(user)}
              >
                <TableCell className="py-3">
                  <div className="flex min-w-64 items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold text-foreground">
                      {initials(user.name, user.email)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">
                        {user.username || user.name || "Unnamed user"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-3">
                  <Badge
                    variant="outline"
                    className={cn("border", statusStyles[user.status])}
                  >
                    {user.status}
                  </Badge>
                </TableCell>
                <TableCell className="py-3">
                  <p className="text-sm text-foreground">
                    {user.profile?.role ?? "No role"}
                  </p>
                </TableCell>
                <TableCell className="py-3 text-muted-foreground">
                  {formatDate(user.createdAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
