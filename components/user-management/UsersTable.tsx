"use client";

import { Mail, Phone } from "lucide-react";
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
      <div className="rounded-md border border-border/70 p-6 text-sm text-muted-foreground">
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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Team</TableHead>
          <TableHead>Verification</TableHead>
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
            <TableCell>
              <div className="flex min-w-64 items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold text-foreground">
                  {initials(user.name, user.email)}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">
                    {user.name || "Unnamed user"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <Badge
                variant="outline"
                className={cn("border", statusStyles[user.status])}
              >
                {user.status}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="space-y-1">
                <p className="text-sm text-foreground">
                  {user.profile?.role ?? "No role"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {user.profile?.department ?? "No department"}
                </p>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="outline"
                  className={
                    user.emailVerifiedAt
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : "border-border text-muted-foreground"
                  }
                >
                  <Mail className="size-3" />
                  Email
                </Badge>
                <Badge
                  variant="outline"
                  className={
                    user.phoneVerifiedAt
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : "border-border text-muted-foreground"
                  }
                >
                  <Phone className="size-3" />
                  Phone
                </Badge>
              </div>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatDate(user.createdAt)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
