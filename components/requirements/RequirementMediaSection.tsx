"use client";

import { ImageIcon, Link2, Upload, X } from "lucide-react";
import type { KeyboardEventHandler } from "react";
import type { ProductReference } from "@/components/enquiries/enquiry-form-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionShell } from "./RequirementFields";
import { formatFileSize, generateRequirementId, isValidReferenceLink, normalizeReferenceLink } from "./requirement-form-utils";

export function RequirementMediaSection({
  references,
  onChange,
}: {
  references: ProductReference[];
  onChange: (references: ProductReference[]) => void;
}) {
  function addLinks(rawValue: string) {
    const links = rawValue
      .split(/[\n,]+/)
      .map((item) => normalizeReferenceLink(item))
      .filter(Boolean);
    const validLinks = links.filter(isValidReferenceLink);
    if (!validLinks.length) return;

    onChange([
      ...references,
      ...validLinks.map((link) => ({
        id: generateRequirementId(),
        type: "link" as const,
        url: link,
        name: link,
      })),
    ]);
  }

  function addFiles(files: FileList | null) {
    if (!files?.length) return;

    const next: ProductReference[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      next.push({
        id: generateRequirementId(),
        type: "image",
        url: URL.createObjectURL(file),
        name: file.name,
        mimeType: file.type,
        size: file.size,
        file,
      });
    }
    if (next.length) onChange([...references, ...next]);
  }

  function removeReference(id: string) {
    const ref = references.find((item) => item.id === id);
    if (ref?.type !== "link" && ref?.url.startsWith("blob:")) {
      URL.revokeObjectURL(ref.url);
    }
    onChange(references.filter((item) => item.id !== id));
  }

  return (
    <SectionShell eyebrow="References" title="Images and inspiration links">
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_10rem]">
          <LinkInput onAdd={addLinks} />
          <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/20 px-4 py-3 text-center transition-colors hover:border-primary/40 hover:bg-muted/30">
            <Upload className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">
              Upload images
            </span>
            <span className="text-xs text-muted-foreground">Multiple files</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(event) => {
                addFiles(event.target.files);
                event.target.value = "";
              }}
            />
          </label>
        </div>

        {references.length > 0 ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {references.map((reference) => (
              <div
                key={reference.id}
                className="flex min-w-0 items-center gap-2 rounded-lg border border-border bg-background px-3 py-2"
              >
                {reference.type === "image" ? (
                  // biome-ignore lint/performance/noImgElement: local preview URLs cannot use next/image.
                  <img
                    src={reference.url}
                    alt={reference.name}
                    className="size-10 rounded-md border border-border object-cover"
                  />
                ) : (
                  <div className="flex size-10 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground">
                    <Link2 className="size-4" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-foreground">
                    {reference.name}
                  </p>
                  <p className="truncate text-[10px] text-muted-foreground">
                    {reference.type === "link"
                      ? "Reference link"
                      : formatFileSize(reference.size)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => removeReference(reference.id)}
                  aria-label="Remove reference"
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-3 text-sm text-muted-foreground">
            <ImageIcon className="size-4" />
            Add images or links for this requirement.
          </div>
        )}
      </div>
    </SectionShell>
  );
}

function LinkInput({ onAdd }: { onAdd: (value: string) => void }) {
  const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    const value = event.currentTarget.value;
    onAdd(value);
    event.currentTarget.value = "";
  };

  return (
    <div className="relative">
      <Link2 className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Paste link and press Enter"
        className="h-10 pl-9"
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}
