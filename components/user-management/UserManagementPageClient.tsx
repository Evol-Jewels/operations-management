"use client";

import { Check, Copy, Eye, EyeOff, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
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

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InvitesTable } from "@/components/user-management/InvitesTable";
import {
  type CreationDateOrder,
  ManagementFilters,
} from "@/components/user-management/ManagementFilters";
import { SendInviteDialog } from "@/components/user-management/SendInviteDialog";
import {
  PAGE_SIZE,
  TablePagination,
} from "@/components/user-management/TablePagination";
import { UpdateInviteDialog } from "@/components/user-management/UpdateInviteDialog";
import { UserProfileDialog } from "@/components/user-management/UserProfileDialog";
import { UsersTable } from "@/components/user-management/UsersTable";
import { authClient } from "@/lib/auth-client";
import {
  blockInternalUser,
  createInternalInvite,
  fetchInternalInvites,
  fetchInternalUserProfile,
  fetchInternalUsers,
  resetInternalUserPassword,
  unblockInternalUser,
  updateInternalInvite,
  updateInternalUserProfile,
} from "@/lib/internalUserManagementApi";
import type {
  CreateInternalInviteInput,
  CreateInternalInviteResponse,
  InternalInviteRow,
  InternalInviteStatus,
  InternalProfileRole,
  InternalUserStatus,
  InternalUserWithProfile,
  UpdateInternalUserProfileInput,
} from "@/types/user-management";
import {
  INTERNAL_INVITE_STATUSES,
  INTERNAL_USER_STATUSES,
} from "@/types/user-management";

type FilterValue<T extends string> = "ALL" | T;

function compareCreationDate(
  left: { createdAt: string },
  right: { createdAt: string },
  order: CreationDateOrder,
) {
  const difference =
    (Date.parse(left.createdAt) || 0) - (Date.parse(right.createdAt) || 0);
  return order === "oldest" ? difference : -difference;
}

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

function Metric({
  label,
  value,
  onClick,
  selected,
}: {
  label: string;
  value: number | null;
  onClick: () => void;
  selected: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={value === null}
      aria-pressed={selected}
      className={`cursor-pointer px-4 py-3 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring disabled:cursor-default ${selected ? "bg-muted/40" : ""}`}
    >
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold leading-none tabular-nums text-foreground">
        {value ?? "—"}
      </p>
    </button>
  );
}

function matchesSearch(
  record: { name?: string; email: string; username?: string },
  query: string,
) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;

  return [record.name, record.email, record.username].some((value) =>
    value?.toLowerCase().includes(normalizedQuery),
  );
}

interface ConfirmDialogData {
  type: "block" | "unblock" | null;
  user?: InternalUserWithProfile;
}

