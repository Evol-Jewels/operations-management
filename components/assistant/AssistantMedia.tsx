import { FileAudio, FileVideo } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AssistantAttachment } from "@/types/assistant";

const KINDS = ["IMAGE", "VIDEO", "AUDIO"] as const;
const MEDIA_KEYS = ["media", "references", "attachments"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Uploaded files a tool input carries under its usual media keys. */
export function filesIn(value: unknown): AssistantAttachment[] {
  if (!isRecord(value)) return [];
  return MEDIA_KEYS.flatMap((key) => {
    const list = value[key];
    return Array.isArray(list) ? list : [];
  }).flatMap((item) => {
    if (!isRecord(item) || typeof item.url !== "string") return [];
    const type = KINDS.find((kind) => kind === String(item.type).toUpperCase());
    if (!type) return [];
    const name = typeof item.name === "string" ? item.name : undefined;
    return [{ type, url: item.url, name }];
  });
}

/** The list a tool input keeps under `key`, e.g. an enquiry's requirements. */
export function listIn(value: unknown, key: string): unknown[] {
  const list = isRecord(value) ? value[key] : null;
  return Array.isArray(list) ? list : [];
}

export function MediaPreview({
  file,
  className,
}: {
  file: AssistantAttachment;
  className?: string;
}) {
  if (file.type === "IMAGE")
    return (
      <a
        href={file.url}
        target="_blank"
        rel="noreferrer"
        title={file.name}
        className={cn(
          "block size-20 shrink-0 overflow-hidden rounded-lg border bg-muted transition-opacity hover:opacity-85",
          className,
        )}
      >
        {/* biome-ignore lint/performance/noImgElement: uploaded media URL */}
        <img
          src={file.url}
          alt={file.name ?? "Attachment"}
          className="size-full object-cover"
        />
      </a>
    );
  const Icon = file.type === "VIDEO" ? FileVideo : FileAudio;
  return (
    <a
      href={file.url}
      target="_blank"
      rel="noreferrer"
      className="flex h-10 max-w-48 items-center gap-2 rounded-lg border bg-background px-2.5 text-xs transition-colors hover:bg-muted"
    >
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <span className="truncate">{file.name ?? file.type.toLowerCase()}</span>
    </a>
  );
}
