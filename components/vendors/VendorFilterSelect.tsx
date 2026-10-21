"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  getVendorFilterLabel,
  UNLINKED_VENDOR,
  type Vendor,
  type VendorFilter,
} from "@/lib/vendors";

export function VendorFilterSelect({
  id,
  value,
  vendors,
  isLoading,
  onChange,
  className,
}: {
  id?: string;
  value: VendorFilter;
  vendors: Vendor[];
  isLoading?: boolean;
  onChange: (value: VendorFilter) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const label = getVendorFilterLabel(value, vendors);

  function select(next: VendorFilter) {
    onChange(next);
    setOpen(false);
  }

  const option = (optionValue: VendorFilter, text: string) => (
    <CommandItem
      key={optionValue}
      value={`${optionValue} ${text}`}
      onSelect={() => select(optionValue)}
    >
      <Check
        aria-hidden="true"
        className={cn("size-4", value !== optionValue && "opacity-0")}
      />
      <span className="truncate">{text}</span>
    </CommandItem>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={`Vendor: ${label}`}
          className={cn(
            "h-10 w-full justify-between gap-2 px-3 font-normal",
            className,
          )}
        >
          <span className="truncate">{label}</span>
          <ChevronsUpDown
            aria-hidden="true"
            className="size-4 shrink-0 text-muted-foreground"
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] min-w-56 p-0"
      >
        <Command>
          <CommandInput placeholder="Search vendors…" maxLength={255} />
          <CommandList>
            <CommandEmpty>
              {isLoading ? "Loading vendors…" : "No vendors found."}
            </CommandEmpty>
            <CommandGroup>
              {option("ALL", "All vendors")}
              {option(UNLINKED_VENDOR, "No linked vendor")}
            </CommandGroup>
            {vendors.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Vendors">
                  {vendors.map((vendor) =>
                    option(vendor.vendorId, vendor.name),
                  )}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
