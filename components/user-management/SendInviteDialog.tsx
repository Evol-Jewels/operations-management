"use client";

import { Send } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import type {
  CreateInternalInviteInput,
  InternalProfileRole,
} from "@/types/user-management";
import { INTERNAL_PROFILE_ROLES } from "@/types/user-management";

interface SendInviteDialogProps {
  isSubmitting: boolean;
  onSubmit: (input: CreateInternalInviteInput) => Promise<void>;
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
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Email is required.");
      return;
    }

    setError("");

    try {
      await onSubmit({
        email: trimmedEmail,
        role,
        expiration: toIsoDateTime(expiration),
      });
      setEmail("");
      setRole("SALES");
      setExpiration(defaultExpirationValue());
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
            Create an inactive internal user and send an invite for dashboard
            access.
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

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
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
