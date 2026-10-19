import { apiFetch, buildUrl } from "@/lib/apiClient";
import { uploadEnquiryImage, uploadEnquiryRecording } from "@/lib/enquiriesApi";
import type {
  AssistantAttachment,
  AssistantCapabilities,
  AssistantSendInput,
  AssistantStreamEvent,
  AssistantThread,
  AssistantThreadSummary,
} from "@/types/assistant";

const base = "api/v1/assistant";

export function fetchAssistantCapabilities() {
  return apiFetch<AssistantCapabilities>(buildUrl(`${base}/capabilities`));
}

export function fetchAssistantThreads() {
  return apiFetch<AssistantThreadSummary[]>(buildUrl(`${base}/threads`));
}

export function createAssistantThread() {
  return apiFetch<AssistantThreadSummary>(buildUrl(`${base}/threads`), {
    method: "POST",
  });
}

export function fetchAssistantThread(id: string) {
  return apiFetch<AssistantThread>(
    buildUrl(`${base}/threads/${encodeURIComponent(id)}`),
  );
}

export function renameAssistantThread(id: string, title: string) {
  return apiFetch<{ id: string; title: string }>(
    buildUrl(`${base}/threads/${encodeURIComponent(id)}`),
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    },
  );
}

export function deleteAssistantThread(id: string) {
  return apiFetch<{ deleted: true }>(
    buildUrl(`${base}/threads/${encodeURIComponent(id)}`),
    { method: "DELETE" },
  );
}

/** Uploads a chat attachment through the same endpoints the forms use. */
export async function uploadAssistantAttachment(
  file: File,
): Promise<AssistantAttachment> {
  const type = file.type.startsWith("image/")
    ? "IMAGE"
    : file.type.startsWith("video/")
      ? "VIDEO"
      : file.type.startsWith("audio/")
        ? "AUDIO"
        : null;
  if (!type)
    throw new Error(
      `${file.name} is not a supported image, video or audio file.`,
    );
  const uploaded =
    type === "IMAGE"
      ? await uploadEnquiryImage(file)
      : await uploadEnquiryRecording(
          file,
          type === "VIDEO" ? "video" : "audio",
        );
  return {
    type,
    url: uploaded.url,
    name: uploaded.name || file.name,
    mimeType: uploaded.mimeType || file.type,
    size: uploaded.size,
    durationSeconds: uploaded.durationSeconds,
    publicId: uploaded.publicId,
  };
}

/** Sends a turn and reads the newline-delimited JSON event stream. */
export async function streamAssistantTurn(
  threadId: string,
  input: AssistantSendInput,
  signal: AbortSignal,
  onEvent: (event: AssistantStreamEvent) => void,
) {
  let response: Response;
  try {
    response = await fetch(
      buildUrl(`${base}/threads/${encodeURIComponent(threadId)}/messages`),
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/x-ndjson",
        },
        body: JSON.stringify(input),
        signal: AbortSignal.any([signal, AbortSignal.timeout(200_000)]),
      },
    );
  } catch (error) {
    if (signal.aborted) throw error;
    throw new Error("Could not reach the assistant. Check your connection.");
  }
  if (!response.ok) {
    if (response.status === 401)
      throw new Error("Your session expired. Please sign in again.");
    const body = (await response.json().catch(() => null)) as {
      message?: string | string[];
    } | null;
    const message = Array.isArray(body?.message)
      ? body.message.join(", ")
      : body?.message;
    throw new Error(message || "Unable to send your message.");
  }
  if (!response.body) throw new Error("The response stream is unavailable.");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finished = false;
  const consume = (line: string) => {
    if (!line.trim()) return;
    const event = JSON.parse(line) as AssistantStreamEvent;
    if (event.type === "done" || event.type === "error") finished = true;
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
    if (!finished)
      throw new Error(
        "The connection ended early. Reload the conversation to see saved progress.",
      );
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}
