"use client";

import { useSearchParams } from "next/navigation";
import { AssistantHeader } from "./AssistantHeader";
import { AssistantPanel } from "./AssistantPanel";
import { AssistantThreadList } from "./AssistantThreadList";
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
    <section className="flex h-[calc(100svh-var(--mobile-top-h,0px))] flex-col md:p-2">
      <div className="flex min-h-0 flex-1 overflow-hidden bg-card md:rounded-2xl md:border md:shadow-xs">
        <aside className="hidden w-64 shrink-0 flex-col border-r lg:flex">
          <p className="flex h-14 shrink-0 items-center px-4 text-[13px] font-medium text-muted-foreground">
            Conversations
          </p>
          <AssistantThreadList chat={chat} />
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <AssistantHeader
            chat={chat}
            historyDrawer
            historyClassName="lg:hidden"
            className="h-12 border-b md:h-14 md:border-b-0 md:pl-5"
            title={
              <h1 className="truncate text-[15px] font-semibold tracking-tight">
                {title}
              </h1>
            }
          />
          <AssistantPanel chat={chat} />
        </div>
      </div>
    </section>
  );
}
