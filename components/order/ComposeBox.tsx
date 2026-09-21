"use client";

import {
  AudioLines,
  ImageIcon,
  LoaderCircle,
  Paperclip,
  Send,
  Video,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const MAX_ATTACHMENTS = 8;
const ACCEPTED_MEDIA = "image/*,video/*,audio/*";

type PendingMedia = {
  id: string;
  file: File;
  previewUrl: string;
};

export type ComposeBoxSubmitData = {
  message: string;
  attachments: File[];
};

interface ComposeBoxProps {
  onSubmit: (data: ComposeBoxSubmitData) => void | Promise<void>;
  isSubmitting?: boolean;
}

function isSupportedMedia(file: File) {
  return /^(image|video|audio)\//.test(file.type);
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ComposeBox({ onSubmit, isSubmitting }: ComposeBoxProps) {
  const [message, setMessage] = useState("");
  const [media, setMedia] = useState<PendingMedia[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState("");
  const mediaRef = useRef(media);
  mediaRef.current = media;

  useEffect(
    () => () => {
      for (const item of mediaRef.current) URL.revokeObjectURL(item.previewUrl);
    },
    [],
  );

  const trimmedMessage = message.trim();
  const busy = Boolean(isSubmitting || isPosting);
  // Comments require text; attachments can be added alongside the message.
  const canSubmit = Boolean(trimmedMessage) && !busy;

  function addFiles(files: FileList | null) {
    if (!files?.length) return;
    setError("");
    const supported = Array.from(files).filter(isSupportedMedia);
    if (supported.length !== files.length) {
      setError("Only images, videos, and audio files can be attached.");
    }
    const available = Math.max(0, MAX_ATTACHMENTS - media.length);
    if (supported.length > available) {
      setError(`You can attach up to ${MAX_ATTACHMENTS} media files.`);
    }
    const next = supported.slice(0, available).map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setMedia((current) => [...current, ...next]);
  }

  function removeMedia(id: string) {
    setMedia((current) => {
      const removed = current.find((item) => item.id === id);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return current.filter((item) => item.id !== id);
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    setError("");
    setIsPosting(true);
    try {
      await onSubmit({
        message: trimmedMessage,
        attachments: media.map((item) => item.file),
      });
      for (const item of media) URL.revokeObjectURL(item.previewUrl);
      setMessage("");
      setMedia([]);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not post this update. Please try again.",
      );
    } finally {
      setIsPosting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="overflow-hidden rounded-xl border border-border bg-background transition-shadow focus-within:ring-2 focus-within:ring-ring/30"
    >
      <label htmlFor="activity-message" className="sr-only">
        Message
      </label>
      <Textarea
        id="activity-message"
        placeholder="Write a comment..."
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        rows={3}
        disabled={busy}
        className="min-h-24 resize-none rounded-none border-0 bg-transparent! text-sm shadow-none focus-visible:ring-0"
      />

      {media.length > 0 ? (
        <div className="grid grid-cols-2 gap-2 border-t border-border/70 px-3 py-3 sm:grid-cols-4">
          {media.map((item) => {
            const kind = item.file.type.split("/", 1)[0];
            const Icon =
              kind === "image"
                ? ImageIcon
                : kind === "video"
                  ? Video
                  : AudioLines;
            return (
              <div
                key={item.id}
                className="group relative min-w-0 overflow-hidden rounded-lg border border-border bg-muted/30"
              >
                {kind === "image" ? (
                  // biome-ignore lint/performance/noImgElement: local object URLs are not supported by next/image.
                  <img
                    src={item.previewUrl}
                    alt=""
                    className="aspect-[4/3] w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center bg-muted/50">
                    <Icon className="size-6 text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0 px-2 py-1.5 pr-8">
                  <p className="truncate text-[11px] font-medium">
                    {item.file.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatFileSize(item.file.size)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon-xs"
                  aria-label={`Remove ${item.file.name}`}
                  onClick={() => removeMedia(item.id)}
                  disabled={busy}
                  className="absolute top-1.5 right-1.5 size-7 rounded-full bg-background/90 shadow-sm"
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            );
          })}
        </div>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="border-t border-border/70 px-3 py-2 text-xs text-destructive"
        >
          {error}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-3 border-t border-border/70 p-2">
        <label
          className={cn(
            "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-within:ring-2 focus-within:ring-ring",
            busy && "pointer-events-none opacity-50",
          )}
        >
          <Paperclip className="size-4" />
          <span>
            {media.length
              ? `${media.length}/${MAX_ATTACHMENTS} attached`
              : "Add media"}
          </span>
          <input
            type="file"
            accept={ACCEPTED_MEDIA}
            multiple
            disabled={busy || media.length >= MAX_ATTACHMENTS}
            className="sr-only"
            onChange={(event) => {
              addFiles(event.target.files);
              event.target.value = "";
            }}
          />
        </label>
        <Button
          type="submit"
          size="sm"
          disabled={!canSubmit}
          className="min-h-11 gap-1.5 px-4 text-xs"
        >
          {busy ? (
            <LoaderCircle className="size-3.5 animate-spin motion-reduce:animate-none" />
          ) : (
            <Send className="size-3.5" />
          )}
          {busy ? "Posting..." : "Post update"}
        </Button>
      </div>
    </form>
  );
}
