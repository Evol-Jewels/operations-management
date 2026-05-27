"use client";

import type { LucideIcon } from "lucide-react";
import { RefreshCw, UserCheck, UserCog, UserX, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InvitesTable } from "@/components/user-management/InvitesTable";
import { SendInviteDialog } from "@/components/user-management/SendInviteDialog";
import { UsersTable } from "@/components/user-management/UsersTable";
import {
  createInternalInvite,
  fetchInternalInvites,
  fetchInternalUsers,
} from "@/lib/internalUserManagementApi";
import type {
  CreateInternalInviteInput,
  InternalInviteRow,
  InternalInviteStatus,
  InternalProfileRole,
  InternalUserStatus,
  InternalUserWithProfile,
} from "@/types/user-management";
import {
  INTERNAL_INVITE_STATUSES,
  INTERNAL_PROFILE_ROLES,
  INTERNAL_USER_STATUSES,
} from "@/types/user-management";

type FilterValue<T extends string> = "ALL" | T;

function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
      <span>{message}</span>
      <Button type="button" variant="outline" size="sm" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-md border border-border/70 bg-background px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase text-muted-foreground">
          {label}
        </p>
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

export function UserManagementPageClient() {
  const [users, setUsers] = useState<InternalUserWithProfile[]>([]);
  const [invites, setInvites] = useState<InternalInviteRow[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [invitesLoading, setInvitesLoading] = useState(true);
  const [usersError, setUsersError] = useState("");
  const [invitesError, setInvitesError] = useState("");
  const [inviteSubmitting, setInviteSubmitting] = useState(false);

  const [userStatus, setUserStatus] =
    useState<FilterValue<InternalUserStatus>>("ALL");
  const [userRole, setUserRole] =
    useState<FilterValue<InternalProfileRole>>("ALL");

  const [inviteStatus, setInviteStatus] =
    useState<FilterValue<InternalInviteStatus>>("ALL");
  const [inviteUserId, setInviteUserId] = useState("");
  const [inviteUserLabel, setInviteUserLabel] = useState("");

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    setUsersError("");

    try {
      const data = await fetchInternalUsers({
        status: userStatus === "ALL" ? undefined : userStatus,
        role: userRole === "ALL" ? undefined : userRole,
      });
      setUsers(data);
    } catch (error) {
      setUsersError(
        error instanceof Error ? error.message : "Unable to load users.",
      );
    } finally {
      setUsersLoading(false);
    }
  }, [userRole, userStatus]);

  const loadInvites = useCallback(async () => {
    setInvitesLoading(true);
    setInvitesError("");

    try {
      const data = await fetchInternalInvites({
        status: inviteStatus === "ALL" ? undefined : inviteStatus,
        userId: inviteUserId || undefined,
      });
      setInvites(data);
    } catch (error) {
      setInvitesError(
        error instanceof Error ? error.message : "Unable to load invites.",
      );
    } finally {
      setInvitesLoading(false);
    }
  }, [inviteStatus, inviteUserId]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    loadInvites();
  }, [loadInvites]);

  async function handleInviteSubmit(input: CreateInternalInviteInput) {
    setInviteSubmitting(true);

    try {
      await createInternalInvite(input);
      await Promise.all([loadUsers(), loadInvites()]);
    } finally {
      setInviteSubmitting(false);
    }
  }

  const activeUsers = users.filter((user) => user.status === "ACTIVE").length;
  const blockedUsers = users.filter((user) => user.status === "BLOCKED").length;
  const pendingInvites = invites.filter(
    (invite) => invite.status === "PENDING",
  ).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            Access Control
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
            User management
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Review internal users, track invites, and send access invitations.
          </p>
        </div>

        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => {
              loadUsers();
              loadInvites();
            }}
            disabled={usersLoading || invitesLoading}
          >
            <RefreshCw className="size-4" />
            Refresh
          </Button>
          <SendInviteDialog
            isSubmitting={inviteSubmitting}
            onSubmit={handleInviteSubmit}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Total Users" value={users.length} icon={UserCog} />
        <Metric label="Active" value={activeUsers} icon={UserCheck} />
        <Metric label="Blocked" value={blockedUsers} icon={UserX} />
        <Metric
          label="Pending Invites"
          value={pendingInvites}
          icon={RefreshCw}
        />
      </div>

      <Card className="rounded-lg">
        <CardHeader className="gap-4 px-4 sm:px-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <CardTitle>Internal users</CardTitle>
              <CardDescription>
                Filter by account status or operational role.
              </CardDescription>
            </div>
            <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 md:w-auto">
              <Select
                value={userStatus}
                onValueChange={(value) =>
                  setUserStatus(value as FilterValue<InternalUserStatus>)
                }
              >
                <SelectTrigger className="w-full md:w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All statuses</SelectItem>
                  {INTERNAL_USER_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={userRole}
                onValueChange={(value) =>
                  setUserRole(value as FilterValue<InternalProfileRole>)
                }
              >
                <SelectTrigger className="w-full md:w-36">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All roles</SelectItem>
                  {INTERNAL_PROFILE_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 px-4 sm:px-6">
          {usersError ? (
            <ErrorBanner message={usersError} onRetry={loadUsers} />
          ) : (
            <UsersTable
              users={users}
              isLoading={usersLoading}
              onFilterInvitesByUser={(user) => {
                setInviteUserId(user.id);
                setInviteUserLabel(user.name || user.email);
              }}
            />
          )}
        </CardContent>
      </Card>

      <Card className="rounded-lg">
        <CardHeader className="gap-4 px-4 sm:px-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <CardTitle>Invites</CardTitle>
              <CardDescription>
                Track pending, accepted, expired, and cancelled invitations.
              </CardDescription>
            </div>
            <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto">
              {inviteUserId && (
                <Badge
                  variant="outline"
                  className="h-9 max-w-full gap-2 rounded-md border-border px-3"
                >
                  <span className="min-w-0 truncate">{inviteUserLabel}</span>
                  <button
                    type="button"
                    className="cursor-pointer rounded-sm text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setInviteUserId("");
                      setInviteUserLabel("");
                    }}
                    aria-label="Clear selected user invite filter"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              )}

              <Select
                value={inviteStatus}
                onValueChange={(value) =>
                  setInviteStatus(value as FilterValue<InternalInviteStatus>)
                }
              >
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Invite status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All invites</SelectItem>
                  {INTERNAL_INVITE_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 px-4 sm:px-6">
          {invitesError ? (
            <ErrorBanner message={invitesError} onRetry={loadInvites} />
          ) : (
            <InvitesTable invites={invites} isLoading={invitesLoading} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
