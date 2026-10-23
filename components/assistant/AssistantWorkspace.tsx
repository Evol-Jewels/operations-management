"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AssistantHeader } from "./AssistantHeader";
import { describePage } from "./AssistantLauncher";
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
  // Set when opened from the Evol-E button on a phone, so "this order" still works.
  const from = searchParams.get("from");
  const source = from?.startsWith("/")
    ? (() => {
        const url = new URL(from, "http://local");
        return describePage(url.pathname, url.searchParams);
      })()
    : null;

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
              <div className="flex min-w-0 items-center gap-1">
                {from && source ? (
                  <Button
                    asChild
                    variant="ghost"
                    size="icon"
                    className="-ml-2 size-10 shrink-0 md:hidden"
                  >
                    <Link href={from} aria-label="Back">
                      <ArrowLeft className="size-5" />
                    </Link>
                  </Button>
                ) : null}
                <h1 className="truncate text-[15px] font-semibold tracking-tight">
                  {title}
                </h1>
              </div>
            }
          />
          <AssistantPanel
            chat={chat}
            context={source?.context}
            contextLabel={source?.label}
          />
        </div>
      </div>
    </section>
  );
}
