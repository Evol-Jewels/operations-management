"use client";

import { useSearchParams } from "next/navigation";
import { AssistantHeader } from "./AssistantHeader";
import { AssistantPanel } from "./AssistantPanel";
import { useAssistantChat } from "./useAssistantChat";

export function AssistantWorkspace() {
  const searchParams = useSearchParams();
  const chat = useAssistantChat({
    syncUrl: true,
    initialThreadId: searchParams.get("thread"),
  });
  const title = chat.threadId
    ? (chat.thread.data?.title ?? "Conversation")
    : "Evol-E";

  return (
    <section className="flex h-svh flex-col md:p-2">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-card md:rounded-2xl md:border md:shadow-xs">
        <AssistantHeader
          chat={chat}
          className="pl-16 md:pl-5"
          title={
            <h1 className="truncate text-[15px] font-semibold tracking-tight">
              {title}
            </h1>
          }
        />
        <AssistantPanel chat={chat} />
      </div>
    </section>
  );
}
