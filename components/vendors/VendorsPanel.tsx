"use client";

import { Pencil, Plus, RefreshCw, Search } from "lucide-react";
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

export function VendorsPanel() {
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
    <section className="flex flex-col gap-4 sm:gap-5 lg:min-h-0 lg:flex-1">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight">Vendors</h1>
          <p className="hidden text-sm text-muted-foreground sm:block">
            Manage vendor names and email addresses.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
            aria-label="Refresh vendors"
          >
            <RefreshCw
              className={query.isFetching ? "size-4 animate-spin" : "size-4"}
            />
          </Button>
          <Button type="button" onClick={() => edit(null)}>
            <Plus className="size-4" />
            <span className="sm:hidden">Add</span>
            <span className="hidden sm:inline">Add vendor</span>
          </Button>
        </div>
      </div>
      <div className="relative sm:max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name or email"
          aria-label="Search vendors"
          className="pl-9"
        />
      </div>
      <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
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
        ) : !rows.length ? (
          <p className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">
            {search
              ? "No vendors match your search."
              : "No vendors yet. Add your first vendor."}
          </p>
        ) : (
          <>
            <ul className="divide-y overflow-hidden rounded-xl border bg-card md:hidden">
              {rows.map((vendor) => (
                <li key={vendor.vendorId}>
                  <button
                    type="button"
                    onClick={() => edit(vendor)}
                    aria-label={`Edit ${vendor.name}`}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{vendor.name}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {vendor.email || "No email added"}
                      </p>
                    </div>
                    <Pencil className="size-4 shrink-0 text-muted-foreground" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="hidden overflow-hidden rounded-xl border bg-card md:block">
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
                </TableBody>
              </Table>
            </div>
          </>
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
