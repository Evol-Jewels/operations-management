"use client";

import { History, Plus, Sparkles } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { AssistantPanel } from "./AssistantPanel";
import { AssistantThreadList } from "./AssistantThreadList";
import { useAssistantChat } from "./useAssistantChat";

export function AssistantWorkspace() {
  const searchParams = useSearchParams();
  const chat = useAssistantChat({
    syncUrl: true,
    initialThreadId: searchParams.get("thread"),
  });
  const [historyOpen, setHistoryOpen] = useState(false);
  const title = chat.thread.data?.title;

  return (
    <section className="flex h-svh overflow-hidden">
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-sidebar/60 lg:flex">
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <Sparkles className="size-4" />
          <span className="text-sm font-semibold">Assistant</span>
        </div>
        <AssistantThreadList chat={chat} />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b pr-3 pl-16 md:pl-4">
          <h1 className="truncate text-sm font-medium">
            {chat.threadId ? (title ?? "Conversation") : "New conversation"}
          </h1>
          <div className="flex items-center gap-1 lg:hidden">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Conversation history"
              onClick={() => setHistoryOpen(true)}
            >
              <History className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="New conversation"
              disabled={chat.busy}
              onClick={() => chat.select(null)}
            >
              <Plus className="size-4" />
            </Button>
          </div>
        </header>
        <AssistantPanel chat={chat} />
        <div className="h-3 shrink-0" />
      </div>
      <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
        <SheetContent side="left" className="flex w-72 flex-col p-0">
          <SheetHeader className="border-b px-4 py-3">
            <SheetTitle className="text-sm">Conversations</SheetTitle>
            <SheetDescription className="sr-only">
              Your previous assistant conversations
            </SheetDescription>
          </SheetHeader>
          <AssistantThreadList
            chat={chat}
            onSelect={() => setHistoryOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </section>
  );
}
