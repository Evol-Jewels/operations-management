"use client";

import {
  Check,
  ChevronRight,
  CircleAlert,
  LoaderCircle,
  MapPinned,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import type {
  AssistantAnswer,
  AssistantMessage,
  AssistantToolPart,
} from "@/types/assistant";
import { AssistantCardView } from "./AssistantCards";
import { ConfirmationCard, QuestionForm } from "./AssistantInteractions";
import { MediaPreview } from "./AssistantMedia";

export function MarkdownText({ text }: { text: string }) {
  return (
    <div className="text-sm leading-7 text-foreground [&_a]:font-medium [&_a]:underline [&_a]:underline-offset-2 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.85em] [&_h1]:mt-3 [&_h1]:text-base [&_h1]:font-semibold [&_h2]:mt-3 [&_h2]:text-sm [&_h2]:font-semibold [&_h3]:mt-2 [&_h3]:font-semibold [&_li]:my-0.5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_strong]:font-semibold [&_table]:my-2 [&_table]:w-full [&_table]:text-xs [&_td]:border-b [&_td]:py-1 [&_td]:pr-3 [&_th]:border-b [&_th]:py-1 [&_th]:pr-3 [&_th]:text-left [&_th]:font-medium [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) =>
            href?.startsWith("/") ? (
              <Link href={href}>{children}</Link>
            ) : (
              <a href={href} target="_blank" rel="noreferrer">
                {children}
              </a>
            ),
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}

function ToolChip({
  part,
  expandable,
  expanded,
  onToggle,
}: {
  part: AssistantToolPart;
  expandable?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const running = part.status === "running";
  const failed = part.status === "error";
  const clickable = failed || expandable;
  return (
    <div className="text-xs">
      <button
        type="button"
        disabled={!clickable}
        aria-expanded={expandable ? expanded : undefined}
        onClick={() => (failed ? setOpen((value) => !value) : onToggle?.())}
        className={cn(
          "inline-flex max-w-full items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 text-muted-foreground",
          expandable && "cursor-pointer hover:bg-muted",
          failed &&
            "cursor-pointer border-red-500/25 text-red-600 dark:text-red-400",
        )}
      >
        {running ? (
          <LoaderCircle
            className="size-3 shrink-0 animate-spin"
            aria-hidden="true"
          />
        ) : failed ? (
          <CircleAlert className="size-3 shrink-0" aria-hidden="true" />
        ) : (
          <Check
            className="size-3 shrink-0 text-emerald-600 dark:text-emerald-400"
            aria-hidden="true"
          />
        )}
        <span className="truncate font-medium text-foreground/80">
          {part.label}
          {running ? "…" : ""}
        </span>
        {part.summary && !running && (
          <span className="truncate">· {part.summary}</span>
        )}
        {clickable && (
          <ChevronRight
            className={cn(
              "size-3 shrink-0 transition-transform",
              (failed ? open : expanded) && "rotate-90",
            )}
            aria-hidden="true"
          />
        )}
      </button>
      {failed && open && part.error && (
        <p className="mt-1.5 rounded-lg border border-red-500/20 bg-red-500/[0.04] px-3 py-2 whitespace-pre-wrap text-red-700 dark:text-red-300">
          {part.error}
        </p>
      )}
    </div>
  );
}

type Handlers = {
  pendingId: string | null;
  resolving: string | null;
  busy: boolean;
  onAnswer: (
    toolCallId: string,
    answers: Record<string, AssistantAnswer>,
  ) => void;
  onConfirm: (toolCallId: string, approved: boolean) => void;
};

function ToolPart({
  part,
  handlers,
  superseded,
}: {
  part: AssistantToolPart;
  handlers: Handlers;
  superseded?: boolean;
}) {
  // null follows the default; a click pins the user's choice.
  const [toggled, setToggled] = useState<boolean | null>(null);
  const expanded = toggled ?? !superseded;
  const interaction = part.interaction;
  const actionable = handlers.pendingId === part.id && !handlers.busy;
  const submitting = handlers.resolving === part.id;
  if (interaction?.kind === "question")
    return (
      <QuestionForm
        toolCallId={part.id}
        interaction={interaction}
        actionable={actionable || submitting}
        submitting={submitting}
        onSubmit={(answers) => handlers.onAnswer(part.id, answers)}
      />
    );
  if (interaction?.kind === "confirm")
    return (
      <ConfirmationCard
        interaction={interaction}
        actionable={actionable || submitting}
        submitting={submitting}
        onDecide={(approved) => handlers.onConfirm(part.id, approved)}
      />
    );
  return (
    <div className="space-y-2">
      <ToolChip
        part={part}
        expandable={Boolean(part.card && superseded)}
        expanded={expanded}
        onToggle={() => setToggled(!expanded)}
      />
      {part.card && expanded && <AssistantCardView card={part.card} />}
    </div>
  );
}

export function AssistantMessageView({
  message,
  handlers,
}: {
  message: AssistantMessage;
  handlers: Handlers;
}) {
  if (message.role === "user")
    return (
      <div className="flex flex-col items-end gap-1.5">
        {message.attachments?.length ? (
          <div className="flex flex-wrap justify-end gap-1.5">
            {message.attachments.map((file) => (
              <MediaPreview key={file.url} file={file} />
            ))}
          </div>
        ) : null}
        {message.text && (
          <div className="max-w-[85%] rounded-3xl rounded-br-lg bg-muted px-4 py-2.5 text-foreground">
            <span className="sr-only">You: </span>
            <p className="text-sm leading-6 break-words whitespace-pre-wrap">
              {message.text}
            </p>
          </div>
        )}
        {message.context && (
          <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <MapPinned className="size-3" aria-hidden="true" />
            from {message.context.title ?? message.context.path}
          </p>
        )}
      </div>
    );
  // Intermediate lookups collapse once a later step in the same reply
  // supersedes them (a form/confirmation, or a newer result from that tool).
  const superseded = new Set<string>();
  message.parts.forEach((part, index) => {
    if (part.type !== "tool" || !part.card || part.interaction) return;
    const later = message.parts.slice(index + 1);
    if (
      later.some(
        (next) =>
          next.type === "tool" &&
          (next.interaction || (next.card && next.name === part.name)),
      )
    )
      superseded.add(part.id);
  });
  return (
    <div className="space-y-3">
      <span className="sr-only">Assistant: </span>
      {message.parts.map((part, index) =>
        part.type === "text" ? (
          // biome-ignore lint/suspicious/noArrayIndexKey: parts are append-only within a message
          <MarkdownText key={`t${index}`} text={part.text} />
        ) : part.type === "notice" ? (
          <p
            // biome-ignore lint/suspicious/noArrayIndexKey: parts are append-only within a message
            key={`n${index}`}
            className={cn(
              "flex items-center gap-1.5 text-xs",
              part.tone === "error"
                ? "text-destructive"
                : "text-muted-foreground",
            )}
          >
            <CircleAlert className="size-3.5 shrink-0" aria-hidden="true" />
            {part.text}
          </p>
        ) : (
          <ToolPart
            key={part.id}
            part={part}
            handlers={handlers}
            superseded={superseded.has(part.id)}
          />
        ),
      )}
    </div>
  );
}

export type { Handlers as AssistantMessageHandlers };
