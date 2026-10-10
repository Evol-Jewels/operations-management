"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { findOrderVendor, type Vendor } from "@/lib/vendors";

interface VendorComboboxProps {
  id: string;
  name: string;
  vendorId: string | null;
  vendors: Vendor[];
  onChange: (name: string, vendorId: string | null) => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export function VendorCombobox({
  id,
  name,
  vendorId,
  vendors,
  onChange,
  disabled,
  isLoading,
}: VendorComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selected = findOrderVendor(vendors, vendorId, name);
  const term = search.trim().toLowerCase();
  const matches = vendors.filter((vendor) =>
    `${vendor.name} ${vendor.email ?? ""}`.toLowerCase().includes(term),
  );

  function select(value: string, id: string | null) {
    onChange(value, id);
    setOpen(false);
  }

  return (
    <div className="grid min-w-0 gap-2">
      <Popover
        open={open}
        onOpenChange={(value) => {
          setOpen(value);
          if (value) setSearch("");
        }}
      >
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Vendor name"
            disabled={disabled}
            className="h-auto min-h-10 w-full justify-between gap-2 text-left font-normal"
          >
            <span className="truncate">
              {selected?.name || name || "Select or type a vendor"}
            </span>
            <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-[var(--radix-popover-trigger-width)] p-0"
        >
          <Command shouldFilter={false} defaultValue={selected?.vendorId}>
            <CommandInput
              value={search}
              onValueChange={setSearch}
              placeholder="Search or type a vendor..."
              maxLength={255}
              aria-label="Search or type a vendor"
            />
            <CommandList>
              <CommandGroup>
                {matches.map((vendor) => (
                  <CommandItem
                    key={vendor.vendorId}
                    value={vendor.vendorId}
                    onSelect={() => select(vendor.name, vendor.vendorId)}
                    className="items-start"
                  >
                    <Check
                      className={
                        selected?.vendorId === vendor.vendorId
                          ? "mt-0.5 size-4 shrink-0"
                          : "mt-0.5 size-4 shrink-0 opacity-0"
                      }
                    />
                    <div className="min-w-0">
                      <p className="break-words">{vendor.name}</p>
                      {vendor.email ? (
                        <p className="break-all text-xs text-muted-foreground">
                          {vendor.email}
                        </p>
                      ) : null}
                    </div>
                  </CommandItem>
                ))}
                {search.trim() &&
                !vendors.some(
                  (vendor) => vendor.name.toLowerCase() === term,
                ) ? (
                  <CommandItem
                    value="custom-vendor"
                    onSelect={() => select(search.trim(), null)}
                  >
                    <span className="break-words">
                      Use &quot;{search.trim()}&quot;
                    </span>
                  </CommandItem>
                ) : null}
                {name && !search.trim() ? (
                  <CommandItem
                    value="clear-vendor"
                    onSelect={() => select("", null)}
                  >
                    Clear vendor
                  </CommandItem>
                ) : null}
              </CommandGroup>
              {!matches.length ? (
                <p className="px-3 py-3 text-sm text-muted-foreground">
                  {isLoading
                    ? "Loading vendors..."
                    : "Type a name to use a custom vendor."}
                </p>
              ) : null}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {selected?.email ? (
        <p className="break-all text-xs text-muted-foreground">
          {selected.email}
        </p>
      ) : null}
    </div>
  );
}
