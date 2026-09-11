"use client";

import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";

export function SoldProductsSearch({
  value,
  onSearch,
}: {
  value: string;
  onSearch: (value: string) => void;
}) {
  const [text, setText] = useState(value);
  const onSearchRef = useRef(onSearch);
  const submitted = useRef(value);
  useEffect(() => {
    if (value !== submitted.current) {
      submitted.current = value;
      setText(value);
    }
  }, [value]);
  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);
  useEffect(() => {
    if (text.trim() === value) return;
    const timer = setTimeout(() => {
      submitted.current = text.trim();
      onSearchRef.current(text.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [text, value]);
  return (
    <div className="relative min-w-0 flex-1 sm:w-60 sm:flex-none">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        aria-label="Search product name or SKU"
        placeholder="Search name or SKU"
        value={text}
        onChange={(event) => setText(event.target.value)}
        maxLength={255}
        className="h-9 pl-9"
      />
    </div>
  );
}
