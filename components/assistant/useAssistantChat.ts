"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  createAssistantThread,
  fetchAssistantThread,
  fetchAssistantThreads,
  streamAssistantTurn,
} from "@/lib/assistantApi";
import { getSessionRole } from "@/lib/auth";
import { authClient } from "@/lib/auth-client";
import type {
  AssistantAnswer,
  AssistantAttachment,
  AssistantMessage,
  AssistantPageContext,
  AssistantSendInput,
  AssistantStreamEvent,
  AssistantThread,
  AssistantToolPart,
} from "@/types/assistant";

export const assistantKeys = {
  all: ["assistant"] as const,
  threads: (scope: string) => ["assistant", "threads", scope] as const,
  thread: (scope: string, id: string | null) =>
    ["assistant", "thread", scope, id] as const,
  capabilities: (scope: string) =>
    ["assistant", "capabilities", scope] as const,
};

function updateTool(
  messages: AssistantMessage[],
  id: string,
  update: (part: AssistantToolPart) => AssistantToolPart,
) {
  let found = false;
  const next = messages.map((message) => {
    if (message.role !== "assistant") return message;
    if (!message.parts.some((part) => part.type === "tool" && part.id === id))
      return message;
    found = true;
    return {
      ...message,
      parts: message.parts.map((part) =>
        part.type === "tool" && part.id === id ? update(part) : part,
      ),
    };
  });
  return { next, found };
}

/** Applies one stream event to the optimistic transcript. */
export function applyStreamEvent(
  messages: AssistantMessage[],
  event: AssistantStreamEvent,
): AssistantMessage[] {
  const last = messages.at(-1);
  const withAssistant = (
    change: (
      message: Extract<AssistantMessage, { role: "assistant" }>,
    ) => AssistantMessage,
  ) => {
    if (last?.role === "assistant")
      return [...messages.slice(0, -1), change(last)];
    return [
      ...messages,
      change({
        id: crypto.randomUUID(),
        role: "assistant",
        parts: [],
        createdAt: new Date().toISOString(),
      }),
    ];
  };
  if (event.type === "text")
    return withAssistant((message) => {
      const tail = message.parts.at(-1);
      return tail?.type === "text"
        ? {
            ...message,
            parts: [
              ...message.parts.slice(0, -1),
              { type: "text", text: tail.text + event.delta },
            ],
          }
        : {
            ...message,
            parts: [...message.parts, { type: "text", text: event.delta }],
          };
    });
  if (event.type === "tool_start")
    return withAssistant((message) => ({
      ...message,
      parts: [
        ...message.parts,
        {
          type: "tool",
          id: event.id,
          name: event.name,
          label: event.label,
          status: "running",
        },
      ],
    }));
  if (event.type === "tool_end") {
    const patch = (part: AssistantToolPart): AssistantToolPart => ({
      ...part,
      status: event.status,
      summary: event.summary ?? part.summary,
      error: event.error,
      card: event.card ?? part.card,
      interaction: event.interaction ?? part.interaction,
    });
    const { next, found } = updateTool(messages, event.id, patch);
    if (found) return next;
    return withAssistant((message) => ({
      ...message,
      parts: [
        ...message.parts,
        patch({
          type: "tool",
          id: event.id,
          name: event.name,
          label: event.name.replaceAll("_", " "),
          status: event.status,
        }),
      ],
    }));
  }
  return messages;
}

export function latestPendingInteraction(messages: AssistantMessage[]) {
  for (let index = messages.length - 1; index >= 0; index--) {
    const message = messages[index];
    if (message.role === "user") return null;
    for (const part of [...message.parts].reverse())
      if (part.type === "tool" && part.interaction?.status === "pending")
        return part.id;
  }
  return null;
}

type Options = {
  /** Keep the open thread in the page URL (?thread=) — the full-page view does. */
  syncUrl?: boolean;
  initialThreadId?: string | null;
};

