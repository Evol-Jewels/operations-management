"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  createAgentSession,
  fetchAgentConversation,
  fetchAgentSessions,
  sendAgentMessage,
} from "@/lib/agentApi";
import { getSessionRole } from "@/lib/auth";
import { authClient } from "@/lib/auth-client";
import type { AgentConversation, AgentMessage } from "@/types/agent-api";

export function useInventoryChat() {
  const searchParams = useSearchParams();
  const { data: auth } = authClient.useSession();
  const queryClient = useQueryClient();
  const [sessionId, setSessionId] = useState<string | null>(
    searchParams.get("session"),
  );
  const [liveMessages, setLiveMessages] = useState<AgentMessage[] | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const request = useRef<AbortController | null>(null);
  const sending = useRef(false);
  const scope = [auth?.user.id, getSessionRole(auth)];
  const listKey = ["agent-sessions", ...scope];
  const conversationKey = (id: string | null) => [
    "agent-conversation",
    ...scope,
    id,
  ];
  const sessions = useQuery({
    queryKey: listKey,
    queryFn: fetchAgentSessions,
    enabled: Boolean(auth),
  });
  const conversation = useQuery({
    queryKey: conversationKey(sessionId),
    queryFn: () => fetchAgentConversation(sessionId as string),
    enabled: Boolean(auth && sessionId),
    refetchInterval: (query) => (query.state.data?.isRunning ? 2000 : false),
  });
  useEffect(() => () => request.current?.abort(), []);

  const select = (id: string | null) => {
    if (sending.current) return;
    setSessionId(id);
    setLiveMessages(null);
    setError("");
    setStatus("");
    window.history.replaceState(
      null,
      "",
      id ? `/assistant?session=${encodeURIComponent(id)}` : "/assistant",
    );
  };

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || sending.current || conversation.data?.isRunning)
      return false;
    sending.current = true;
    setIsSending(true);
    setError("");
    setStatus("Searching inventory…");
    const controller = new AbortController();
    request.current = controller;
    let id = sessionId;
    const previous = conversation.data?.messages ?? [];
    setLiveMessages([
      ...previous,
      { id: crypto.randomUUID(), role: "user", text: message },
    ]);
    try {
      if (!id) {
        const created = await createAgentSession();
        id = created.id;
        setSessionId(id);
        window.history.replaceState(
          null,
          "",
          `/assistant?session=${encodeURIComponent(id)}`,
        );
      }
      const activeId = id;
      await sendAgentMessage(id, message, controller.signal, (event) => {
        if (event.type === "text") {
          setStatus("Replying…");
          setLiveMessages((current) => {
            const items = current ?? [];
            const last = items.at(-1);
            return last?.role === "assistant"
              ? [
                  ...items.slice(0, -1),
                  { ...last, text: last.text + event.delta },
                ]
              : [
                  ...items,
                  {
                    id: crypto.randomUUID(),
                    role: "assistant",
                    text: event.delta,
                  },
                ];
          });
        } else if (event.type === "tool") {
          setStatus(
            event.name === "get_inventory_item"
              ? "Looking up barcode…"
              : "Searching inventory…",
          );
        } else if (event.type === "inventory") {
          setLiveMessages((current) => [
            ...(current ?? []),
            {
              id: crypto.randomUUID(),
              role: "tool",
              text: "",
              inventory: event.result,
            },
          ]);
        } else if (event.type === "done") {
          queryClient.setQueryData<AgentConversation>(
            conversationKey(activeId),
            {
              id: activeId,
              title: previous.length
                ? (conversation.data?.title ?? message)
                : message,
              messages: event.messages,
              isRunning: false,
            },
          );
          setLiveMessages(null);
        }
      });
      return true;
    } catch (cause) {
      if (!controller.signal.aborted)
        setError(
          cause instanceof Error
            ? cause.message
            : "Unable to reach the assistant. Please try again.",
        );
      else setStatus("Stopped");
      return false;
    } finally {
      await queryClient.invalidateQueries({ queryKey: listKey });
      if (id) {
        await queryClient.invalidateQueries({ queryKey: conversationKey(id) });
      }
      setLiveMessages(null);
      sending.current = false;
      setIsSending(false);
      request.current = null;
    }
  };

  return {
    sessionId,
    sessions,
    conversation,
    select,
    send,
    isSending,
    isBusy: isSending || Boolean(conversation.data?.isRunning),
    messages: liveMessages ?? conversation.data?.messages ?? [],
    error:
      error ||
      (conversation.error instanceof Error ? conversation.error.message : ""),
    status,
    stop: () => request.current?.abort(),
    reload: () => {
      setError("");
      if (sessionId) void conversation.refetch();
      void sessions.refetch();
    },
  };
}
