"use client";

import { Check, ChevronsUpDown, Diamond } from "lucide-react";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface StoneTypeOption {
  value: string;
  label: string;
  searchText?: string;
  category?: string;
  metadata?: string;
}

interface StoneTypeComboboxProps {
  options: readonly StoneTypeOption[];
  value?: string;
  onValueChange: (value: string) => void;
  showMetadata?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  loading?: boolean;
  className?: string;
}

export function StoneTypeCombobox({
  options,
  value,
  onValueChange,
  showMetadata = false,
  placeholder = "Select stone type...",
  searchPlaceholder = "Search stone shape or type...",
  emptyMessage = "No stone types found.",
  loading = false,
  className,
}: StoneTypeComboboxProps) {
  const [open, setOpen] = useState(false);
  const listId = useId();
  const selectedStone = options.find((stone) => stone.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" role="combobox" aria-expanded={open} aria-controls={listId}
          className={cn("h-9 w-full cursor-pointer justify-between gap-2 px-3 text-sm font-normal", className)}>
          <span className="flex min-w-0 items-center gap-2">
            <StoneIcon category={selectedStone?.category} />
            <span className={cn("truncate", !selectedStone && "text-muted-foreground")}>
              {selectedStone?.label ?? placeholder}
            </span>
          </span>
          <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[max(var(--radix-popover-trigger-width),18rem)] max-w-[calc(100vw-2rem)] p-0">
        <Command
          filter={(itemValue, search) =>
            itemValue.toLowerCase().includes(search.trim().toLowerCase())
              ? 1
              : 0
          }
        >
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList id={listId}>
            <CommandEmpty>{loading ? "Loading stone types..." : emptyMessage}</CommandEmpty>
            <CommandGroup heading="Stone types">
              {options.map((option) => (
                <CommandItem key={option.value}
                  value={`${option.label} ${option.value} ${option.category ?? ""} ${option.searchText ?? ""}`}
                  onSelect={() => { onValueChange(option.value); setOpen(false); }}
                  className="cursor-pointer items-start gap-2 py-2">
                  <StoneIcon category={option.category} className="mt-0.5" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{option.label}</span>
                    {showMetadata && option.metadata ? (
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">{option.metadata}</span>
                    ) : null}
                  </span>
                  <Check className={cn("mt-0.5 size-4 shrink-0", value === option.value ? "opacity-100" : "opacity-0")} />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function StoneIcon({ category, className }: { category?: string; className?: string }) {
  return category?.toLowerCase() === "gemstone" ? (
    <span aria-hidden="true" className={cn("size-3 shrink-0 rounded-full bg-muted-foreground/40", className)} />
  ) : (
    <Diamond aria-hidden="true" className={cn("size-3.5 shrink-0 text-muted-foreground", className)} />
  );
}
