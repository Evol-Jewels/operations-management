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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

function HistoryPopover({ chat }: { chat: AssistantChat }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <HeaderAction label="History">
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label="History">
            <History className="size-4" />
          </Button>
        </PopoverTrigger>
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
  children,
}: {
  chat: AssistantChat;
  title: ReactNode;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <header
      className={cn(
        "flex h-14 shrink-0 items-center gap-1 pr-2 pl-4",
        className,
      )}
    >
      <div className="min-w-0 flex-1">{title}</div>
      <HistoryPopover chat={chat} />
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
      {children}
    </header>
  );
}
