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
import type { VoiceEvent } from "@/types/agent-voice";

const toolStatuses: Record<string, string> = {
  search_inventory: "Searching inventory…",
  get_inventory_item: "Looking up barcode…",
  search_enquiries: "Looking up enquiries…",
  get_enquiry_details: "Looking up enquiry details…",
  search_orders: "Looking up orders…",
  get_order_details: "Looking up order details…",
  update_order_status: "Updating order…",
  update_enquiry: "Updating enquiry…",
  get_sales_analytics: "Checking sales analytics…",
  get_my_sales_analytics: "Checking your sales analytics…",
  get_sales_person_analytics: "Checking sales analytics…",
  get_leaderboard: "Checking the sales leaderboard…",
  get_product_analytics: "Checking inventory analytics…",
  search_users: "Finding team members…",
};

function statusForTool(name: string) {
  return toolStatuses[name] ?? "Working…";
}

function resultMessageFromEvent(
  event: Exclude<VoiceEvent["event"], { type: "user" }>,
): AgentMessage | null {
  if (
    event.type === "text" ||
    event.type === "tool" ||
    event.type === "done" ||
    event.type === "error"
  )
    return null;
  return {
    id: crypto.randomUUID(),
    role: "tool",
    text: "",
    [event.type]: event.result,
  } as AgentMessage;
}

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
  const [voiceActive, setVoiceActive] = useState(false);
  const voiceTurn = useRef<string | null>(null);
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
    refetchInterval: (query) =>
      query.state.data?.isRunning || voiceActive ? 2000 : false,
  });
  useEffect(() => () => request.current?.abort(), []);

  const select = (id: string | null) => {
    if (sending.current || voiceActive) return;
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

  const ensureSession = async () => {
    if (sessionId) return sessionId;
    const created = await createAgentSession();
    setSessionId(created.id);
    window.history.replaceState(
      null,
      "",
      `/assistant?session=${encodeURIComponent(created.id)}`,
    );
    void queryClient.invalidateQueries({ queryKey: listKey });
    return created.id;
  };

  const receiveVoiceEvent = ({ turnId, event }: VoiceEvent) => {
    if (event.type === "user") {
      voiceTurn.current = turnId;
      setError("");
      setStatus("Thinking…");
      setLiveMessages((current) => [
        ...(current ?? conversation.data?.messages ?? []),
        { id: turnId, role: "user", text: event.text },
      ]);
      return;
    }
    if (voiceTurn.current !== turnId) return;
    if (event.type === "tool") {
      setStatus(statusForTool(event.name));
    } else {
      const message = resultMessageFromEvent(event);
      if (message) setLiveMessages((current) => [...(current ?? []), message]);
    }
    if (event.type === "done") {
      if (sessionId)
        queryClient.setQueryData<AgentConversation>(
          conversationKey(sessionId),
          {
            id: sessionId,
            title: conversation.data?.title ?? "Voice conversation",
            messages: event.messages,
            isRunning: false,
          },
        );
      setLiveMessages(event.messages);
      setStatus("");
      void queryClient.invalidateQueries({ queryKey: listKey });
    } else if (event.type === "error") {
      setError(event.message);
      setStatus("");
    }
  };

  const send = async (text: string) => {
    const message = text.trim();
    if (
      !message ||
      voiceActive ||
      sending.current ||
      conversation.data?.isRunning
    )
      return false;
    sending.current = true;
    setIsSending(true);
    setError("");
    setStatus("Thinking…");
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
          setStatus(statusForTool(event.name));
        } else {
          const toolMessage = resultMessageFromEvent(event);
          if (toolMessage)
            setLiveMessages((current) => [...(current ?? []), toolMessage]);
          if (event.type === "done") {
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
    authScope: scope.join(":"),
    sessionId,
    ensureSession,
    receiveVoiceEvent,
    resyncVoice: async () => {
      if (!sessionId) return;
      const turn = voiceTurn.current;
      try {
        const saved = await fetchAgentConversation(sessionId);
        if (turn !== voiceTurn.current) return;
        queryClient.setQueryData(conversationKey(sessionId), saved);
        setLiveMessages(saved.messages);
        setStatus(saved.isRunning ? "Thinking…" : "");
      } catch {
        setError(
          "Unable to reload saved messages. Please try reloading the conversation.",
        );
      }
    },
    setVoiceActive: (active: boolean) => {
      setVoiceActive(active);
      if (!active) {
        voiceTurn.current = null;
        setLiveMessages(null);
        if (sessionId)
          void queryClient.invalidateQueries({
            queryKey: conversationKey(sessionId),
          });
        void queryClient.invalidateQueries({ queryKey: listKey });
      }
    },
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
