"use client";

import {
  ArrowUp,
  FileAudio,
  FileSpreadsheet,
  FileText,
  FileVideo,
  LoaderCircle,
  MapPinned,
  Paperclip,
  Square,
  X,
} from "lucide-react";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DOCUMENT_ACCEPT,
  isDocumentFile,
  uploadAssistantAttachment,
} from "@/lib/assistantApi";
import { cn } from "@/lib/utils";
import type { AssistantAttachment } from "@/types/assistant";

type Upload = {
  key: string;
  name: string;
  kind: "IMAGE" | "VIDEO" | "AUDIO" | "DOCUMENT";
  preview?: string;
  attachment?: AssistantAttachment;
  failed?: boolean;
};

export type ComposerHandle = {
  focus: () => void;
  setDraft: (text: string) => void;
};

const MAX_FILES = 8;

function kindOf(file: File): Upload["kind"] | null {
  if (isDocumentFile(file)) return "DOCUMENT";
  if (file.type.startsWith("image/")) return "IMAGE";
  if (file.type.startsWith("video/")) return "VIDEO";
  if (file.type.startsWith("audio/")) return "AUDIO";
  return null;
}

export const AssistantComposer = forwardRef<
  ComposerHandle,
  {
    busy: boolean;
    disabled?: boolean;
    placeholder?: string;
    contextLabel?: string | null;
    compact?: boolean;
    onSend: (
      text: string,
      attachments: AssistantAttachment[],
    ) => Promise<boolean>;
    onStop: () => void;
  }
