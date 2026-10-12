"use client";

import { ArrowLeft, Pencil, Plus, RefreshCw, Search } from "lucide-react";
import { useState } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSaveVendor, useVendors } from "@/hooks/useVendors";
import type { Vendor } from "@/lib/vendors";

export function VendorsPanel({ onBack }: { onBack: () => void }) {
  const query = useVendors();
  const saveVendor = useSaveVendor();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const rows = (query.data ?? []).filter((vendor) =>
    `${vendor.name} ${vendor.email ?? ""}`
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );

  function edit(vendor: Vendor | null) {
    setEditing(vendor);
    setName(vendor?.name ?? "");
    setEmail(vendor?.email ?? "");
    setError("");
    setOpen(true);
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onBack}
            aria-label="Back to Manage System Config"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Vendors</h1>
            <p className="text-sm text-muted-foreground">
              Manage vendor names and email addresses.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
            aria-label="Refresh vendors"
          >
            <RefreshCw className="size-4" />
          </Button>
          <Button type="button" onClick={() => edit(null)}>
            <Plus className="size-4" />
            Add vendor
          </Button>
        </div>
      </div>
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name or email"
          aria-label="Search vendors"
          className="pl-9"
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {query.isLoading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Loading vendors...
          </p>
        ) : query.isError ? (
          <div role="alert" className="rounded-xl border p-5">
            <p className="text-sm">
              {query.error.message || "Could not load vendors."}
            </p>
            <Button
              className="mt-3"
              type="button"
              variant="outline"
              onClick={() => void query.refetch()}
            >
              Try again
            </Button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="w-16">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((vendor) => (
                  <TableRow key={vendor.vendorId}>
                    <TableCell className="max-w-64 whitespace-normal break-words font-medium">
                      {vendor.name}
                    </TableCell>
                    <TableCell className="max-w-72 whitespace-normal break-all text-muted-foreground">
                      {vendor.email || "Not added"}
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => edit(vendor)}
                        aria-label={`Edit ${vendor.name}`}
                      >
                        <Pencil className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!rows.length ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="py-10 text-center text-muted-foreground"
                    >
                      {search
                        ? "No vendors match your search."
                        : "No vendors yet. Add your first vendor."}
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!saveVendor.isPending) setOpen(value);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <form
            className="grid gap-5"
            onSubmit={async (event) => {
              event.preventDefault();
              setError("");
              try {
                await saveVendor.mutateAsync({
                  vendorId: editing?.vendorId,
                  input: { name: name.trim(), email: email.trim() || null },
                });
                setOpen(false);
                toast.success(editing ? "Vendor updated" : "Vendor added");
              } catch (error) {
                setError(
                  error instanceof Error
                    ? error.message
                    : "Could not save vendor.",
                );
              }
            }}
          >
            <DialogHeader>
              <DialogTitle>
                {editing ? "Edit vendor" : "Add vendor"}
              </DialogTitle>
              <DialogDescription>
                Use this vendor when assigning orders and composing emails.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2">
              <Label htmlFor="config-vendor-name">Name</Label>
              <Input
                id="config-vendor-name"
                required
                maxLength={255}
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={saveVendor.isPending}
                autoComplete="organization"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="config-vendor-email">
                Email{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </Label>
              <Input
                id="config-vendor-email"
                type="email"
                multiple
                maxLength={2000}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={saveVendor.isPending}
                placeholder="vendor@example.com"
                aria-describedby="config-vendor-email-hint"
              />
              <p
                id="config-vendor-email-hint"
                className="text-xs text-muted-foreground"
              >
                Separate multiple addresses with commas.
              </p>
            </div>
            {error ? (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={saveVendor.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saveVendor.isPending || !name.trim()}
              >
                {saveVendor.isPending ? "Saving..." : "Save vendor"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
