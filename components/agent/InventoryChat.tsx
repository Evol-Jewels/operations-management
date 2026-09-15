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
import { InventoryResults } from "./InventoryResults";
import { useInventoryChat } from "./useInventoryChat";

const suggestions = [
  "Show available rings under ₹50,000",
  "Find rose gold earrings",
  "Show available necklaces",
];

export function InventoryChat() {
  const chat = useInventoryChat();
  const [draft, setDraft] = useState("");
  const feed = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const input = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (chat.messages.length && feed.current && stickToBottom.current)
      feed.current.scrollTop = feed.current.scrollHeight;
  }, [chat.messages]);

  const submit = async (text = draft) => {
    if (!text.trim() || chat.isBusy) return;
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
            Inventory assistant
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Find products, availability and prices.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={chat.sessionId ?? "new"}
            onValueChange={(id) => chat.select(id === "new" ? null : id)}
            disabled={chat.isSending}
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
            disabled={chat.isSending}
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
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-6"
        role="log"
        aria-label="Inventory conversation"
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
              What are you looking for?
            </h2>
            <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
              Enter a barcode, describe a product, or search by price, purity
              and weight.
            </p>
            <div className="mt-7 flex w-full max-w-md flex-col gap-2 text-left">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  disabled={chat.isBusy}
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
                {message.inventory ? (
                  <InventoryResults result={message.inventory} />
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
                    <p className="whitespace-pre-wrap break-words text-sm leading-7">
                      {message.text}
                    </p>
                  </div>
                )}
              </div>
            ))}
            {chat.isBusy && (
              <p
                role="status"
                className="flex items-center gap-2 px-1 text-xs text-muted-foreground"
              >
                <LoaderCircle className="size-3.5 animate-spin motion-reduce:animate-none" />
                {chat.isSending
                  ? chat.status
                  : "Finishing the previous request…"}
              </p>
            )}
          </div>
        )}
      </div>

      <footer className="space-y-3 pt-2">
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
          <label htmlFor="inventory-message" className="sr-only">
            Message the inventory assistant
          </label>
          <Textarea
            ref={input}
            id="inventory-message"
            value={draft}
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
            placeholder="Ask about inventory…"
            className="max-h-36 min-h-14 resize-none border-0 bg-transparent px-1 py-1 text-base shadow-none focus-visible:ring-0 md:text-sm"
          />
          <div className="flex items-center justify-between gap-2 pt-2">
            <span className="pl-1 text-xs text-muted-foreground">
              {draft.length > 1800
                ? `${draft.length}/2000`
                : "Shift + Enter for a new line"}
            </span>
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
