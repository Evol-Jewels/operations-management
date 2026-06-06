"use client";

import { Check, Copy, Eye, EyeOff, RefreshCw, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  blockInternalUser,
  createInternalInvite,
  expireInternalInvite,
  fetchInternalInvites,
  fetchInternalUsers,
  resetInternalUserPassword,
  unblockInternalUser,
} from "@/lib/internalUserManagementApi";
import type {
  CreateInternalInviteInput,
  CreateInternalInviteResponse,
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
    <div className="flex flex-col gap-3 rounded-md border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between">
      <span>{message}</span>
      <Button type="button" variant="outline" size="sm" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="px-4 py-4 sm:px-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold leading-none text-foreground">
        {value}
      </p>
    </div>
  );
}

type ConfirmDialogType = "block" | "unblock" | "expire" | null;

interface ConfirmDialogData {
  type: ConfirmDialogType;
  user?: InternalUserWithProfile;
  invite?: InternalInviteRow;
}

interface ResetPasswordDialogData {
  user?: InternalUserWithProfile;
  invite?: InternalInviteRow;
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

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogData>({
    type: null,
  });

  const [resetPasswordDialog, setResetPasswordDialog] =
    useState<ResetPasswordDialogData | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resetPasswordSubmitting, setResetPasswordSubmitting] = useState(false);

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

  const [credentials, setCredentials] =
    useState<CreateInternalInviteResponse | null>(null);
  const [credentialsOpen, setCredentialsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleInviteSubmit(input: CreateInternalInviteInput) {
    setInviteSubmitting(true);

    try {
      const response = await createInternalInvite(input);
      const hasCredentials = Boolean(response.username && response.password);

      if (!hasCredentials) {
        setCredentials(null);
        setCredentialsOpen(false);
        setCopied(false);
        toast.success("Invite created");
      } else {
        setCredentials(response);
        setCredentialsOpen(true);

        const text = [
          `username: ${response.username}`,
          `password: ${response.password}`,
        ].join("\n");
        await navigator.clipboard.writeText(text);
        setCopied(true);

        toast.success("Invite created and credentials shared");
      }

      await Promise.all([loadUsers(), loadInvites()]);
    } finally {
      setInviteSubmitting(false);
    }
  }

  async function handleCopy() {
    if (!credentials) return;
    const text = [
      credentials.username && `username: ${credentials.username}`,
      `password: ${credentials.password}`,
    ]
      .filter(Boolean)
      .join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleBlock(user: InternalUserWithProfile) {
    setConfirmDialog({ type: "block", user });
  }

  async function handleUnblock(user: InternalUserWithProfile) {
    setConfirmDialog({ type: "unblock", user });
  }

  async function handleExpireInvite(invite: InternalInviteRow) {
    setConfirmDialog({ type: "expire", invite });
  }

  async function handleResetPassword(
    user: InternalUserWithProfile | InternalInviteRow,
    isInvite?: boolean,
  ) {
    setResetPasswordDialog(
      isInvite
        ? { invite: invite as InternalInviteRow }
        : { user: user as InternalUserWithProfile },
    );
    setNewPassword("");
    setShowPassword(false);
  }

  async function executeBlock() {
    const user = confirmDialog.user;
    if (!user) return;

    setActionLoading(user.id);
    try {
      await blockInternalUser(user.id);
      toast.success(`${user.username || user.name} has been blocked`);
      setConfirmDialog({ type: null });
      await loadUsers();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to block user",
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function executeUnblock() {
    const user = confirmDialog.user;
    if (!user) return;

    setActionLoading(user.id);
    try {
      await unblockInternalUser(user.id);
      toast.success(`${user.username || user.name} has been unblocked`);
      setConfirmDialog({ type: null });
      await loadUsers();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to unblock user",
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function executeExpireInvite() {
    const invite = confirmDialog.invite;
    if (!invite) return;

    setActionLoading(invite.id);
    try {
      await expireInternalInvite(invite.id);
      toast.success("Invite has been cancelled");
      setConfirmDialog({ type: null });
      await loadInvites();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to cancel invite",
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function executeResetPassword() {
    const dialog = resetPasswordDialog;
    if (!dialog) return;

    const username = dialog.user?.username || dialog.invite?.username;
    if (!username) {
      toast.error("Username not available for this user");
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setResetPasswordSubmitting(true);
    try {
      await resetInternalUserPassword(username, newPassword);
      toast.success("Password has been reset");
      setResetPasswordDialog(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to reset password",
      );
    } finally {
      setResetPasswordSubmitting(false);
    }
  }

  const activeUsers = users.filter((user) => user.status === "ACTIVE").length;
  const blockedUsers = users.filter((user) => user.status === "BLOCKED").length;
  const pendingInvites = invites.filter(
    (invite) => invite.status === "PENDING",
  ).length;

  return (
    <div className="flex min-h-[calc(100dvh-5.25rem)] flex-1 flex-col gap-5">
      <div className="flex flex-col">
        <div className="flex gap-2 justify-between">
          <h1 className="min-w-0 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Users
          </h1>
          <div className="flex gap-2">
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
        <p className="max-w-xl text-sm leading-6 text-muted-foreground">
          Filter, review, and move production records without crowding the
          dashboard.
        </p>
      </div>

      <div className="grid overflow-hidden rounded-lg border border-border bg-background sm:grid-cols-2 lg:grid-cols-4">
        <div className="border-b border-border sm:border-r lg:border-b-0">
          <Metric label="Total users" value={users.length} />
        </div>
        <div className="border-b border-border lg:border-r lg:border-b-0">
          <Metric label="Active" value={activeUsers} />
        </div>
        <div className="border-b border-border sm:border-r sm:border-b-0">
          <Metric label="Blocked" value={blockedUsers} />
        </div>
        <Metric label="Pending invites" value={pendingInvites} />
      </div>

      <section className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h2 className="text-base font-semibold text-foreground">
            Internal users
          </h2>
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
        <div className="min-h-0 flex-1 overflow-hidden">
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
              onBlock={handleBlock}
              onUnblock={handleUnblock}
              onResetPassword={(user) => handleResetPassword(user)}
              actionLoading={actionLoading}
            />
          )}
        </div>
      </section>

      <section className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h2 className="text-base font-semibold text-foreground">Invites</h2>
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
        <div className="min-h-0 flex-1 overflow-hidden">
          {invitesError ? (
            <ErrorBanner message={invitesError} onRetry={loadInvites} />
          ) : (
            <InvitesTable
              invites={invites}
              isLoading={invitesLoading}
              onExpireInvite={handleExpireInvite}
              onResetPassword={(invite) => handleResetPassword(invite, true)}
              actionLoading={actionLoading}
            />
          )}
        </div>
      </section>

      <Dialog open={credentialsOpen} onOpenChange={setCredentialsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite sent</DialogTitle>
            <DialogDescription>
              Credentials for {credentials?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-foreground">
                {credentials?.email}
              </div>
            </div>

            {credentials?.username && (
              <div className="space-y-2">
                <Label>Username</Label>
                <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-foreground">
                  {credentials.username}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                readOnly
                value={credentials?.password ?? ""}
                className="font-mono text-sm"
              />
            </div>

            <div className="rounded-md border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
              Credentials were copied. This password cannot be viewed again.
            </div>
          </div>

          <DialogFooter>
            <Button type="button" onClick={handleCopy}>
              {copied ? (
                <Check className="size-4" />
              ) : (
                <Copy className="size-4" />
              )}
              {copied ? "Copied" : "Copy credentials"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={confirmDialog.type === "block"}
        onOpenChange={(open) => !open && setConfirmDialog({ type: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Block {confirmDialog.user?.username || confirmDialog.user?.name}?
            </DialogTitle>
            <DialogDescription>
              This user will lose access to their account until unblocked.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmDialog({ type: null })}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={executeBlock}
              disabled={actionLoading !== null}
            >
              Block
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={confirmDialog.type === "unblock"}
        onOpenChange={(open) => !open && setConfirmDialog({ type: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Unblock {confirmDialog.user?.username || confirmDialog.user?.name}
              ?
            </DialogTitle>
            <DialogDescription>
              This user will regain access to their account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmDialog({ type: null })}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={executeUnblock}
              disabled={actionLoading !== null}
            >
              Unblock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={confirmDialog.type === "expire"}
        onOpenChange={(open) => !open && setConfirmDialog({ type: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel this invite?</DialogTitle>
            <DialogDescription>
              The invite sent to {confirmDialog.invite?.email} will be cancelled
              and cannot be used.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmDialog({ type: null })}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={executeExpireInvite}
              disabled={actionLoading !== null}
            >
              Cancel Invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={resetPasswordDialog !== null}
        onOpenChange={(open) => !open && setResetPasswordDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Enter a new password for{" "}
              {resetPasswordDialog?.user?.username ||
                resetPasswordDialog?.invite?.username}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 8 characters)"
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setResetPasswordDialog(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={executeResetPassword}
              disabled={resetPasswordSubmitting || newPassword.length < 8}
            >
              Reset Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
