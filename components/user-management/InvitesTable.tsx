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
import type { InternalInviteRow } from "@/types/user-management";

interface InvitesTableProps {
  invites: InternalInviteRow[];
  isLoading: boolean;
}

const statusStyles = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  ACCEPTED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  EXPIRED: "border-slate-200 bg-slate-50 text-slate-700",
  CANCELLED: "border-red-200 bg-red-50 text-red-700",
};

function formatDate(value: string | null) {
  if (!value) return "N/A";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function InvitesTable({ invites, isLoading }: InvitesTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-md border border-border/70 px-4 py-5 text-sm text-muted-foreground">
        Loading invites...
      </div>
    );
  }

  if (invites.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        No invites match these filters.
      </div>
    );
  }

  return (
    <div className="min-h-0 h-[30vh] overflow-y-auto rounded-md border border-border/70">
      <div className="space-y-3 p-3 sm:hidden">
        {invites.map((invite) => (
          <div
            key={invite.id}
            className="rounded-md border border-border/70 bg-background p-4"
          >
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">
                  {invite.email}
                </p>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {invite.username
                    ? `Username: ${invite.username}`
                    : `User: ${invite.userId}`}
                </p>
              </div>
              <Badge
                variant="outline"
                className={cn("shrink-0 border", statusStyles[invite.status])}
              >
                {invite.status}
              </Badge>
            </div>
            <div className="mt-4 grid gap-2 text-xs text-muted-foreground">
              <div className="flex justify-between gap-3">
                <span>Role</span>
                <span className="font-medium text-foreground">
                  {invite.role}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span>Expiration</span>
                <span className="text-right font-medium text-foreground">
                  {formatDate(invite.expirationAt)}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span>Created</span>
                <span className="text-right font-medium text-foreground">
                  {formatDate(invite.createdAt)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Expiration</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invites.map((invite) => (
              <TableRow key={invite.id}>
                <TableCell className="py-3">
                  <div className="min-w-56">
                    <p className="truncate font-medium text-foreground">
                      {invite.email}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {invite.username
                        ? `Username: ${invite.username}`
                        : `User: ${invite.userId}`}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="py-3">{invite.role}</TableCell>
                <TableCell className="py-3">
                  <Badge
                    variant="outline"
                    className={cn("border", statusStyles[invite.status])}
                  >
                    {invite.status}
                  </Badge>
                </TableCell>
                <TableCell className="py-3 text-muted-foreground">
                  {formatDate(invite.expirationAt)}
                </TableCell>
                <TableCell className="py-3 text-muted-foreground">
                  {formatDate(invite.createdAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
