"use client";

import { ChevronDown, Send } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  CreateInternalInviteInput,
  CreateInternalInviteResponse,
  InternalProfileRole,
} from "@/types/user-management";
import { INTERNAL_PROFILE_ROLES } from "@/types/user-management";

function isAdmin(role: InternalProfileRole) {
  return role === "ADMIN";
}

const NO_LOCATION = "NONE";

interface SendInviteDialogProps {
  isSubmitting: boolean;
  onSubmit: (
    input: CreateInternalInviteInput,
  ) => Promise<CreateInternalInviteResponse>;
}

function defaultExpirationValue() {
  const date = new Date();
  date.setDate(date.getDate() + 3);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

function toIsoDateTime(value: string) {
  if (!value) return undefined;
  return new Date(value).toISOString();
}

export function SendInviteDialog({
  isSubmitting,
  onSubmit,
}: SendInviteDialogProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InternalProfileRole>("SALES");
  const [expiration, setExpiration] = useState(defaultExpirationValue);
  const [username, setUsername] = useState("");
  const [allowLoginWithUsername, setAllowLoginWithUsername] = useState(false);
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [password, setPassword] = useState("");
  const [locationId, setLocationId] = useState(NO_LOCATION);
  const [error, setError] = useState("");
  const locationsQuery = useLocations({ limit: 100 }, open);
  const locations = locationsQuery.data?.data ?? [];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    if (!trimmedEmail) {
      setError("Email is required.");
      return;
    }

    setError("");

    try {
      await onSubmit({
        email: trimmedEmail,
        role,
        ...(isAdmin(role)
          ? {}
          : {
              username: username.trim() || undefined,
              onlyUsernameLogin: allowLoginWithUsername,
            }),
        expiration: toIsoDateTime(expiration),
        password: trimmedPassword || undefined,
        locationId: locationId === NO_LOCATION ? undefined : locationId,
      });
      setEmail("");
      setRole("SALES");
      setExpiration(defaultExpirationValue());
      setUsername("");
      setAllowLoginWithUsername(false);
      setShowMoreDetails(false);
      setPassword("");
      setLocationId(NO_LOCATION);
      setOpen(false);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to send invite.",
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Send className="size-4" />
          Send Invite
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send internal invite</DialogTitle>
          <DialogDescription>
            Create access for an internal user.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="user@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite-role">Role</Label>
            <Select
              value={role}
              onValueChange={(value) => setRole(value as InternalProfileRole)}
            >
              <SelectTrigger id="invite-role" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INTERNAL_PROFILE_ROLES.map((roleOption) => (
                  <SelectItem key={roleOption} value={roleOption}>
                    {roleOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!isAdmin(role) && (
            <>
              <div className="space-y-2">
                <Label htmlFor="invite-username">Username</Label>
                <Input
                  id="invite-username"
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="username"
                />
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="invite-allow-username"
                  checked={allowLoginWithUsername}
                  onCheckedChange={(checked) =>
                    setAllowLoginWithUsername(checked === true)
                  }
                />
                <Label
                  htmlFor="invite-allow-username"
                  className="text-sm leading-5 text-muted-foreground"
                >
                  Only allow login with username
                </Label>
              </div>
            </>
          )}

          <Collapsible
            open={showMoreDetails}
            onOpenChange={setShowMoreDetails}
            className="space-y-3"
          >
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between"
                aria-expanded={showMoreDetails}
              >
                More details
                <ChevronDown
                  className={`size-4 transition-transform ${
                    showMoreDetails ? "rotate-180" : ""
                  }`}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 rounded-md border bg-muted/20 p-3">
              <div className="space-y-2">
                <Label htmlFor="invite-password">Password</Label>
                <Input
                  id="invite-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Optional password"
                  autoComplete="new-password"
                />
                <p className="text-xs text-muted-foreground">
                  Leave blank to let the backend generate one.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="invite-expiration">Expiration</Label>
                <Input
                  id="invite-expiration"
                  type="datetime-local"
                  value={expiration}
                  onChange={(event) => setExpiration(event.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Leave blank to use the backend default.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="invite-location">Location</Label>
                <Select
                  value={locationId}
                  onValueChange={setLocationId}
                  disabled={locationsQuery.isLoading}
                >
                  <SelectTrigger id="invite-location" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_LOCATION}>No location</SelectItem>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name} - {location.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {locationsQuery.isLoading ? (
                  <p className="text-xs text-muted-foreground">
                    Loading locations...
                  </p>
                ) : null}
                {locationsQuery.isError ? (
                  <p className="text-xs text-destructive">
                    Could not load locations.
                  </p>
                ) : null}
                {!locationsQuery.isLoading &&
                !locationsQuery.isError &&
                locations.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No locations configured.
                  </p>
                ) : null}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {error && (
            <div className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Sending..." : "Send invite"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
