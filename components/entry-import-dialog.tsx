"use client";

import { Copy, LoaderCircle } from "lucide-react";
import { useId, useRef, useState } from "react";
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

export function EntryImportDialog({
  entryType,
  disabled,
  onImport,
}: {
  entryType: "order" | "enquiry";
  disabled?: boolean;
  onImport: (refCode: number) => Promise<void>;
}) {
  const id = useId();
  const busyRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [refCode, setRefCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [importedRef, setImportedRef] = useState<number | null>(null);

  async function importEntry() {
    if (busyRef.current) return;
    const code = Number(refCode.trim());
    if (
      !/^\d+$/.test(refCode.trim()) ||
      !Number.isSafeInteger(code) ||
      code < 1
    ) {
      setError("Enter a valid ref code, for example 1 or 2.");
      return;
    }
    busyRef.current = true;
    setLoading(true);
    setError("");
    try {
      await onImport(code);
      setImportedRef(code);
      setOpen(false);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : `Unable to import this ${entryType}. Try again.`,
      );
    } finally {
      busyRef.current = false;
      setLoading(false);
    }
  }

  return (
    <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
      {importedRef !== null && (
        <output className="text-xs text-muted-foreground">
          Imported from {entryType} #{importedRef}. You can edit the details.
        </output>
      )}
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (busyRef.current) return;
          setOpen(value);
          if (value) {
            setRefCode("");
            setError("");
          }
        }}
      >
        <DialogTrigger asChild>
          <Button type="button" variant="outline" size="sm" disabled={disabled}>
            <Copy className="size-4" />
            Import from existing {entryType}
          </Button>
        </DialogTrigger>
        <DialogContent showCloseButton={!loading}>
          <DialogHeader>
            <DialogTitle>Import {entryType} details</DialogTitle>
            <DialogDescription>
              This replaces the current draft with details from the existing{" "}
              {entryType}. Review and edit them before creating a new entry.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor={id}>Ref code</Label>
            <Input
              id={id}
              inputMode="numeric"
              placeholder="e.g. 1"
              value={refCode}
              disabled={loading}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? `${id}-error` : undefined}
              onChange={(event) => {
                setRefCode(event.target.value);
                setError("");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void importEntry();
                }
              }}
            />
            {error && (
              <p
                id={`${id}-error`}
                role="alert"
                className="text-sm text-destructive"
              >
                {error}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={loading || !refCode.trim()}
              onClick={() => void importEntry()}
            >
              {loading && <LoaderCircle className="size-4 animate-spin" />}
              {loading ? "Importing..." : "Import details"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
