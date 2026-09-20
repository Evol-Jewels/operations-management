"use client";

import {
  ArrowUp,
  Barcode,
  LoaderCircle,
  MessageSquare,
  Plus,
  RotateCcw,
  Search,
  Square,
  AudioLines,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AgentResultView } from "./AgentResults";
import { MarkdownText } from "./MarkdownText";
import { useInventoryChat } from "./useInventoryChat";
import { useInventoryVoice } from "./useInventoryVoice";
import { VoiceOverlay } from "./VoiceOverlay";

const suggestions = [
  "Sales analytics for this month",
  "Show new enquiries",
  "Show orders in production",
];

export function InventoryChat() {
  const chat = useInventoryChat();
  const voice = useInventoryVoice({
    ensureSession: chat.ensureSession,
    onEvent: chat.receiveVoiceEvent,
    onActiveChange: chat.setVoiceActive,
    onReconnect: () => void chat.resyncVoice(),
    scope: chat.authScope,
  });
  const [draft, setDraft] = useState("");
  const feed = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const input = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (chat.messages.length && feed.current && stickToBottom.current)
      feed.current.scrollTop = feed.current.scrollHeight;
  }, [chat.messages]);

  const submit = async (text = draft) => {
    if (!text.trim() || chat.isBusy || voice.active) return;
    setDraft("");
    stickToBottom.current = true;
    const success = await chat.send(text);
    if (!success) setDraft(text);
    input.current?.focus();
  };

  return (
    <section className="mx-auto flex h-[calc(100svh-6rem)] max-w-4xl flex-col sm:h-[calc(100svh-3rem)]">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Operations assistant
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Inventory, orders, enquiries and sales analytics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={chat.sessionId ?? "new"}
            onValueChange={(id) => chat.select(id === "new" ? null : id)}
            disabled={chat.isSending || voice.active}
          >
            <SelectTrigger
              aria-label="Conversation history"
              className="h-10 w-44 sm:w-52"
            >
              <MessageSquare className="size-4 shrink-0" aria-hidden="true" />
              <SelectValue placeholder="Conversations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">New conversation</SelectItem>
              {(chat.sessions.data ?? []).map((session) => (
                <SelectItem key={session.id} value={session.id}>
                  {session.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            className="size-10"
            aria-label="New conversation"
            disabled={chat.isSending || voice.active}
            onClick={() => {
              chat.select(null);
              setDraft("");
              input.current?.focus();
            }}
          >
            <Plus className="size-4" />
          </Button>
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1 flex-col">
        {voice.active && (
          <VoiceOverlay
            state={voice.state}
            muted={voice.muted}
            audioBlocked={voice.audioBlocked}
            onMute={() => void voice.toggleMute()}
            onEnd={voice.end}
            onEnableAudio={voice.enableAudio}
          />
        )}
        <div
          ref={feed}
          onScroll={() => {
            if (feed.current)
              stickToBottom.current =
                feed.current.scrollHeight -
                  feed.current.scrollTop -
                  feed.current.clientHeight <
                100;
          }}
          className={`min-h-0 flex-1 overflow-y-auto overscroll-contain pb-6 ${voice.active ? (voice.audioBlocked ? "pt-48" : "pt-32") : "pt-6"}`}
          role="log"
          aria-label="Assistant conversation"
        >
          {chat.conversation.isLoading && chat.sessionId && !chat.isSending ? (
            <div className="flex justify-center gap-2 py-16 text-sm text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />
              Loading conversation…
            </div>
          ) : chat.messages.length === 0 ? (
            <div className="flex min-h-full flex-col items-center justify-center px-4 py-8 text-center">
              <div className="mb-5 flex size-14 items-center justify-center rounded-2xl border bg-card">
                <Barcode className="size-6" strokeWidth={1.5} />
              </div>
              <h2 className="text-2xl font-medium tracking-tight">
                What can I help with?
              </h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                Ask about inventory, orders, enquiries, the team, or sales
                analytics.
              </p>
              <div className="mt-7 flex w-full max-w-md flex-col gap-2 text-left">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    disabled={chat.isBusy || voice.active}
                    onClick={() => {
                      setDraft(suggestion);
                      input.current?.focus();
                    }}
                    className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border bg-card px-4 py-3 text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Search
                      className="size-4 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6 px-1">
              {chat.messages.map((message) => (
                <div
                  key={message.id}
                  className={
                    message.role === "user" ? "flex justify-end" : "max-w-3xl"
                  }
                >
                  {message.inventory ||
                  message.orders ||
                  message.enquiries ||
                  message.salesAnalytics ||
                  message.salesLeaderboard ||
                  message.orderUpdate ||
                  message.users ||
                  message.productAnalytics ? (
                    <AgentResultView message={message} />
                  ) : (
                    <div
                      className={
                        message.role === "user"
                          ? "max-w-[85%] rounded-2xl rounded-br-sm bg-secondary px-4 py-3"
                          : "px-1"
                      }
                    >
                      <span className="sr-only">
                        {message.role === "user" ? "You" : "Assistant"}:{" "}
                      </span>
                      {message.role === "user" ? (
                        <p className="whitespace-pre-wrap break-words text-sm leading-7">
                          {message.text}
                        </p>
                      ) : (
                        <MarkdownText text={message.text} />
                      )}
                    </div>
                  )}
                </div>
              ))}
              {(chat.isBusy || (voice.active && chat.status)) && (
                <p
                  role="status"
                  className="flex items-center gap-2 px-1 text-xs text-muted-foreground"
                >
                  <LoaderCircle className="size-3.5 animate-spin motion-reduce:animate-none" />
                  {chat.isSending || voice.active
                    ? chat.status
                    : "Finishing the previous request…"}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <footer className="space-y-3 pt-2">
        {voice.error && (
          <div
            role="alert"
            className="flex items-center justify-between gap-3 rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          >
            <p>{voice.error}</p>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-11 shrink-0"
              aria-label="Dismiss voice error"
              onClick={voice.dismissError}
            >
              <X className="size-4" />
            </Button>
          </div>
        )}
        {(chat.error || chat.sessions.isError) && (
          <div
            role="alert"
            className="flex items-center justify-between gap-3 rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          >
            <p>{chat.error || "Unable to load your conversations."}</p>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Reload conversation"
              onClick={chat.reload}
            >
              <RotateCcw className="size-4" />
            </Button>
          </div>
        )}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
          className="rounded-2xl border bg-card p-3 shadow-xs focus-within:ring-1 focus-within:ring-ring/30"
        >
          <label htmlFor="assistant-message" className="sr-only">
            Message the operations assistant
          </label>
          <Textarea
            ref={input}
            id="assistant-message"
            value={draft}
            disabled={voice.active}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={2000}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !event.shiftKey &&
                !event.nativeEvent.isComposing
              ) {
                event.preventDefault();
                void submit();
              }
            }}
            placeholder={
              voice.active
                ? "Speak naturally, or end voice to type…"
                : "Ask about inventory, orders, enquiries or sales…"
            }
            className="max-h-36 min-h-14 resize-none border-0 bg-transparent px-1 py-1 text-base shadow-none focus-visible:ring-0 md:text-sm"
          />
          <div className="flex items-center justify-between gap-2 pt-2">
            {voice.active ? (
              <span className="pl-1 text-xs text-muted-foreground">
                Voice conversation active
              </span>
            ) : (
              <Button
                type="button"
                variant="ghost"
                className="min-h-11 gap-2 rounded-xl px-3 text-muted-foreground"
                disabled={
                  chat.isBusy ||
                  Boolean(
                    chat.sessionId &&
                      (chat.conversation.isLoading ||
                        chat.conversation.isError),
                  )
                }
                onClick={() => void voice.start()}
              >
                <AudioLines className="size-4" />
                <span>Speak with assistant</span>
              </Button>
            )}
            {chat.isSending ? (
              <Button
                type="button"
                size="icon"
                className="size-11 rounded-xl"
                aria-label="Stop response"
                onClick={chat.stop}
              >
                <Square className="size-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                size="icon"
                className="size-11 rounded-xl"
                aria-label="Send message"
                disabled={
                  !draft.trim() ||
                  voice.active ||
                  chat.isBusy ||
                  Boolean(
                    chat.sessionId &&
                      (chat.conversation.isLoading ||
                        chat.conversation.isError),
                  )
                }
              >
                <ArrowUp className="size-5" />
              </Button>
            )}
          </div>
        </form>
      </footer>
    </section>
  );
}
