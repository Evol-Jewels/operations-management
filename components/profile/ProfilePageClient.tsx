"use client";

import {
  Camera,
  Check,
  Circle,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  MapPinned,
  Save,
  User,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useChangeInternalPassword,
  useMyInternalProfile,
  useUpdateMyInternalProfile,
} from "@/hooks/useInternalProfile";
import { useLocations } from "@/hooks/useManageProducts";
import { getSessionRole } from "@/lib/auth";
import { type AuthSession, authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const MAX_AVATAR_SIZE = 2 * 1024 * 1024;
const profileTabTriggerClassName =
  "h-11 flex-none rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 shadow-none focus-visible:border-transparent focus-visible:border-b-foreground focus-visible:ring-0 data-[state=active]:border-x-transparent data-[state=active]:border-t-transparent data-[state=active]:border-b-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none";

type SessionUserProfile = NonNullable<AuthSession>["user"] & {
  username?: string | null;
  image?: string | null;
  profile?: {
    role?: string | null;
    locationId?: string | null;
  } | null;
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

function deriveUsername(user: SessionUserProfile | undefined) {
  if (user?.username) return user.username;
  return user?.email?.split("@")[0] ?? "not assigned";
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function PasswordInput({
  id,
  label,
  value,
  onChange,
  visible,
  onToggleVisible,
  autoComplete,
  placeholder,
  error,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggleVisible: () => void;
  autoComplete: string;
  placeholder: string;
  error?: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-xs font-medium uppercase">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          disabled={disabled}
          className="h-11 pr-11 text-base"
        />
        <button
          type="button"
          className="absolute top-1/2 right-3 flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          onClick={onToggleVisible}
          disabled={disabled}
          aria-label={visible ? `Hide ${label}` : `Show ${label}`}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function Requirement({ met, label }: { met: boolean; label: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 text-sm",
        met ? "text-foreground" : "text-muted-foreground",
      )}
    >
      {met ? <Check className="size-3.5" /> : <Circle className="size-2.5" />}
      <span>{label}</span>
    </div>
  );
}

export function ProfilePageClient() {
  const { data: session } = authClient.useSession();
  const profileQuery = useMyInternalProfile();
  const updateProfile = useUpdateMyInternalProfile();
  const changePassword = useChangeInternalPassword();
  const user = session?.user as SessionUserProfile | undefined;
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const locationsQuery = useLocations({ limit: 100 });
  const profile = profileQuery.data;
  const profileLoading = profileQuery.isLoading;

  const name = profile?.name ?? user?.name ?? "User";
  const email = profileLoading
    ? "Loading..."
    : (profile?.email ?? user?.email ?? "");
  const emailValue = email || "not assigned";
  const role = (
    profile?.profile?.role ??
    getSessionRole(session) ??
    "not assigned"
  ).toLowerCase();
  const username = profileLoading
    ? "Loading..."
    : (profile?.username ?? user?.username ?? name ?? deriveUsername(user));
  const hasUsername = Boolean(profile?.username ?? user?.username);
  const identityLabel = hasUsername ? "Username" : "Name";
  const identityInputId = hasUsername ? "profile-username" : "profile-name";
  const initialLocationId = profile?.profile?.locationId ?? "";

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [selectedLocationId, setSelectedLocationId] =
    useState(initialLocationId);
  const [savedLocationId, setSavedLocationId] = useState(initialLocationId);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [visiblePasswords, setVisiblePasswords] = useState({
    current: false,
    next: false,
    confirm: false,
  });

  useEffect(() => {
    setSelectedLocationId(initialLocationId);
    setSavedLocationId(initialLocationId);
  }, [initialLocationId]);

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  const locations = locationsQuery.data?.data ?? [];
  const locationDisabled =
    profileLoading || locationsQuery.isLoading || updateProfile.isPending;
  const canSaveLocation =
    Boolean(selectedLocationId) &&
    selectedLocationId !== savedLocationId &&
    !locationDisabled;

  const passwordRequirements = useMemo(
    () => ({
      length: newPassword.length >= 8,
      number: /\d/.test(newPassword),
      letter: /[a-zA-Z]/.test(newPassword),
    }),
    [newPassword],
  );

  const passwordMismatch =
    confirmPassword.length > 0 && confirmPassword !== newPassword;
  const passwordReused =
    currentPassword.length > 0 &&
    newPassword.length > 0 &&
    currentPassword === newPassword;
  const canResetPassword =
    currentPassword.length > 0 &&
    passwordRequirements.length &&
    passwordRequirements.number &&
    passwordRequirements.letter &&
    confirmPassword === newPassword &&
    !passwordReused &&
    !changePassword.isPending;

  function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      toast.error("Choose a JPG or PNG image.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      toast.error("Avatar image must be 2MB or smaller.");
      event.target.value = "";
      return;
    }

    const nextPreview = URL.createObjectURL(file);
    setAvatarPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return nextPreview;
    });
    toast.success("Avatar preview updated");
  }

  async function handleLocationSave() {
    if (!canSaveLocation) return;

    try {
      const updatedProfile = await updateProfile.mutateAsync({
        locationId: selectedLocationId,
      });
      const updatedLocationId = updatedProfile.profile?.locationId ?? "";
      setSelectedLocationId(updatedLocationId);
      setSavedLocationId(updatedLocationId);
      toast.success("Location updated");
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not update location"));
    }
  }

  async function handlePasswordReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canResetPassword) return;

    try {
      await changePassword.mutateAsync({
        currentPassword,
        newPassword,
      });
      toast.success("Password updated");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setVisiblePasswords({ current: false, next: false, confirm: false });
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not update password"));
    }
  }

  return (
    <div className="flex min-h-[calc(100dvh-5.25rem)] flex-col gap-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Settings
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Review your account details and manage how you sign in.
        </p>
      </header>

      <Tabs defaultValue="profile" className="gap-6">
        <TabsList className="h-auto w-full justify-start gap-6 rounded-none border-border border-b bg-transparent p-0 text-muted-foreground">
          <TabsTrigger
            value="profile"
            className={profileTabTriggerClassName}
          >
            <User className="size-4" />
            Profile
          </TabsTrigger>
          {hasUsername ? (
            <TabsTrigger
              value="password"
              className={profileTabTriggerClassName}
            >
              <KeyRound className="size-4" />
              Password
            </TabsTrigger>
          ) : null}
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <section className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="relative w-fit">
              <Avatar className="size-20 border border-border">
                <AvatarImage
                  src={avatarPreview ?? user?.image ?? undefined}
                  alt={name}
                  className="object-cover"
                />
                <AvatarFallback className="text-2xl font-semibold text-foreground">
                  {initials(name)}
                </AvatarFallback>
              </Avatar>
              <Button
                type="button"
                size="icon-sm"
                variant="outline"
                className="-right-1 -bottom-1 absolute rounded-full bg-background"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Update avatar"
              >
                <Camera className="size-4" />
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            <div className="min-w-0 space-y-2">
              <h2 className="text-xl font-semibold text-foreground">
                {username}
              </h2>
              <Badge variant="secondary" className="capitalize">
                {role}
              </Badge>
            </div>
          </section>

          {profileQuery.isError ? (
            <div className="flex flex-col gap-3 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between">
              <span>
                {getErrorMessage(profileQuery.error, "Could not load profile.")}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => profileQuery.refetch()}
              >
                Retry
              </Button>
            </div>
          ) : null}

          <Card className="max-w-2xl rounded-lg">
            <CardHeader>
              <CardTitle className="text-xl">Account details</CardTitle>
              <CardDescription className="text-base">
                Username, email, and role are managed by your administrator. You
                can update your work location.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={identityInputId}>{identityLabel}</Label>
                  <Input
                    id={identityInputId}
                    value={username}
                    disabled
                    className="h-11 text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profile-email">Email</Label>
                  <Input
                    id="profile-email"
                    value={emailValue}
                    disabled
                    className="h-11 text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profile-role">Role</Label>
                  <Input
                    id="profile-role"
                    value={role}
                    disabled
                    className="h-11 text-base capitalize"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assigned-location">Location</Label>
                  <Select
                    value={selectedLocationId}
                    onValueChange={setSelectedLocationId}
                    disabled={locationDisabled}
                  >
                    <SelectTrigger
                      id="assigned-location"
                      className="h-11 w-full data-[size=default]:h-11"
                    >
                      <MapPinned className="size-4 text-muted-foreground" />
                      <SelectValue
                        placeholder={
                          profileLoading
                            ? "Loading profile..."
                            : locationsQuery.isLoading
                              ? "Loading locations..."
                              : "Select location"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {locationsQuery.isLoading ? (
                        <SelectItem value="loading" disabled>
                          Loading locations...
                        </SelectItem>
                      ) : null}
                      {locations.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name} - {location.city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter className="mt-2">
              <Button
                type="button"
                className="w-full sm:w-auto"
                disabled={!canSaveLocation}
                onClick={handleLocationSave}
              >
                {updateProfile.isPending ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                {updateProfile.isPending ? "Saving..." : "Update Profile"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {hasUsername ? (
          <TabsContent value="password">
            <Card className="max-w-2xl rounded-lg">
              <CardHeader>
                <CardTitle className="text-xl">Reset Password</CardTitle>
                <CardDescription className="text-base">
                  Change the password used with your internal username login.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handlePasswordReset}>
                <CardContent className="space-y-6">
                  <PasswordInput
                    id="current-password"
                    label="Current password"
                    value={currentPassword}
                    onChange={setCurrentPassword}
                    visible={visiblePasswords.current}
                    onToggleVisible={() =>
                      setVisiblePasswords((current) => ({
                        ...current,
                        current: !current.current,
                      }))
                    }
                    autoComplete="current-password"
                    placeholder="Enter your current password"
                    disabled={changePassword.isPending}
                  />

                  <div className="grid gap-5 md:grid-cols-2">
                    <PasswordInput
                      id="new-password"
                      label="New password"
                      value={newPassword}
                      onChange={setNewPassword}
                      visible={visiblePasswords.next}
                      onToggleVisible={() =>
                        setVisiblePasswords((current) => ({
                          ...current,
                          next: !current.next,
                        }))
                      }
                      autoComplete="new-password"
                      placeholder="Enter a new password"
                      error={
                        passwordReused
                          ? "New password must be different from current password."
                          : undefined
                      }
                      disabled={changePassword.isPending}
                    />
                    <PasswordInput
                      id="confirm-password"
                      label="Confirm new password"
                      value={confirmPassword}
                      onChange={setConfirmPassword}
                      visible={visiblePasswords.confirm}
                      onToggleVisible={() =>
                        setVisiblePasswords((current) => ({
                          ...current,
                          confirm: !current.confirm,
                        }))
                      }
                      autoComplete="new-password"
                      placeholder="Re-enter the new password"
                      error={
                        passwordMismatch ? "Passwords do not match." : undefined
                      }
                      disabled={changePassword.isPending}
                    />
                  </div>

                  <div className="rounded-lg py-1">
                    <p className="mb-3 text-sm font-medium text-foreground">
                      Password requirements
                    </p>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <Requirement
                        met={passwordRequirements.length}
                        label="At least 8 characters"
                      />
                      <Requirement
                        met={passwordRequirements.number}
                        label="Includes a number"
                      />
                      <Requirement
                        met={passwordRequirements.letter}
                        label="Includes a letter"
                      />
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-4 pt-8 sm:flex-row sm:items-center sm:justify-end">
                  <Button
                    type="submit"
                    className="w-full sm:w-auto"
                    disabled={!canResetPassword}
                  >
                    {changePassword.isPending ? (
                      <LoaderCircle className="size-4 animate-spin" />
                    ) : null}
                    {changePassword.isPending
                      ? "Updating..."
                      : "Reset password"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  );
}
