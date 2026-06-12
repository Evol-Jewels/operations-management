"use client";

import { useEffect, useState } from "react";
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
import type {
  InternalInviteRow,
  InternalInviteStatus,
} from "@/types/user-management";
import { cn } from "@/lib/utils";

const UPDATEABLE_STATUSES: InternalInviteStatus[] = [
  "PENDING",
  "EXPIRED",
  "CANCELLED",
];

function toDatetimeLocal(value: string) {
  const date = new Date(value);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

function toIsoString(value: string) {
  if (!value) return undefined;
  return new Date(value).toISOString();
}

interface UpdateInviteDialogProps {
  invite: InternalInviteRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    status?: InternalInviteStatus;
    expiration?: string;
  }) => Promise<void>;
  isSubmitting: boolean;
}

export function UpdateInviteDialog({
  invite,
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: UpdateInviteDialogProps) {
  const [status, setStatus] = useState<InternalInviteStatus>("PENDING");
  const [expiration, setExpiration] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (invite) {
      setStatus(invite.status);
      setExpiration(toDatetimeLocal(invite.expirationAt));
      setError("");
    }
  }, [invite]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (status === "PENDING" && expiration) {
      const expDate = new Date(expiration);
      if (expDate <= new Date()) {
        setError("Expiration must be in the future when status is PENDING");
        return;
      }
    }

    try {
      await onSubmit({
        status: status !== invite?.status ? status : undefined,
        expiration:
          expiration !== toDatetimeLocal(invite?.expirationAt ?? "")
            ? toIsoString(expiration)
            : undefined,
      });
      onOpenChange(false);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to update invite.",
      );
    }
  }

  if (!invite) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Invite</DialogTitle>
          <DialogDescription>
            Modify status and expiration for {invite.email}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="update-invite-status">Status</Label>
            <Select
              value={status}
              onValueChange={(value) =>
                setStatus(value as InternalInviteStatus)
              }
              disabled={isSubmitting}
            >
              <SelectTrigger id="update-invite-status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UPDATEABLE_STATUSES.map((statusOption) => (
                  <SelectItem key={statusOption} value={statusOption}>
                    {statusOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="update-invite-expiration">Expiration</Label>
            <Input
              id="update-invite-expiration"
              type="datetime-local"
              value={expiration}
              onChange={(event) => setExpiration(event.target.value)}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              Leave blank to keep current expiration.
            </p>
          </div>

          {error && (
            <div
              className={cn(
                "rounded-md border px-3 py-2 text-sm",
                "border-destructive/20 bg-destructive/10 text-destructive",
              )}
            >
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Invite"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
