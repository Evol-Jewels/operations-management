"use client";

import { X } from "lucide-react";
import { type KeyboardEvent, useState } from "react";
import { Badge } from "@/components/ui/badge";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface EmailChipsInputProps {
  id: string;
  name: string;
  placeholder?: string;
  defaultEmails?: string[];
}

export function EmailChipsInput({
  id,
  name,
  placeholder,
  defaultEmails = [],
}: EmailChipsInputProps) {
  const [emails, setEmails] = useState<string[]>(defaultEmails);
  const [draft, setDraft] = useState("");
  const [isDraftInvalid, setIsDraftInvalid] = useState(false);

  function addEmails(value: string) {
    const parts = value.split(/[\s,;]+/).filter(Boolean);
    const valid = parts.filter((part) => EMAIL_PATTERN.test(part));
    const invalid = parts.filter((part) => !EMAIL_PATTERN.test(part));

    setEmails((current) => [...new Set([...current, ...valid])]);
    setDraft(invalid.join(" "));
    setIsDraftInvalid(invalid.length > 0);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (["Enter", ",", ";", " "].includes(event.key)) {
      event.preventDefault();
      addEmails(draft);
      return;
    }

    if (event.key === "Backspace" && draft === "") {
      setEmails((current) => current.slice(0, -1));
    }
  }

  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5 py-2">
      {emails.map((email) => (
        <Badge
          key={email}
          variant="secondary"
          className="gap-1 pr-1 font-normal"
        >
          {email}
          <button
            type="button"
            onClick={() =>
              setEmails((current) => current.filter((item) => item !== email))
            }
            className="rounded-full p-0.5 hover:bg-foreground/10"
            aria-label={`Remove ${email}`}
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}
      <input
        id={id}
        value={draft}
        onChange={(event) => {
          setDraft(event.target.value);
          setIsDraftInvalid(false);
        }}
        onKeyDown={handleKeyDown}
        onBlur={() => addEmails(draft)}
        onPaste={(event) => {
          event.preventDefault();
          addEmails(`${draft} ${event.clipboardData.getData("text")}`);
        }}
        placeholder={emails.length === 0 ? placeholder : undefined}
        aria-invalid={isDraftInvalid}
        className="h-7 min-w-32 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground aria-invalid:text-destructive"
      />
      <input type="hidden" name={name} value={emails.join(",")} />
    </div>
  );
}
