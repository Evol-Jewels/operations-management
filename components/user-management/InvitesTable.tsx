"use client";

import { Key, MoreHorizontal, X } from "lucide-react";
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
          size="icon-xs"
          className="mx-auto cursor-pointer"
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
              className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent disabled:opacity-50"
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
              className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent disabled:opacity-50"
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
    <div className="min-h-0 h-[30vh] overflow-y-auto rounded-md border border-border/70">
      <div className="space-y-3 p-3 sm:hidden">
        {invites.map((invite) => (
          <div
            key={invite.id}
            className="relative rounded-md border border-border/70 bg-background p-4"
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
            <div className="absolute right-4 top-4">
              <InviteActions
                invite={invite}
                onUpdateInvite={() => onUpdateInvite(invite)}
                onResetPassword={() => onResetPassword(invite)}
                isLoading={actionLoading === invite.id}
              />
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
              <TableHead className="w-12">Actions</TableHead>
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
                <TableCell
                  className="py-3"
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
