import { apiFetch, buildUrl } from "@/lib/apiClient";
import type { VoiceConnection } from "@/types/agent-voice";
import type {
  AgentConversation,
  AgentSessionSummary,
  AgentStreamEvent,
} from "@/types/agent-api";

const path = "api/v1/agent/sessions";

export function startAgentVoice(id: string, signal: AbortSignal) {
  return apiFetch<VoiceConnection>(
    buildUrl(`${path}/${encodeURIComponent(id)}/voice`),
    { method: "POST", signal },
  );
}

export function endAgentVoice(id: string, room: string) {
  return apiFetch<{ ended: boolean }>(
    buildUrl(`${path}/${encodeURIComponent(id)}/voice/end`),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ room }),
      keepalive: true,
    },
  );
}

export function fetchAgentSessions() {
  return apiFetch<AgentSessionSummary[]>(buildUrl(path));
}

export function createAgentSession() {
  return apiFetch<AgentSessionSummary>(buildUrl(path), { method: "POST" });
}

export function fetchAgentConversation(id: string) {
  return apiFetch<AgentConversation>(
    buildUrl(`${path}/${encodeURIComponent(id)}`),
  );
}

export async function sendAgentMessage(
  id: string,
  message: string,
  signal: AbortSignal,
  onEvent: (event: AgentStreamEvent) => void,
) {
  const response = await fetch(
    buildUrl(`${path}/${encodeURIComponent(id)}/messages`),
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/x-ndjson",
      },
      body: JSON.stringify({ message }),
      signal: AbortSignal.any([signal, AbortSignal.timeout(90_000)]),
    },
  );
  if (!response.ok) {
    if (response.status === 401)
      throw new Error("Your session expired. Please sign in again.");
    if (response.status === 403)
      throw new Error("You no longer have access. Please reload the page.");
    const body = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;
    throw new Error(
      typeof body?.message === "string"
        ? body.message
        : "Unable to send your message.",
    );
  }
  if (!response.body) throw new Error("The response stream is unavailable.");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let completed = false;
  const consume = (line: string) => {
    if (!line.trim()) return;
    const event = JSON.parse(line) as AgentStreamEvent;
    if (event.type === "error") throw new Error(event.message);
    if (event.type === "done") completed = true;
    onEvent(event);
  };
  try {
    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) consume(line);
      if (done) break;
    }
    consume(buffer);
    if (!completed)
      throw new Error(
        "The connection ended early. Reload this conversation to see saved progress.",
      );
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}
