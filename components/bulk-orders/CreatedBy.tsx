"use client";

import { formatDistanceToNowStrict } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getFirstName, getInitials } from "@/lib/people";
import { cn, formatDateTime } from "@/lib/utils";
import type { PersonSummary } from "@/types";

function PersonAvatar({
  person,
  className,
}: {
  person: PersonSummary;
  className?: string;
}) {
  return (
    <Avatar className={cn("size-5 shrink-0", className)}>
      {person.image && <AvatarImage src={person.image} alt={person.name} />}
      <AvatarFallback className="text-[9px] font-medium">
        {getInitials(person)}
      </AvatarFallback>
    </Avatar>
  );
}

function TimeAgo({ isoString }: { isoString: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <time
            dateTime={isoString}
            className="cursor-default underline decoration-dotted decoration-muted-foreground/40 underline-offset-4"
          >
            {formatDistanceToNowStrict(new Date(isoString), {
              addSuffix: true,
            })}
          </time>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {formatDateTime(isoString)}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function CreatedByLine({
  person,
  createdAt,
}: {
  person: PersonSummary;
  createdAt: string;
}) {
  return (
    <span className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-1">
      <PersonAvatar person={person} />
      <span className="font-medium text-foreground">{person.name}</span>
      <span>created this</span>
      <TimeAgo isoString={createdAt} />
    </span>
  );
}

export function CreatedByCell({
  person,
  createdAt,
}: {
  person: PersonSummary;
  createdAt: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <PersonAvatar person={person} className="size-7" />
      <div className="min-w-0">
        <p className="truncate text-sm text-foreground">
          {getFirstName(person)}
        </p>
        <p className="whitespace-nowrap text-xs text-muted-foreground">
          {formatDistanceToNowStrict(new Date(createdAt), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}
