"use client";

import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  CalendarClock,
  Gem,
  LoaderCircle,
  type LucideIcon,
  PackageCheck,
  PencilRuler,
  RotateCcw,
  Sparkles,
  UserPlus,
  Wrench,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { fetchAssistantCapabilities } from "@/lib/assistantApi";
import { cn } from "@/lib/utils";
import type { AssistantMessage, AssistantPageContext } from "@/types/assistant";
import { AssistantComposer, type ComposerHandle } from "./AssistantComposer";
import { AssistantMessageView } from "./AssistantMessages";
import { type AssistantChat, assistantKeys } from "./useAssistantChat";

type Suggestion = {
  icon: LucideIcon;
  title: string;
  prompt: string;
  tool: string;
};

// Ordered by usefulness; only those the user's role can run are shown.
const SUGGESTIONS: Suggestion[] = [
  {
    icon: PencilRuler,
    title: "Create an enquiry",
    prompt: "I want to create a new enquiry",
    tool: "create_enquiry",
  },
  {
    icon: CalendarClock,
    title: "What's overdue?",
    prompt: "Which orders are overdue, and which are due in the next 7 days?",
    tool: "search_orders",
  },
  {
    icon: PackageCheck,
    title: "Move an order forward",
    prompt: "I need to update an order's status",
    tool: "update_order_status",
  },
  {
    icon: Gem,
    title: "Find stock",
    prompt: "Show available 18K rings under ₹60,000",
    tool: "search_inventory",
  },
  {
    icon: BarChart3,
    title: "How are sales this month?",
    prompt: "How are sales this month? Who is leading?",
    tool: "get_sales_analytics",
  },
  {
    icon: BarChart3,
    title: "How am I doing?",
    prompt: "How am I doing against my target this month?",
    tool: "get_sales_performance",
  },
  {
    icon: Wrench,
    title: "Log a repair",
    prompt: "I need to log a repair for a customer",
    tool: "create_repair",
  },
  {
    icon: UserPlus,
    title: "Invite a teammate",
    prompt: "Invite a new team member",
    tool: "invite_team_member",
  },
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
  ).slice(0, compact ? 4 : 6);
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-10 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-2xl border bg-card shadow-xs">
        <Sparkles className="size-5" strokeWidth={1.5} />
      </div>
      <h2
        className={cn(
          "font-semibold tracking-tight",
          compact ? "text-lg" : "text-2xl",
        )}
      >
        What should we get done?
      </h2>
      <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
        Look things up or take action across enquiries, orders, repairs,
        inventory and more. I'll ask for anything I need and confirm before
        changing data.
      </p>
      {picks.length > 0 && (
        <div
          className={cn(
            "mt-6 grid w-full max-w-xl gap-2 text-left",
            !compact && "sm:grid-cols-2",
          )}
        >
          {picks.map((item) => (
            <button
              key={item.title}
              type="button"
              onClick={() => onPick(item.prompt)}
              className="group flex items-start gap-3 rounded-xl border bg-card px-3.5 py-3 text-left shadow-xs transition-colors hover:border-foreground/20 hover:bg-muted/40"
            >
              <item.icon className="mt-0.5 size-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
              <span className="min-w-0">
                <span className="block text-sm font-medium">{item.title}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {item.prompt}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
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
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
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
              compact ? "px-4" : "max-w-3xl px-2 sm:px-4",
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
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-foreground/40" />
                  <span className="relative inline-flex size-2 rounded-full bg-foreground/70" />
                </span>
                {status ?? "Finishing the previous request…"}
              </output>
            )}
          </div>
        )}
      </div>
      <div
        className={cn(
          "shrink-0 space-y-2 pt-2",
          compact ? "px-3 pb-3" : "mx-auto w-full max-w-3xl px-2 pb-1 sm:px-4",
        )}
      >
        {chat.error && (
          <div
            role="alert"
            className="flex items-center justify-between gap-3 rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          >
            <p>{chat.error}</p>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Reload"
              onClick={chat.reload}
            >
              <RotateCcw className="size-4" />
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
              : "Ask anything or tell me what to do…"
          }
          onSend={(text, attachments) => {
            stick.current = true;
            return chat.sendMessage(text, attachments, context);
          }}
          onStop={chat.stop}
        />
        {!compact && (
          <p className="text-center text-[11px] text-muted-foreground">
            The assistant acts with your permissions and always asks before
            changing anything.
          </p>
        )}
      </div>
    </div>
  );
}
