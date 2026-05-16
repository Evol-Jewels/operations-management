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
  if (!value) return "Not accepted";

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
      <div className="rounded-md border border-border/70 p-6 text-sm text-muted-foreground">
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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Expiration</TableHead>
          <TableHead>Accepted</TableHead>
          <TableHead>Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invites.map((invite) => (
          <TableRow key={invite.id}>
            <TableCell>
              <div className="min-w-56">
                <p className="truncate font-medium text-foreground">
                  {invite.email}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  User: {invite.userId}
                </p>
              </div>
            </TableCell>
            <TableCell>{invite.role}</TableCell>
            <TableCell>
              <Badge
                variant="outline"
                className={cn("border", statusStyles[invite.status])}
              >
                {invite.status}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatDate(invite.expirationAt)}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatDate(invite.acceptedAt)}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatDate(invite.createdAt)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