>(function AssistantComposer(
  { busy, disabled, placeholder, contextLabel, compact, onSend, onStop },
  ref,
) {
  const [draft, setDraft] = useState("");
  const [uploads, setUploads] = useState<Upload[]>([]);
  const input = useRef<HTMLTextAreaElement>(null);
  const picker = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => input.current?.focus(),
    setDraft: (text: string) => {
      setDraft(text);
      requestAnimationFrame(() => input.current?.focus());
    },
  }));

  const uploading = uploads.some(
    (upload) => !upload.attachment && !upload.failed,
  );
  const ready = uploads.filter((upload) => upload.attachment);
  const canSend =
    !busy &&
    !disabled &&
    !uploading &&
    (draft.trim().length > 0 || ready.length > 0);

  const addFiles = (files: File[]) => {
    const room = MAX_FILES - uploads.length;
    if (room <= 0) {
      toast.error(`You can attach up to ${MAX_FILES} files.`);
      return;
    }
    for (const file of files.slice(0, room)) {
      const kind = kindOf(file);
      if (!kind) {
        toast.error(`${file.name} is not an image, video or audio file.`);
        continue;
      }
      const key = crypto.randomUUID();
      setUploads((current) => [
        ...current,
        {
          key,
          name: file.name,
          kind,
          preview: kind === "IMAGE" ? URL.createObjectURL(file) : undefined,
        },
      ]);
      uploadAssistantAttachment(file)
        .then((attachment) =>
          setUploads((current) =>
            current.map((item) =>
              item.key === key ? { ...item, attachment } : item,
            ),
          ),
        )
        .catch((error: unknown) => {
          toast.error(
            error instanceof Error ? error.message : "Upload failed.",
          );
          setUploads((current) =>
            current.map((item) =>
              item.key === key ? { ...item, failed: true } : item,
            ),
          );
        });
    }
  };

  const submit = async () => {
    if (!canSend) return;
    const text = draft.trim();
    const attachments = ready.flatMap((upload) =>
      upload.attachment ? [upload.attachment] : [],
    );
    const previous = uploads;
    setDraft("");
    setUploads([]);
    const sent = await onSend(text, attachments);
    if (!sent) {
      setDraft(text);
      setUploads(previous);
    } else
      for (const upload of previous)
        if (upload.preview) URL.revokeObjectURL(upload.preview);
    input.current?.focus();
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        addFiles([...event.dataTransfer.files]);
      }}
      className={cn(
        "rounded-2xl border bg-card shadow-sm transition-shadow focus-within:border-foreground/25 focus-within:shadow-md",
        compact ? "p-2" : "p-2.5",
      )}
    >
      {contextLabel && (
        <p className="mb-1.5 flex items-center gap-1.5 px-1.5 pt-0.5 text-[11px] text-muted-foreground">
          <MapPinned className="size-3" aria-hidden="true" />
          Using this page:{" "}
          <span className="font-medium text-foreground/80">{contextLabel}</span>
        </p>
      )}
      {uploads.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2 px-1 pt-1">
          {uploads.map((upload) => (
            <div
              key={upload.key}
              className={cn(
                "group relative flex h-14 items-center justify-center overflow-hidden rounded-lg border bg-muted",
                upload.kind === "DOCUMENT"
                  ? "w-48 justify-start gap-2 px-3 pr-7"
                  : "w-14",
                upload.failed && "border-destructive/50",
              )}
              title={upload.name}
            >
              {upload.preview ? (
                // biome-ignore lint/performance/noImgElement: local object URL preview
                <img
                  src={upload.preview}
                  alt={upload.name}
                  className="size-full object-cover"
                />
              ) : upload.kind === "DOCUMENT" ? (
                <>
                  {/\.xls/i.test(upload.name) ? (
                    <FileSpreadsheet className="size-5 shrink-0 text-emerald-600" />
                  ) : (
                    <FileText className="size-5 shrink-0 text-red-600" />
                  )}
                  <span className="min-w-0 text-left text-xs">
                    <span className="block truncate font-medium">
                      {upload.name}
                    </span>
                    <span className="block text-muted-foreground">
                      {upload.failed
                        ? "Upload failed"
                        : upload.attachment
                          ? "Ready"
                          : "Uploading…"}
                    </span>
                  </span>
                </>
              ) : upload.kind === "VIDEO" ? (
                <FileVideo className="size-5 text-muted-foreground" />
              ) : (
                <FileAudio className="size-5 text-muted-foreground" />
              )}
              {!upload.attachment && !upload.failed && (
                <span className="absolute inset-0 flex items-center justify-center bg-background/60">
                  <LoaderCircle className="size-4 animate-spin" />
                </span>
              )}
              <button
                type="button"
                aria-label={`Remove ${upload.name}`}
                onClick={() =>
                  setUploads((current) =>
                    current.filter((item) => item.key !== upload.key),
                  )
                }
                className="absolute top-0.5 right-0.5 flex size-5 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      <label htmlFor="assistant-input" className="sr-only">
        Message the assistant
      </label>
      <textarea
        id="assistant-input"
        ref={input}
        value={draft}
        rows={1}
        maxLength={4000}
        disabled={disabled}
        placeholder={placeholder ?? "Ask anything or tell me what to do…"}
        onChange={(event) => setDraft(event.target.value)}
        onPaste={(event) => {
          const files = [...event.clipboardData.files];
          if (files.length) {
            event.preventDefault();
            addFiles(files);
          }
        }}
        onKeyDown={(event) => {
          if (
            event.key === "Enter" &&
            !event.shiftKey &&
            !event.nativeEvent.isComposing
          ) {
            event.preventDefault();
            void submit();
          }
        }}
        className="field-sizing-content max-h-40 min-h-11 w-full resize-none bg-transparent px-2 py-2 text-base outline-none placeholder:text-muted-foreground md:text-sm"
      />
      <div className="flex items-center justify-between gap-2">
        <input
          ref={picker}
          type="file"
          multiple
          accept={`image/*,video/*,audio/*,${DOCUMENT_ACCEPT}`}
          className="hidden"
          onChange={(event) => {
            addFiles([...(event.target.files ?? [])]);
            event.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1.5 rounded-lg text-muted-foreground"
          disabled={disabled || busy}
          onClick={() => picker.current?.click()}
        >
          <Paperclip className="size-4" />
          <span className={cn(compact && "sr-only")}>Attach</span>
        </Button>
        {busy ? (
          <Button
            type="button"
            size="icon-sm"
            className="rounded-lg"
            aria-label="Stop"
            onClick={onStop}
          >
            <Square className="size-3.5 fill-current" />
          </Button>
        ) : (
          <Button
            type="submit"
            size="icon-sm"
            className="rounded-lg"
            aria-label="Send"
            disabled={!canSend}
          >
            {uploading ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <ArrowUp className="size-4" />
            )}
          </Button>
        )}
      </div>
    </form>
  );
});