export function UserManagementPageClient() {
  const { data: session } = authClient.useSession();
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
  const [userSearch, setUserSearch] = useState("");

  const [inviteStatus, setInviteStatus] =
    useState<FilterValue<InternalInviteStatus>>("ALL");
  const [inviteSearch, setInviteSearch] = useState("");
  const [tab, setTab] = useState("users");
  const [userPage, setUserPage] = useState(1);
  const [invitePage, setInvitePage] = useState(1);
  const [userSort, setUserSort] = useState<CreationDateOrder>("newest");
  const [inviteSort, setInviteSort] = useState<CreationDateOrder>("newest");

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogData>({
    type: null,
  });

  const [resetPasswordUsername, setResetPasswordUsername] = useState<
    string | null
  >(null);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resetPasswordSubmitting, setResetPasswordSubmitting] = useState(false);

  const [updateInviteDialog, setUpdateInviteDialog] =
    useState<InternalInviteRow | null>(null);
  const [updateInviteSubmitting, setUpdateInviteSubmitting] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] =
    useState<InternalUserWithProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSubmitting, setProfileSubmitting] = useState(false);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    setUsersError("");

    try {
      const data = await fetchInternalUsers();
      setUsers(data);
    } catch (error) {
      setUsersError(
        error instanceof Error ? error.message : "Unable to load users.",
      );
    } finally {
      setUsersLoading(false);
    }
  }, []);

  const loadInvites = useCallback(async () => {
    setInvitesLoading(true);
    setInvitesError("");

    try {
      const data = await fetchInternalInvites();
      setInvites(data);
    } catch (error) {
      setInvitesError(
        error instanceof Error ? error.message : "Unable to load invites.",
      );
    } finally {
      setInvitesLoading(false);
    }
  }, []);

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
      return response;
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

  async function handleOpenUserProfile(user: InternalUserWithProfile) {
    setSelectedUser(user);
    setProfileDialogOpen(true);
    setProfileLoading(true);

    try {
      const profile = await fetchInternalUserProfile(user.id);
      setSelectedUser(profile);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load profile",
      );
    } finally {
      setProfileLoading(false);
    }
  }

  async function handleUpdateUserProfile(
    input: UpdateInternalUserProfileInput,
  ) {
    if (!selectedUser) return;

    setProfileSubmitting(true);
    try {
      const updatedUser = await updateInternalUserProfile(
        selectedUser.id,
        input,
      );
      setSelectedUser(updatedUser);
      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.id === updatedUser.id ? updatedUser : user,
        ),
      );
      toast.success("Profile updated");
      setProfileDialogOpen(false);
      await loadUsers();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update profile",
      );
    } finally {
      setProfileSubmitting(false);
    }
  }

  function handleResetPassword(user: { username?: string }) {
    setResetPasswordUsername(user.username ?? "");
    setNewPassword("");
    setShowPassword(false);
  }

  async function executeStatusChange() {
    const { user, type } = confirmDialog;
    if (!user || !type) return;
    const isBlocking = type === "block";

    setActionLoading(user.id);
    try {
      await (isBlocking
        ? blockInternalUser(user.id)
        : unblockInternalUser(user.id));
      toast.success(
        `${user.username || user.name} has been ${isBlocking ? "blocked" : "unblocked"}`,
      );
      setConfirmDialog({ type: null });
      await loadUsers();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : `Failed to ${type} user`,
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function executeUpdateInvite(data: {
    status?: InternalInviteStatus;
    expiration?: string;
  }) {
    const invite = updateInviteDialog;
    if (!invite) return;

    setUpdateInviteSubmitting(true);
    try {
      await updateInternalInvite(invite.id, {
        ...data,
        status: data.status === "ACCEPTED" ? undefined : data.status,
      });
      toast.success("Invite updated");
      setUpdateInviteDialog(null);
      await loadInvites();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update invite",
      );
    } finally {
      setUpdateInviteSubmitting(false);
    }
  }

  async function executeResetPassword() {
    const username = resetPasswordUsername;
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
      setResetPasswordUsername(null);
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
  const filteredUsers = useMemo(
    () =>
      users
        .filter(
          (user) =>
            matchesSearch(user, userSearch) &&
            (userStatus === "ALL" || user.status === userStatus) &&
            (userRole === "ALL" || user.profile?.role === userRole),
        )
        .sort((left, right) => compareCreationDate(left, right, userSort)),
    [userSearch, userStatus, userRole, userSort, users],
  );
  const filteredInvites = useMemo(
    () =>
      invites
        .filter(
          (invite) =>
            matchesSearch(invite, inviteSearch) &&
            (inviteStatus === "ALL" || invite.status === inviteStatus),
        )
        .sort((left, right) => compareCreationDate(left, right, inviteSort)),
    [inviteSearch, inviteStatus, inviteSort, invites],
  );

  const currentUserPage = Math.min(
    userPage,
    Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE)),
  );
  const currentInvitePage = Math.min(
    invitePage,
    Math.max(1, Math.ceil(filteredInvites.length / PAGE_SIZE)),
  );

  function resetUserFilters(status: FilterValue<InternalUserStatus> = "ALL") {
    setUserSearch("");
    setUserRole("ALL");
    setUserStatus(status);
    setUserPage(1);
  }

  function resetInviteFilters(
    status: FilterValue<InternalInviteStatus> = "ALL",
  ) {
    setInviteSearch("");
    setInviteStatus(status);
    setInvitePage(1);
  }

  const isBlocking = confirmDialog.type === "block";
  const statusActionLabel = isBlocking ? "Block" : "Unblock";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Users
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage users, roles, and invitations.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              loadUsers();
              loadInvites();
            }}
            disabled={usersLoading || invitesLoading}
          >
            <RefreshCw
              className={`size-4 ${usersLoading || invitesLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <SendInviteDialog
            isSubmitting={inviteSubmitting}
            onSubmit={handleInviteSubmit}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-border bg-background [&>button]:border-border [&>button]:border-b [&>button:nth-child(odd)]:border-r [&>button:nth-last-child(-n+2)]:border-b-0 lg:grid-cols-4 lg:[&>button]:border-b-0 lg:[&>button:not(:last-child)]:border-r">
        <Metric
          label="User accounts"
          value={usersLoading || usersError ? null : users.length}
          selected={
            tab === "users" &&
            userStatus === "ALL" &&
            userRole === "ALL" &&
            !userSearch
          }
          onClick={() => {
            resetUserFilters();
            setTab("users");
          }}
        />
        <Metric
          label="Active users"
          value={usersLoading || usersError ? null : activeUsers}
          selected={
            tab === "users" &&
            userStatus === "ACTIVE" &&
            userRole === "ALL" &&
            !userSearch
          }
          onClick={() => {
            resetUserFilters("ACTIVE");
            setTab("users");
          }}
        />
        <Metric
          label="Blocked users"
          value={usersLoading || usersError ? null : blockedUsers}
          selected={
            tab === "users" &&
            userStatus === "BLOCKED" &&
            userRole === "ALL" &&
            !userSearch
          }
          onClick={() => {
            resetUserFilters("BLOCKED");
            setTab("users");
          }}
        />
        <Metric
          label="Pending invites"
          value={invitesLoading || invitesError ? null : pendingInvites}
          selected={
            tab === "invites" && inviteStatus === "PENDING" && !inviteSearch
          }
          onClick={() => {
            resetInviteFilters("PENDING");
            setTab("invites");
          }}
        />
      </div>

      <Tabs value={tab} onValueChange={setTab} className="gap-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <TabsList className="w-fit shrink-0" aria-label="User management">
            {[
              {
                value: "users",
                label: "Users",
                count: usersLoading || usersError ? null : users.length,
              },
              {
                value: "invites",
                label: "Invites",
                count: invitesLoading || invitesError ? null : invites.length,
              },
            ].map(({ value, label, count }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {label}
                {tab === value && (
                  <span className="rounded-sm bg-primary-foreground/10 px-1.5 text-xs tabular-nums">
                    {count ?? "—"}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
          {tab === "users" ? (
            <ManagementFilters
              kind="users"
              search={userSearch}
              onSearchChange={(value) => {
                setUserSearch(value);
                setUserPage(1);
              }}
              status={userStatus}
              statuses={INTERNAL_USER_STATUSES}
              onStatusChange={(value) => {
                setUserStatus(value as FilterValue<InternalUserStatus>);
                setUserPage(1);
              }}
              role={userRole}
              onRoleChange={(value) => {
                setUserRole(value as FilterValue<InternalProfileRole>);
                setUserPage(1);
              }}
              sort={userSort}
              onSortChange={(value) => {
                setUserSort(value);
                setUserPage(1);
              }}
              onReset={() => resetUserFilters()}
            />
          ) : (
            <ManagementFilters
              kind="invites"
              search={inviteSearch}
              onSearchChange={(value) => {
                setInviteSearch(value);
                setInvitePage(1);
              }}
              status={inviteStatus}
              statuses={INTERNAL_INVITE_STATUSES}
              onStatusChange={(value) => {
                setInviteStatus(value as FilterValue<InternalInviteStatus>);
                setInvitePage(1);
              }}
              sort={inviteSort}
              onSortChange={(value) => {
                setInviteSort(value);
                setInvitePage(1);
              }}
              onReset={() => resetInviteFilters()}
            />
          )}
        </div>
        <TabsContent value="users" className="space-y-4">
          {usersError ? (
            <ErrorBanner message={usersError} onRetry={loadUsers} />
          ) : (
            <>
              <UsersTable
                users={filteredUsers.slice(
                  (currentUserPage - 1) * PAGE_SIZE,
                  currentUserPage * PAGE_SIZE,
                )}
                isLoading={usersLoading}
                currentUserEmail={session?.user.email ?? undefined}
                onOpenUserProfile={handleOpenUserProfile}
                onBlock={(user) => setConfirmDialog({ type: "block", user })}
                onUnblock={(user) =>
                  setConfirmDialog({ type: "unblock", user })
                }
                onResetPassword={handleResetPassword}
                actionLoading={actionLoading ?? undefined}
              />
              {!usersLoading && (
                <TablePagination
                  page={currentUserPage}
                  total={filteredUsers.length}
                  label="users"
                  onPageChange={setUserPage}
                />
              )}
            </>
          )}
        </TabsContent>
        <TabsContent value="invites" className="space-y-4">
          {invitesError ? (
            <ErrorBanner message={invitesError} onRetry={loadInvites} />
          ) : (
            <>
              <InvitesTable
                invites={filteredInvites.slice(
                  (currentInvitePage - 1) * PAGE_SIZE,
                  currentInvitePage * PAGE_SIZE,
                )}
                isLoading={invitesLoading}
                onUpdateInvite={setUpdateInviteDialog}
                onResetPassword={handleResetPassword}
                actionLoading={actionLoading ?? undefined}
              />
              {!invitesLoading && (
                <TablePagination
                  page={currentInvitePage}
                  total={filteredInvites.length}
                  label="invites"
                  onPageChange={setInvitePage}
                />
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
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
        open={confirmDialog.type !== null}
        onOpenChange={(open) => !open && setConfirmDialog({ type: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {statusActionLabel}{" "}
              {confirmDialog.user?.username || confirmDialog.user?.name}?
            </DialogTitle>
            <DialogDescription>
              {isBlocking
                ? "This user will lose access to their account until unblocked."
                : "This user will regain access to their account."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmDialog({ type: null })}
              disabled={actionLoading !== null}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant={isBlocking ? "destructive" : "default"}
              onClick={executeStatusChange}
              disabled={actionLoading !== null}
            >
              {statusActionLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <UpdateInviteDialog
        invite={updateInviteDialog}
        open={updateInviteDialog !== null}
        onOpenChange={(open) => !open && setUpdateInviteDialog(null)}
        onSubmit={executeUpdateInvite}
        isSubmitting={updateInviteSubmitting}
      />

      <UserProfileDialog
        user={selectedUser}
        open={profileDialogOpen}
        isLoading={profileLoading}
        isSubmitting={profileSubmitting}
        onOpenChange={(open) => {
          setProfileDialogOpen(open);
          if (!open) setSelectedUser(null);
        }}
        onSubmit={handleUpdateUserProfile}
      />

      <Dialog
        open={resetPasswordUsername !== null}
        onOpenChange={(open) => !open && setResetPasswordUsername(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Enter a new password for {resetPasswordUsername}
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
                  aria-label={showPassword ? "Hide password" : "Show password"}
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
              onClick={() => setResetPasswordUsername(null)}
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
