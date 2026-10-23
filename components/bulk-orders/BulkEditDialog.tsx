"use client";

import { LoaderCircle } from "lucide-react";
import { type ReactNode, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function BulkEditDialog({
  title,
  description,
  pending,
  onClose,
  onSave,
  children,
}: {
  title: string;
  description: string;
  pending: boolean;
  onClose: () => void;
  onSave: () => Promise<void>;
  children: ReactNode;
}) {
  const [error, setError] = useState("");
  const errorId = useId();
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !pending) onClose();
      }}
    >
      <DialogContent className="flex max-h-[90dvh] flex-col overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="shrink-0 border-b px-5 py-4 pr-12">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form
          className="flex min-h-0 flex-col"
          aria-describedby={error ? errorId : undefined}
          onSubmit={async (event) => {
            event.preventDefault();
            if (pending) return;
            setError("");
            try {
              await onSave();
            } catch (cause) {
              setError(
                cause instanceof Error
                  ? cause.message
                  : "Could not save changes. Please try again.",
              );
            }
          }}
        >
          <div className="min-h-0 overflow-y-auto px-5 py-5">
            <fieldset disabled={pending} className="min-w-0 space-y-6">
              {children}
            </fieldset>
          </div>
          <div className="shrink-0 border-t px-5 py-4">
            {error && (
              <p
                id={errorId}
                role="alert"
                className="mb-3 text-sm text-destructive"
              >
                {error}
              </p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending && <LoaderCircle className="size-4 animate-spin" />}
                {pending ? "Saving…" : "Save changes"}
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