export function useAssistantChat({
  syncUrl = false,
  initialThreadId,
}: Options) {
  const { data: auth } = authClient.useSession();
  const queryClient = useQueryClient();
  const scope = `${auth?.user.id ?? ""}:${getSessionRole(auth)}`;
  const [threadId, setThreadId] = useState<string | null>(
    initialThreadId ?? null,
  );
  const [live, setLive] = useState<AssistantMessage[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [resolving, setResolving] = useState<string | null>(null);
  const [error, setError] = useState("");
  const request = useRef<AbortController | null>(null);
  const busyRef = useRef(false);

  const threads = useQuery({
    queryKey: assistantKeys.threads(scope),
    queryFn: fetchAssistantThreads,
    enabled: Boolean(auth),
  });
  const thread = useQuery({
    queryKey: assistantKeys.thread(scope, threadId),
    queryFn: () => fetchAssistantThread(threadId as string),
    enabled: Boolean(auth && threadId),
    refetchInterval: (query) => (query.state.data?.isRunning ? 2000 : false),
  });

  useEffect(() => () => request.current?.abort(), []);

  const writeUrl = useCallback(
    (id: string | null) => {
      if (!syncUrl) return;
      const url = new URL(window.location.href);
      if (id) url.searchParams.set("thread", id);
      else url.searchParams.delete("thread");
      window.history.replaceState(null, "", url);
    },
    [syncUrl],
  );

  const select = (id: string | null) => {
    if (busyRef.current) return;
    setThreadId(id);
    setLive(null);
    setError("");
    writeUrl(id);
  };

  const send = async (input: AssistantSendInput) => {
    if (busyRef.current || thread.data?.isRunning) return false;
    busyRef.current = true;
    setBusy(true);
    setError("");
    const controller = new AbortController();
    request.current = controller;
    const base = thread.data?.messages ?? [];
    let id = threadId;
    if (input.type === "message") {
      setLive([
        ...base,
        {
          id: crypto.randomUUID(),
          role: "user",
          text: input.text,
          attachments: input.attachments?.length
            ? input.attachments
            : undefined,
          context: input.context,
          createdAt: new Date().toISOString(),
        },
      ]);
    } else {
      setResolving(input.toolCallId);
      setLive(base);
    }
    let wroteData = false;
    try {
      if (!id) {
        const created = await createAssistantThread();
        id = created.id;
        setThreadId(id);
        writeUrl(id);
      }
      const activeId = id;
      await streamAssistantTurn(activeId, input, controller.signal, (event) => {
        if (event.type === "error") {
          setError(event.message);
          return;
        }
        if (
          event.type === "tool_end" &&
          event.interaction?.kind === "confirm" &&
          event.interaction.status === "confirmed"
        )
          wroteData = true;
        if (
          event.type === "tool_end" &&
          input.type !== "message" &&
          event.id === input.toolCallId
        )
          setResolving(null);
        if (event.type === "done") {
          queryClient.setQueryData<AssistantThread>(
            assistantKeys.thread(scope, activeId),
            {
              id: activeId,
              title: event.title,
              messages: event.messages,
              pendingToolCallId: latestPendingInteraction(event.messages),
              isRunning: false,
            },
          );
          setLive(null);
          return;
        }
        setLive((current) => applyStreamEvent(current ?? base, event));
      });
      return true;
    } catch (cause) {
      if (!controller.signal.aborted)
        setError(
          cause instanceof Error
            ? cause.message
            : "Unable to reach the assistant. Please try again.",
        );
      return false;
    } finally {
      if (wroteData)
        void queryClient.invalidateQueries({
          predicate: (query) => query.queryKey[0] !== "assistant",
        });
      void queryClient.invalidateQueries({
        queryKey: assistantKeys.threads(scope),
      });
      if (id)
        await queryClient.invalidateQueries({
          queryKey: assistantKeys.thread(scope, id),
        });
      setLive(null);
      setResolving(null);
      busyRef.current = false;
      setBusy(false);
      request.current = null;
    }
  };

  const messages = live ?? thread.data?.messages ?? [];
  const pendingId = busy ? null : latestPendingInteraction(messages);

  return {
    scope,
    threadId,
    threads,
    thread,
    messages,
    busy,
    isRunningElsewhere: Boolean(thread.data?.isRunning) && !busy,
    resolving,
    pendingId,
    error,
    clearError: () => setError(""),
    select,
    sendMessage: (
      text: string,
      attachments: AssistantAttachment[],
      context?: AssistantPageContext,
    ) => send({ type: "message", text, attachments, context }),
    answer: (toolCallId: string, answers: Record<string, AssistantAnswer>) =>
      send({ type: "answer", toolCallId, answers }),
    confirm: (toolCallId: string, approved: boolean) =>
      send({ type: "confirm", toolCallId, approved }),
    stop: () => request.current?.abort(),
    reload: () => {
      setError("");
      void threads.refetch();
      if (threadId) void thread.refetch();
    },
  };
}

export type AssistantChat = ReturnType<typeof useAssistantChat>;
