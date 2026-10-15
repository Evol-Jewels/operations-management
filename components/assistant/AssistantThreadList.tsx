"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { isToday, isYesterday, subDays } from "date-fns";
import { Check, MessageSquare, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  deleteAssistantThread,
  renameAssistantThread,
} from "@/lib/assistantApi";
import { cn } from "@/lib/utils";
import type { AssistantThreadSummary } from "@/types/assistant";
import { type AssistantChat, assistantKeys } from "./useAssistantChat";

function groupOf(date: Date) {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  if (date > subDays(new Date(), 7)) return "Previous 7 days";
  return "Older";
}

export function AssistantThreadList({
  chat,
  onSelect,
}: {
  chat: AssistantChat;
  onSelect?: () => void;
}) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [removing, setRemoving] = useState<AssistantThreadSummary | null>(null);
  const listKey = assistantKeys.threads(chat.scope);

  const rename = useMutation({
    mutationFn: ({ id, value }: { id: string; value: string }) =>
      renameAssistantThread(id, value),
    onSuccess: () => {
      setEditing(null);
      void queryClient.invalidateQueries({ queryKey: listKey });
      if (chat.threadId)
        void queryClient.invalidateQueries({
          queryKey: assistantKeys.thread(chat.scope, chat.threadId),
        });
    },
    onError: (error) => toast.error(error.message),
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteAssistantThread(id),
    onSuccess: (_result, id) => {
      setRemoving(null);
      if (id === chat.threadId) chat.select(null);
      void queryClient.invalidateQueries({ queryKey: listKey });
    },
    onError: (error) => toast.error(error.message),
  });

  const threads = chat.threads.data ?? [];
  const groups = new Map<string, AssistantThreadSummary[]>();
  for (const thread of threads) {
    const key = groupOf(new Date(thread.updatedAt));
    groups.set(key, [...(groups.get(key) ?? []), thread]);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="p-2">
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          disabled={chat.busy}
          onClick={() => {
            chat.select(null);
            onSelect?.();
          }}
        >
          <Plus className="size-4" />
          New conversation
        </Button>
      </div>
      <nav
        aria-label="Conversations"
        className="min-h-0 flex-1 overflow-y-auto px-2 pb-3"
      >
        {chat.threads.isLoading ? (
          <div className="space-y-2 p-2">
            {[0, 1, 2, 3].map((item) => (
              <Skeleton key={item} className="h-8 w-full" />
            ))}
          </div>
        ) : threads.length === 0 ? (
          <p className="px-3 py-6 text-center text-xs text-muted-foreground">
            Your conversations will appear here.
          </p>
        ) : (
          [...groups.entries()].map(([label, items]) => (
            <div key={label} className="mt-3 first:mt-1">
              <p className="px-2.5 pb-1 text-[11px] font-medium text-muted-foreground">
                {label}
              </p>
              <ul className="space-y-0.5">
                {items.map((thread) => {
                  const active = thread.id === chat.threadId;
                  if (editing === thread.id)
                    return (
                      <li key={thread.id}>
                        <form
                          className="flex items-center gap-1 px-1"
                          onSubmit={(event) => {
                            event.preventDefault();
                            if (title.trim())
                              rename.mutate({
                                id: thread.id,
                                value: title.trim(),
                              });
                          }}
                        >
                          <Input
                            autoFocus
                            value={title}
                            maxLength={80}
                            onChange={(event) => setTitle(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === "Escape") setEditing(null);
                            }}
                            className="h-8 text-sm"
                          />
                          <Button
                            type="submit"
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Save title"
                          >
                            <Check className="size-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Cancel rename"
                            onClick={() => setEditing(null)}
                          >
                            <X className="size-3.5" />
                          </Button>
                        </form>
                      </li>
                    );
                  return (
                    <li key={thread.id} className="group relative">
                      <button
                        type="button"
                        disabled={chat.busy}
                        onClick={() => {
                          chat.select(thread.id);
                          onSelect?.();
                        }}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-md px-2.5 py-2 pr-16 text-left text-sm transition-colors hover:bg-muted",
                          active && "bg-muted font-medium",
                        )}
                      >
                        <MessageSquare className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate">{thread.title}</span>
                      </button>
                      <div className="absolute top-1/2 right-1 flex -translate-y-1/2 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label={`Rename ${thread.title}`}
                          onClick={() => {
                            setTitle(thread.title);
                            setEditing(thread.id);
                          }}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label={`Delete ${thread.title}`}
                          onClick={() => setRemoving(thread)}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))
        )}
      </nav>
      <AlertDialog
        open={Boolean(removing)}
        onOpenChange={(open) => !open && setRemoving(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              “{removing?.title}” will be removed from your history. Changes the
              assistant already made stay in place.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => removing && remove.mutate(removing.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
