"use client";

import { Ban, Key, MoreHorizontal, Pencil, ShieldMinus } from "lucide-react";
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
import { formatDate, formatLabel } from "@/components/user-management/format";
import { TableSkeleton } from "@/components/user-management/TableSkeleton";
import { cn } from "@/lib/utils";
import type { InternalUserWithProfile } from "@/types/user-management";

interface UsersTableProps {
  users: InternalUserWithProfile[];
  isLoading: boolean;
  currentUserEmail?: string;
  onOpenUserProfile: (user: InternalUserWithProfile) => void;
  onBlock: (user: InternalUserWithProfile) => void;
  onUnblock: (user: InternalUserWithProfile) => void;
  onResetPassword: (user: InternalUserWithProfile) => void;
  actionLoading?: string;
}

const statusStyles = {
  ACTIVE:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400",
  INACTIVE: "border-muted-foreground/20 bg-muted text-muted-foreground",
  BLOCKED:
    "border-red-500/20 bg-red-500/10 text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400",
};

function initials(name: string, email: string) {
  const source = name.trim() || email.trim();
  return source.slice(0, 2).toUpperCase();
}

function UserActions({
  user,
  currentUserEmail,
  onBlock,
  onUnblock,
  onResetPassword,
  onEdit,
  isLoading,
}: {
  user: InternalUserWithProfile;
  currentUserEmail?: string;
  onBlock: () => void;
  onUnblock: () => void;
  onResetPassword: () => void;
  onEdit: () => void;
  isLoading: boolean;
}) {
  const isOwnUser =
    currentUserEmail?.trim().toLowerCase() === user.email.trim().toLowerCase();
  const isAdmin = user.profile?.role === "ADMIN";

  if (isOwnUser || isAdmin) {
    return (
      <span
        className="whitespace-nowrap text-xs text-muted-foreground"
        title={
          isOwnUser
            ? "Account actions are unavailable for your own account."
            : "Admin accounts are protected from changes."
        }
      >
        {isOwnUser ? "Your account" : "Protected"}
      </span>
    );
  }

  const hasUsername = Boolean(user.username?.trim());
  const canUnblock = user.status === "BLOCKED";
  const canResetPassword = hasUsername && user.status !== "BLOCKED";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Actions for ${user.username || user.name || user.email}`}
          className="mx-auto cursor-pointer"
          onClick={(e) => e.stopPropagation()}
          disabled={isLoading}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-fit p-1">
        <div className="flex flex-col">
          <button
            type="button"
            className="flex w-full cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent disabled:opacity-50"
            onClick={(event) => {
              event.stopPropagation();
              onEdit();
            }}
            disabled={isLoading}
          >
            <Pencil className="size-4" />
            Edit profile
          </button>
          <button
            type="button"
            className="flex w-full cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent disabled:opacity-50"
            onClick={(event) => {
              event.stopPropagation();
              if (canUnblock) onUnblock();
              else onBlock();
            }}
            disabled={isLoading}
          >
            {canUnblock ? (
              <ShieldMinus className="size-4" />
            ) : (
              <Ban className="size-4" />
            )}
            {canUnblock ? "Unblock User" : "Block User"}
          </button>
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

export function UsersTable({
  users,
  isLoading,
  currentUserEmail,
  onOpenUserProfile,
  onBlock,
  onUnblock,
  onResetPassword,
  actionLoading,
}: UsersTableProps) {
  if (isLoading) {
    return <TableSkeleton columns={5} />;
  }

  if (users.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        No internal users match these filters.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border border-border/70 [&_[data-slot=table-container]]:pr-0">
      <div className="space-y-3 p-3 sm:hidden">
        {users.map((user) => {
          const isAdminUser = user.profile?.role === "ADMIN";

          return (
            <div
              key={user.id}
              className="relative rounded-md border border-border/70 bg-background p-4"
            >
              <button
                type="button"
                onClick={() => {
                  if (!isAdminUser) onOpenUserProfile(user);
                }}
                className={cn(
                  "w-full text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                  isAdminUser
                    ? "cursor-default"
                    : "cursor-pointer hover:bg-muted/40",
                )}
                disabled={isAdminUser}
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
                        className={cn(
                          "shrink-0 border",
                          statusStyles[user.status],
                        )}
                      >
                        {formatLabel(user.status)}
                      </Badge>
                    </div>
                    <div className="mt-4 grid gap-2 text-xs text-muted-foreground">
                      <div className="flex justify-between gap-3">
                        <span>Role</span>
                        <span className="font-medium text-foreground">
                          {user.profile?.role
                            ? formatLabel(user.profile.role)
                            : "Not set"}
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
              <div className="mt-3 flex justify-end border-t border-border/70 pt-2">
                <UserActions
                  user={user}
                  currentUserEmail={currentUserEmail}
                  onBlock={() => onBlock(user)}
                  onUnblock={() => onUnblock(user)}
                  onResetPassword={() => onResetPassword(user)}
                  onEdit={() => onOpenUserProfile(user)}
                  isLoading={actionLoading === user.id}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-28 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const isAdminUser = user.profile?.role === "ADMIN";

              return (
                <TableRow
                  key={user.id}
                  className={isAdminUser ? undefined : "cursor-pointer"}
                  onClick={() => {
                    if (!isAdminUser) onOpenUserProfile(user);
                  }}
                >
                  <TableCell className="py-3">
                    <button
                      type="button"
                      disabled={isAdminUser}
                      onClick={(event) => {
                        event.stopPropagation();
                        onOpenUserProfile(user);
                      }}
                      aria-label={`Edit profile for ${user.username || user.name || user.email}`}
                      className="flex min-w-64 items-center gap-3 rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default"
                    >
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
                    </button>
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge
                      variant="outline"
                      className={cn("border", statusStyles[user.status])}
                    >
                      {formatLabel(user.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3">
                    <p className="text-sm text-foreground">
                      {user.profile?.role
                        ? formatLabel(user.profile.role)
                        : "Not set"}
                    </p>
                  </TableCell>
                  <TableCell className="py-3 text-muted-foreground">
                    {formatDate(user.createdAt)}
                  </TableCell>
                  <TableCell
                    className="py-3 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <UserActions
                      user={user}
                      currentUserEmail={currentUserEmail}
                      onBlock={() => onBlock(user)}
                      onUnblock={() => onUnblock(user)}
                      onResetPassword={() => onResetPassword(user)}
                      onEdit={() => onOpenUserProfile(user)}
                      isLoading={actionLoading === user.id}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
