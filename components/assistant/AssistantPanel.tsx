"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, LoaderCircle, RotateCcw } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { fetchAssistantCapabilities } from "@/lib/assistantApi";
import { cn } from "@/lib/utils";
import type { AssistantMessage, AssistantPageContext } from "@/types/assistant";
import { AssistantComposer, type ComposerHandle } from "./AssistantComposer";
import { AssistantMessageView } from "./AssistantMessages";
import { EvolE } from "./EvolE";
import { type AssistantChat, assistantKeys } from "./useAssistantChat";

// Ordered by usefulness; only those the user's role can run are shown.
const SUGGESTIONS = [
  { prompt: "I want to create a new enquiry", tool: "create_enquiry" },
  {
    prompt: "Which orders are overdue, and which are due this week?",
    tool: "search_orders",
  },
  { prompt: "I need to update an order's status", tool: "update_order_status" },
  {
    prompt: "Show available 18K rings under ₹60,000",
    tool: "search_inventory",
  },
  {
    prompt: "How are sales this month? Who is leading?",
    tool: "get_sales_analytics",
  },
  {
    prompt: "How am I doing against my target this month?",
    tool: "get_sales_performance",
  },
  { prompt: "I need to log a repair for a customer", tool: "create_repair" },
  { prompt: "Invite a new team member", tool: "invite_team_member" },
];

function EmptyState({
  compact,
  onPick,
  tools,
}: {
  compact?: boolean;
  onPick: (prompt: string) => void;
  tools: Set<string>;
}) {
  const role = tools.has("get_sales_analytics");
  const picks = SUGGESTIONS.filter(
    (item) =>
      tools.has(item.tool) && !(item.tool === "get_sales_performance" && role),
  ).slice(0, compact ? 4 : 5);
  return (
    <div className="flex min-h-full flex-col justify-center px-5 py-10">
      <div className="mx-auto w-full max-w-xl">
        <div className="flex flex-col items-center text-center">
          <EvolE size={compact ? 56 : 72} className="text-foreground" />
          <h2
            className={cn(
              "mt-4 tracking-tight text-balance",
              compact ? "text-lg" : "text-2xl",
            )}
          >
            Get things done with <span className="font-semibold">Evol-E</span>
          </h2>
          <p className="mt-2 max-w-sm text-sm text-balance text-muted-foreground">
            Look up or update enquiries, orders, repairs and stock. I always
            check with you before changing anything.
          </p>
        </div>
        {picks.length > 0 && (
          <ul className={cn("space-y-0.5", compact ? "mt-6" : "mt-9")}>
            {picks.map((item) => (
              <li key={item.tool}>
                <button
                  type="button"
                  onClick={() => onPick(item.prompt)}
                  className="group flex w-full items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {item.prompt}
                  <ArrowUpRight className="size-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function statusLine(messages: AssistantMessage[]) {
  const last = messages.at(-1);
  if (!last || last.role === "user") return "Thinking…";
  const running = [...last.parts]
    .reverse()
    .find((part) => part.type === "tool" && part.status === "running");
  if (running?.type === "tool") return `${running.label}…`;
  return last.parts.at(-1)?.type === "text" ? null : "Thinking…";
}

export function AssistantPanel({
  chat,
  compact,
  context,
  contextLabel,
}: {
  chat: AssistantChat;
  compact?: boolean;
  context?: AssistantPageContext;
  contextLabel?: string | null;
}) {
  const feed = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  const composer = useRef<ComposerHandle>(null);
  const capabilities = useQuery({
    queryKey: assistantKeys.capabilities(chat.scope),
    queryFn: fetchAssistantCapabilities,
    staleTime: 5 * 60_000,
  });
  const tools = new Set(
    capabilities.data?.tools.map((tool) => tool.name) ?? [],
  );
  const { messages } = chat;
  const loading = Boolean(chat.threadId) && chat.thread.isLoading && !chat.busy;
  const status = chat.busy ? statusLine(messages) : null;

  useEffect(() => {
    if (feed.current && stick.current)
      feed.current.scrollTo({ top: feed.current.scrollHeight });
  });

  const threadId = chat.threadId;
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-run when the open thread changes
  useEffect(() => {
    stick.current = true;
    composer.current?.focus();
  }, [threadId]);

  const handlers = {
    pendingId: chat.pendingId,
    resolving: chat.resolving,
    busy: chat.busy,
    onAnswer: (id: string, answers: Parameters<AssistantChat["answer"]>[1]) => {
      stick.current = true;
      void chat.answer(id, answers);
    },
    onConfirm: (id: string, approved: boolean) => {
      stick.current = true;
      void chat.confirm(id, approved);
    },
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        ref={feed}
        role="log"
        aria-label="Assistant conversation"
        aria-live="polite"
        onScroll={() => {
          const el = feed.current;
          if (el)
            stick.current =
              el.scrollHeight - el.scrollTop - el.clientHeight < 120;
        }}
        className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain"
      >
        {loading ? (
          <div className="flex justify-center gap-2 py-16 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin" />
            Loading conversation…
          </div>
        ) : messages.length === 0 ? (
          <EmptyState
            compact={compact}
            tools={tools}
            onPick={(prompt) => {
              void chat.sendMessage(prompt, [], context);
            }}
          />
        ) : (
          <div
            className={cn(
              "mx-auto w-full space-y-6 py-6",
              compact ? "px-4" : "max-w-2xl px-4",
            )}
          >
            {messages.map((message) => (
              <AssistantMessageView
                key={message.id}
                message={message}
                handlers={handlers}
              />
            ))}
            {(status || chat.isRunningElsewhere) && (
              <output className="flex items-center gap-2 text-xs text-muted-foreground">
                <EvolE
                  size={26}
                  mood="thinking"
                  className="-ml-1 text-foreground"
                />
                {status ?? "Finishing the previous request…"}
              </output>
            )}
          </div>
        )}
      </div>
      <div
        className={cn(
          "shrink-0 space-y-2 pt-2",
          compact ? "px-3 pb-3" : "mx-auto w-full max-w-2xl px-4 pb-4",
        )}
      >
        {chat.error && (
          <div
            role="alert"
            className="flex items-center justify-between gap-3 rounded-xl bg-destructive/10 py-1.5 pr-1.5 pl-3.5 text-xs text-destructive"
          >
            <p>{chat.error}</p>
            <Button
              variant="ghost"
              size="xs"
              className="gap-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={chat.reload}
            >
              <RotateCcw className="size-3" />
              Retry
            </Button>
          </div>
        )}
        <AssistantComposer
          ref={composer}
          compact={compact}
          busy={chat.busy}
          disabled={chat.isRunningElsewhere}
          contextLabel={contextLabel}
          placeholder={
            chat.pendingId
              ? "Answer above, or type to change course…"
              : "Ask Evol-E anything, or tell it what to do…"
          }
          onSend={(text, attachments) => {
            stick.current = true;
            return chat.sendMessage(text, attachments, context);
          }}
          onStop={chat.stop}
        />
      </div>
    </div>
  );
}
