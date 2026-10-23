"use client";

import { History, SquarePen } from "lucide-react";
import { type ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { AssistantThreadList } from "./AssistantThreadList";
import type { AssistantChat } from "./useAssistantChat";

function HeaderAction({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

function ThreadHistory({
  chat,
  drawer,
  className,
}: {
  chat: AssistantChat;
  drawer?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const trigger = (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="History"
      className={className}
    >
      <History className="size-4" />
    </Button>
  );
  if (drawer || isMobile)
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <HeaderAction label="History">
          <SheetTrigger asChild>{trigger}</SheetTrigger>
        </HeaderAction>
        <SheetContent
          side="left"
          className="flex w-[85vw] max-w-sm flex-col gap-0 p-0 pb-[env(safe-area-inset-bottom)]"
        >
          <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b pr-2 pl-4">
            <SheetTitle className="text-[15px] tracking-tight">
              Conversations
            </SheetTitle>
            <SheetDescription className="sr-only">
              Open or manage a previous conversation.
            </SheetDescription>
            {chat.threadId ? (
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5"
                disabled={chat.busy}
                onClick={() => {
                  chat.select(null);
                  setOpen(false);
                }}
              >
                <SquarePen className="size-4" />
                New chat
              </Button>
            ) : null}
          </div>
          <AssistantThreadList chat={chat} onSelect={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    );
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <HeaderAction label="History">
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      </HeaderAction>
      <PopoverContent
        align="end"
        className="flex max-h-[min(28rem,70svh)] w-80 flex-col rounded-xl p-0"
      >
        <AssistantThreadList chat={chat} onSelect={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}

export function AssistantHeader({
  chat,
  title,
  className,
  historyDrawer,
  historyClassName,
  children,
}: {
  chat: AssistantChat;
  title: ReactNode;
  className?: string;
  historyDrawer?: boolean;
  historyClassName?: string;
  children?: ReactNode;
}) {
  return (
    <header
      className={cn(
        "flex h-14 shrink-0 items-center gap-1 pr-2 pl-4 max-md:[&_[data-size=icon-sm]]:size-10",
        className,
      )}
    >
      <div className="min-w-0 flex-1">{title}</div>
      <ThreadHistory
        chat={chat}
        drawer={historyDrawer}
        className={historyClassName}
      />
      {chat.threadId ? (
        <HeaderAction label="New chat">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="New chat"
            disabled={chat.busy}
            onClick={() => chat.select(null)}
          >
            <SquarePen className="size-4" />
          </Button>
        </HeaderAction>
      ) : null}
      {children}
    </header>
  );
}
