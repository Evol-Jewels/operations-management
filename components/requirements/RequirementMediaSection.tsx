"use client";

import { Expand, ExternalLink, ImageIcon, Link2, Plus, Upload, X } from "lucide-react";
import { type ReactNode, useState } from "react";
import type { ProductReference } from "@/components/enquiries/enquiry-form-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionShell } from "./RequirementFields";
import { ImagePreviewDialog } from "./ImagePreviewDialog";
import {
  formatFileSize,
  generateRequirementId,
  isValidReferenceLink,
  normalizeReferenceLink,
} from "./requirement-form-utils";

export function RequirementMediaSection({
  references,
  onChange,
}: {
  references: ProductReference[];
  onChange: (references: ProductReference[]) => void;
}) {
  const imageReferences = references.filter((item) => item.type === "image");
  const linkReferences = references.filter((item) => item.type === "link");

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
    <SectionShell eyebrow="More references" title="Upload images or add links">
      <div className="space-y-4">
        <div className="grid gap-3 lg:grid-cols-[16rem_minmax(0,1fr)]">
          <ImageUploadBox onAddFiles={addFiles} />
          <LinkInput onAdd={addLinks} />
        </div>

        {references.length > 0 ? (
          <div className="space-y-4">
            {imageReferences.length > 0 ? (
              <ReferenceGroup
                title={`Images (${imageReferences.length})`}
                icon={<ImageIcon className="size-3.5" />}
              >
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {imageReferences.map((reference) => (
                    <ImageReferenceCard
                      key={reference.id}
                      reference={reference}
                      onRemove={removeReference}
                    />
                  ))}
                </div>
              </ReferenceGroup>
            ) : null}

            {linkReferences.length > 0 ? (
              <ReferenceGroup
                title={`Reference links (${linkReferences.length})`}
                icon={<Link2 className="size-3.5" />}
              >
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {linkReferences.map((reference) => (
                    <LinkReferenceRow
                      key={reference.id}
                      reference={reference}
                      onRemove={removeReference}
                    />
                  ))}
                </div>
              </ReferenceGroup>
            ) : null}
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

function ImageUploadBox({
  onAddFiles,
}: {
  onAddFiles: (files: FileList | null) => void;
}) {
  return (
    <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/20 px-4 py-4 text-center transition-colors hover:border-primary/40 hover:bg-muted/30">
      <Upload className="size-5 text-muted-foreground" />
      <span className="text-sm font-medium text-foreground">Upload images</span>
      <span className="text-xs leading-5 text-muted-foreground">
        Select one or more image files
      </span>
      <input
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => {
          onAddFiles(event.target.files);
          event.target.value = "";
        }}
      />
    </label>
  );
}

function LinkInput({ onAdd }: { onAdd: (value: string) => void }) {
  const [value, setValue] = useState("");

  function submitLinks() {
    onAdd(value);
    setValue("");
  }

  return (
    <div className="space-y-2 rounded-lg border border-border p-3">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Link2 className="size-4 text-muted-foreground" />
        Add reference links
      </div>
      <div className="flex gap-2">
        <Input
          value={value}
          placeholder="Paste a reference link"
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              submitLinks();
            }
          }}
          className="h-10 flex-1"
        />
        <Button
          type="button"
          variant="outline"
          onClick={submitLinks}
          disabled={!value.trim()}
        >
          <Plus className="size-3.5" />
          Add link
        </Button>
      </div>
    </div>
  );
}

function ReferenceGroup({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {icon}
        <span>{title}</span>
      </div>
      {children}
    </div>
  );
}

function ImageReferenceCard({
  reference,
  onRemove,
}: {
  reference: ProductReference;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="group relative w-36 shrink-0 overflow-hidden rounded-lg border border-border bg-background">
      <ImagePreviewDialog src={reference.url} alt={reference.name}>
        <button
          type="button"
          aria-label={`View ${reference.name} in detail`}
          className="group/preview relative block aspect-square w-full cursor-zoom-in overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        >
          {/* biome-ignore lint/performance/noImgElement: local preview URLs cannot use next/image. */}
          <img
            src={reference.url}
            alt=""
            className="size-full object-cover"
          />
          <span className="absolute inset-0 flex items-end bg-black/0 p-2 text-white opacity-0 transition-all group-hover/preview:bg-black/25 group-hover/preview:opacity-100 group-focus-visible/preview:bg-black/25 group-focus-visible/preview:opacity-100">
            <Expand className="size-4" />
          </span>
        </button>
      </ImagePreviewDialog>
      <div className="border-t border-border px-2 py-1.5">
        <p className="truncate text-xs font-medium text-foreground">
          {reference.name}
        </p>
        <p className="text-[10px] text-muted-foreground">
          {formatFileSize(reference.size)}
        </p>
      </div>
      <Button
        type="button"
        variant="secondary"
        size="icon-xs"
        onClick={() => onRemove(reference.id)}
        aria-label="Remove image reference"
        className="absolute top-1.5 right-1.5 opacity-90 hover:text-destructive"
      >
        <X className="size-3.5" />
      </Button>
    </div>
  );
}

function LinkReferenceRow({
  reference,
  onRemove,
}: {
  reference: ProductReference;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="flex w-72 shrink-0 items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <Link2 className="size-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-foreground">
          {reference.name}
        </p>
      </div>
      <Button
        asChild
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label="Open link reference"
        className="text-muted-foreground hover:text-foreground"
      >
        <a href={reference.url} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="size-3.5" />
        </a>
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onClick={() => onRemove(reference.id)}
        aria-label="Remove link reference"
        className="text-muted-foreground hover:text-destructive"
      >
        <X className="size-3.5" />
      </Button>
    </div>
  );
}
