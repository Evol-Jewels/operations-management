"use client";

import { LoaderCircle, Save } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
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
import { useLocations } from "@/hooks/useManageProducts";
import type {
  InternalProfileRole,
  InternalUserWithProfile,
  UpdateInternalUserProfileInput,
} from "@/types/user-management";
import { INTERNAL_PROFILE_ROLES } from "@/types/user-management";

const NO_LOCATION_VALUE = "none";
export function UserProfileDialog({
  user,
  open,
  isLoading,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: {
  user: InternalUserWithProfile | null;
  open: boolean;
  isLoading: boolean;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: UpdateInternalUserProfileInput) => Promise<void>;
}) {
  const locationsQuery = useLocations({ limit: 100 }, open);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<InternalProfileRole>("SALES");
  const [locationId, setLocationId] = useState(NO_LOCATION_VALUE);
  const [monthlySalesTarget, setMonthlySalesTarget] = useState("");

  useEffect(() => {
    if (!user) return;

    setName(user.name ?? "");
    setUsername(user.username ?? "");
    setRole(user.profile?.role ?? "SALES");
    setLocationId(user.profile?.locationId ?? NO_LOCATION_VALUE);
    setMonthlySalesTarget(user.profile?.monthlySalesTarget ?? "");
  }, [user]);

  const locations = locationsQuery.data?.data ?? [];
  const originalLocationId = user?.profile?.locationId ?? NO_LOCATION_VALUE;
  const trimmedName = name.trim();
  const trimmedUsername = username.trim();
  const trimmedTarget = monthlySalesTarget.trim();
  const isAdminUser = user?.profile?.role === "ADMIN";

  const hasChanges =
    user !== null &&
    (trimmedName !== user.name ||
      trimmedUsername !== (user.username ?? "") ||
      (!isAdminUser && role !== (user.profile?.role ?? "SALES")) ||
      locationId !== originalLocationId ||
      trimmedTarget !== (user.profile?.monthlySalesTarget ?? ""));
  const nameInvalid = trimmedName.length < 1 || trimmedName.length > 255;
  const usernameInvalid =
    trimmedUsername.length > 0 &&
    (trimmedUsername.length < 3 ||
      trimmedUsername.length > 64 ||
      !/^[a-zA-Z0-9_.-]+$/.test(trimmedUsername));
  const canSubmit =
    hasChanges &&
    !nameInvalid &&
    !usernameInvalid &&
    !isLoading &&
    !isSubmitting;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit || !user) return;

    const input: UpdateInternalUserProfileInput = {};
    if (trimmedName !== user.name) {
      input.name = trimmedName;
    }
    if (trimmedUsername !== (user.username ?? "")) {
      input.username = trimmedUsername;
    }
    if (!isAdminUser && role !== (user.profile?.role ?? "SALES")) {
      input.role = role;
    }
    if (locationId !== originalLocationId) {
      input.locationId = locationId === NO_LOCATION_VALUE ? null : locationId;
    }
    if (trimmedTarget !== (user.profile?.monthlySalesTarget ?? "")) {
      input.monthlySalesTarget = trimmedTarget || null;
    }

    await onSubmit(input);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit User Profile</DialogTitle>
          <DialogDescription>
            Update profile settings for {user?.email ?? "this user"}.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex min-h-48 items-center justify-center text-sm text-muted-foreground">
            <LoaderCircle className="mr-2 size-4 animate-spin" />
            Loading profile...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-user-name">Name</Label>
                <Input
                  id="edit-user-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  disabled={isSubmitting}
                  aria-invalid={nameInvalid}
                  className="h-10"
                />
                {nameInvalid ? (
                  <p className="text-xs text-destructive">
                    Name is required and must be 255 characters or fewer.
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-user-email">Email</Label>
                <Input
                  id="edit-user-email"
                  value={user?.email ?? ""}
                  disabled
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-user-username">Username</Label>
                <Input
                  id="edit-user-username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="username"
                  disabled={isSubmitting}
                  aria-invalid={usernameInvalid}
                  className="h-10"
                />
                {usernameInvalid ? (
                  <p className="text-xs text-destructive">
                    Use 3-64 letters, numbers, dots, dashes, or underscores.
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-user-role">Role</Label>
                <Select
                  value={role}
                  onValueChange={(value) =>
                    setRole(value as InternalProfileRole)
                  }
                  disabled={isAdminUser || isSubmitting}
                >
                  <SelectTrigger id="edit-user-role" className="h-10 w-full">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {INTERNAL_PROFILE_ROLES.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isAdminUser ? (
                  <p className="text-xs text-muted-foreground">
                    Admin role cannot be changed.
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-user-location">Location</Label>
                <Select
                  value={locationId}
                  onValueChange={setLocationId}
                  disabled={locationsQuery.isLoading || isSubmitting}
                >
                  <SelectTrigger
                    id="edit-user-location"
                    className="h-10 w-full"
                  >
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_LOCATION_VALUE}>
                      No location
                    </SelectItem>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name} - {location.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-user-target">Monthly Sales Target</Label>
                <Input
                  id="edit-user-target"
                  value={monthlySalesTarget}
                  onChange={(event) =>
                    setMonthlySalesTarget(event.target.value)
                  }
                  placeholder="0.00"
                  inputMode="decimal"
                  disabled={isSubmitting}
                  className="h-10"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!canSubmit}>
                {isSubmitting ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
