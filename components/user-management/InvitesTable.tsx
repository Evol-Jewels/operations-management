"use client";

import { Key, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatDate,
  formatDateTime,
  formatLabel,
} from "@/components/user-management/format";
import { TableSkeleton } from "@/components/user-management/TableSkeleton";
import { cn } from "@/lib/utils";
import type { InternalInviteRow } from "@/types/user-management";

interface InvitesTableProps {
  invites: InternalInviteRow[];
  isLoading: boolean;
  onUpdateInvite: (invite: InternalInviteRow) => void;
  onResetPassword: (invite: InternalInviteRow) => void;
  actionLoading?: string;
}

const statusStyles = {
  PENDING:
    "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400",
  ACCEPTED:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400",
  EXPIRED: "border-muted-foreground/20 bg-muted text-muted-foreground",
  CANCELLED:
    "border-red-500/20 bg-red-500/10 text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400",
};

function inviteActivity(invite: InternalInviteRow) {
  const date =
    invite.status === "ACCEPTED"
      ? invite.acceptedAt
      : invite.status === "CANCELLED"
        ? invite.updatedAt
        : invite.expirationAt;
  const label =
    invite.status === "PENDING" ? "Expires" : formatLabel(invite.status);
  return { date, label };
}

function InviteActivityLabel({ invite }: { invite: InternalInviteRow }) {
  const { date, label } = inviteActivity(invite);
  return (
    <span title={formatDateTime(date)}>
      {label} {formatDate(date)}
    </span>
  );
}

function InviteActivity({ invite }: { invite: InternalInviteRow }) {
  const { date, label } = inviteActivity(invite);

  return (
    <div title={formatDateTime(date)}>
      <p>{formatDate(date)}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function InviteActions({
  invite,
  onUpdateInvite,
  onResetPassword,
  isLoading,
}: {
  invite: InternalInviteRow;
  onUpdateInvite: () => void;
  onResetPassword: () => void;
  isLoading: boolean;
}) {
  const canUpdate = invite.status !== "ACCEPTED";
  const canResetPassword =
    invite.status === "ACCEPTED" && Boolean(invite.username);

  if (!canUpdate && !canResetPassword) {
    return null;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Actions for invite to ${invite.email}`}
          className="size-10 shrink-0 cursor-pointer md:mx-auto md:size-8"
          onClick={(e) => e.stopPropagation()}
          disabled={isLoading}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-40 p-1">
        <div className="flex flex-col">
          {canUpdate && (
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-sm px-3 py-2.5 text-sm hover:bg-accent md:py-2 disabled:opacity-50"
              onClick={(e) => {
                e.stopPropagation();
                onUpdateInvite();
              }}
              disabled={isLoading}
            >
              Update Invite
            </button>
          )}
          {canResetPassword && (
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-sm px-3 py-2.5 text-sm hover:bg-accent md:py-2 disabled:opacity-50"
              onClick={(e) => {
                e.stopPropagation();
                onResetPassword();
              }}
              disabled={isLoading}
            >
              <Key className="size-4" />
              Reset Password
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function InvitesTable({
  invites,
  isLoading,
  onUpdateInvite,
  onResetPassword,
  actionLoading,
}: InvitesTableProps) {
  if (isLoading) {
    return <TableSkeleton columns={6} />;
  }

  if (invites.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        No invites match these filters.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border border-border/70 [&_[data-slot=table-container]]:pr-0">
      <ul className="divide-y divide-border/70 md:hidden">
        {invites.map((invite) => (
          <li
            key={invite.id}
            className="flex items-center gap-1 py-3 pr-1.5 pl-3"
          >
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-2">
                <p className="truncate font-medium text-foreground">
                  {invite.email}
                </p>
                <Badge
                  variant="outline"
                  className={cn(
                    "shrink-0 border px-1.5 py-0 text-[11px]",
                    statusStyles[invite.status],
                  )}
                >
                  {formatLabel(invite.status)}
                </Badge>
              </div>
              {invite.username && (
                <p className="truncate text-xs text-muted-foreground">
                  {invite.username}
                </p>
              )}
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                <span className="font-medium text-foreground">
                  {formatLabel(invite.role)}
                </span>{" "}
                · <InviteActivityLabel invite={invite} />
              </p>
            </div>
            <InviteActions
              invite={invite}
              onUpdateInvite={() => onUpdateInvite(invite)}
              onResetPassword={() => onResetPassword(invite)}
              isLoading={actionLoading === invite.id}
            />
          </li>
        ))}
      </ul>

      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Activity</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-28 text-right">Actions</TableHead>
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
                    {invite.username && (
                      <p className="truncate text-xs text-muted-foreground">
                        {invite.username}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="py-3">
                  {formatLabel(invite.role)}
                </TableCell>
                <TableCell className="py-3">
                  <Badge
                    variant="outline"
                    className={cn("border", statusStyles[invite.status])}
                  >
                    {formatLabel(invite.status)}
                  </Badge>
                </TableCell>
                <TableCell className="py-3 text-muted-foreground">
                  <InviteActivity invite={invite} />
                </TableCell>
                <TableCell
                  className="py-3 text-muted-foreground"
                  title={formatDateTime(invite.createdAt)}
                >
                  {formatDate(invite.createdAt)}
                </TableCell>
                <TableCell
                  className="py-3 text-right"
                  onClick={(e) => e.stopPropagation()}
                >
                  <InviteActions
                    invite={invite}
                    onUpdateInvite={() => onUpdateInvite(invite)}
                    onResetPassword={() => onResetPassword(invite)}
                    isLoading={actionLoading === invite.id}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
