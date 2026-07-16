"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useInfiniteActivityLogs } from "@/hooks/useSourceActivity";
import { mapBackendActivityLogToActivityEntry } from "@/lib/enquiryMappers";
import { getFirstName, getInitials, normalizePerson } from "@/lib/people";
import { cn, formatRelativeTime } from "@/lib/utils";
import {
  ACTOR_ROLE_COLORS,
  ACTOR_ROLE_LABELS,
  type ActivityEntry,
  type ActorRole,
} from "@/types";
import type { ActivityLogType, BackendActivityLog } from "@/types/activity-api";

interface EnrichedActivity extends ActivityEntry {
  customerName: string;
  href: string;
  logType: ActivityLogType;
  message?: string;
}

function getActionText(activity: EnrichedActivity): ReactNode {
  switch (activity.logType) {
    case "COMMENT_ADDED":
      return "added a comment";
    case "COMMENT_UPDATED":
      return "updated a comment";
    case "COMMENT_DELETED":
      return "deleted a comment";
    case "ITEM_ADDED":
      return "added an item";
    case "ITEM_UPDATED":
      return "updated an item";
    case "ITEM_DELETED":
      return "deleted an item";
    case "ESTIMATION_ADDED":
      return "added an estimation";
    case "ESTIMATION_UPDATED":
      return "updated an estimation";
    case "ESTIMATION_DELETED":
      return "deleted an estimation";
    case "ORDER_MODIFIED":
      return "modified this order";
  }

  switch (activity.type) {
    case "order_created":
      return activity.logType === "ENQUIRY_CREATED"
        ? "created this enquiry"
        : "created this order";
    case "stage_change":
      if (activity.newStage) {
        return (
          <>
            moved to{" "}
            <span className="font-medium text-foreground">
              {activity.newStage}
            </span>
          </>
        );
      }
      return activity.message || "changed status";
    case "comment":
      return "added a note";
    case "file_upload":
      return "uploaded a file";
    default:
      return "updated";
  }
}

function PersonAvatar({
  person,
  role,
}: {
  person: ActivityEntry["postedBy"];
  role?: ActorRole;
}) {
  const normalized = normalizePerson(person);
  const colors = role ? ACTOR_ROLE_COLORS[role] : ACTOR_ROLE_COLORS.sales;
  return (
    <Avatar
      className={cn(
        "h-6 w-6 flex-shrink-0 text-[10px] font-semibold",
        colors.bg,
        colors.text,
      )}
      title={normalized.name}
    >
      {normalized.image ? (
        <AvatarImage src={normalized.image} alt={normalized.name} />
      ) : null}
      <AvatarFallback className={cn(colors.bg, colors.text)}>
        {getInitials(normalized)}
      </AvatarFallback>
    </Avatar>
  );
}

function ActivityItem({ activity }: { activity: EnrichedActivity }) {
  return (
    <Link
      href={activity.href}
      className="group flex items-start gap-3 border-b border-border/60 px-4 py-3 transition-colors last:border-b-0 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
    >
      <PersonAvatar person={activity.postedBy} role={activity.actorRole} />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
          <span className="text-sm font-medium text-foreground">
            {getFirstName(activity.postedBy)}
          </span>
          {activity.actorRole && (
            <span className="text-[10px] font-medium text-muted-foreground">
              {ACTOR_ROLE_LABELS[activity.actorRole]}
            </span>
          )}
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {getActionText(activity)}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          for{" "}
          <span className="font-medium text-foreground group-hover:underline">
            {activity.customerName}
          </span>
        </p>
      </div>
      <span className="flex-shrink-0 text-[10px] tabular-nums text-muted-foreground">
        {formatRelativeTime(activity.timestamp)}
      </span>
    </Link>
  );
}

function DateHeader({ label }: { label: string }) {
  return (
    <div className="px-4 pt-4 pb-2">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

const ITEMS_PER_BATCH = 20;
const LOADING_PLACEHOLDERS = [
  "activity-loading-1",
  "activity-loading-2",
  "activity-loading-3",
  "activity-loading-4",
  "activity-loading-5",
  "activity-loading-6",
];

interface RecentActivitiesProps {
  className?: string;
}

export function RecentActivities({ className }: RecentActivitiesProps) {
  const [sentinelRef, setSentinelRef] = useState<HTMLDivElement | null>(null);
  const activityLogsQuery = useInfiniteActivityLogs({
    limit: ITEMS_PER_BATCH,
  });

  const allLogs = useMemo(
    () => activityLogsQuery.data?.pages.flat() ?? [],
    [activityLogsQuery.data],
  );

  const allActivities = useMemo(() => {
    const enriched = allLogs.map((log: BackendActivityLog) => {
      const entry = mapBackendActivityLogToActivityEntry(log);
      const fallbackName = `${log.sourceType === "ENQUIRY" ? "Enquiry" : "Order"} #${log.sourceCode}`;
      const href =
        log.sourceType === "ENQUIRY"
          ? `/enquiries/${log.sourceCode}`
          : `/orders/${log.sourceCode}`;

      return {
        ...entry,
        customerName: fallbackName,
        href,
        logType: log.type,
        message: log.message || undefined,
      };
    });

    return enriched.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }, [allLogs]);

  const { items: groupedItems, groups } = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const groups: { label: string; filter: (d: Date) => boolean }[] = [
      { label: "Today", filter: (d) => d >= today },
      { label: "Yesterday", filter: (d) => d >= yesterday && d < today },
      { label: "This Week", filter: (d) => d >= weekAgo && d < yesterday },
      { label: "Older", filter: (d) => d < weekAgo },
    ];

    const result: { label: string; items: EnrichedActivity[] }[] = [];

    for (const group of groups) {
      const items = allActivities.filter((a) =>
        group.filter(new Date(a.timestamp)),
      );
      if (items.length > 0) {
        result.push({ label: group.label, items });
      }
    }

    return { items: result, groups: result.map((r) => r.label) };
  }, [allActivities]);

  useEffect(() => {
    if (!sentinelRef) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (
          entry.isIntersecting &&
          activityLogsQuery.hasNextPage &&
          !activityLogsQuery.isFetchingNextPage
        ) {
          activityLogsQuery.fetchNextPage();
        }
      },
      { rootMargin: "160px" },
    );

    observer.observe(sentinelRef);
    return () => observer.disconnect();
  }, [
    sentinelRef,
    activityLogsQuery.fetchNextPage,
    activityLogsQuery.hasNextPage,
    activityLogsQuery.isFetchingNextPage,
  ]);

  if (activityLogsQuery.isPending) {
    return (
      <section
        className={cn(
          "flex h-full min-h-[360px] flex-col rounded-lg border border-border/70 bg-card",
          className,
        )}
      >
        <div className="border-b border-border/70 px-4 py-3 pr-14">
          <h2 className="text-sm font-semibold text-foreground">
            Recent activity
          </h2>
        </div>
        <div className="space-y-3 p-4">
          {LOADING_PLACEHOLDERS.map((placeholder) => (
            <div key={placeholder} className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-muted" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-3 w-24 rounded bg-muted" />
                <div className="h-3 w-40 rounded bg-muted" />
              </div>
              <div className="h-3 w-10 rounded bg-muted" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (activityLogsQuery.isError) {
    return (
      <section
        className={cn(
          "flex h-full min-h-[360px] flex-col rounded-lg border border-border/70 bg-card",
          className,
        )}
      >
        <div className="border-b border-border/70 px-4 py-3 pr-14">
          <h2 className="text-sm font-semibold text-foreground">
            Recent activity
          </h2>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Could not load recent activity.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => activityLogsQuery.refetch()}
          >
            Retry
          </Button>
        </div>
      </section>
    );
  }

  if (allActivities.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-lg border border-dashed border-border/70 p-8 text-center">
        <p className="text-sm text-muted-foreground">No recent activity yet</p>
        <p className="mt-1 text-xs text-muted-foreground/60">
          Activity will appear here as orders are updated
        </p>
      </div>
    );
  }

  return (
    <section
      className={cn(
        "flex h-full min-h-[360px] flex-col rounded-lg border border-border/70 bg-card",
        className,
      )}
    >
      <div className="border-b border-border/70 px-4 py-3 pr-14">
        <h2 className="text-sm font-semibold text-foreground">
          Recent activity
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {groups.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No recent activity
          </div>
        ) : (
          groupedItems.map((group) => (
            <div key={group.label}>
              <DateHeader label={group.label} />
              <div>
                {group.items.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
              </div>
            </div>
          ))
        )}

        <div ref={setSentinelRef} className="h-4" />

        {activityLogsQuery.isFetchingNextPage && (
          <div className="py-2 text-center">
            <span className="text-xs text-muted-foreground">
              Loading more...
            </span>
          </div>
        )}
      </div>

      <div className="border-t border-border/70 px-4 py-2">
        <p className="text-xs text-muted-foreground">
          Showing {allActivities.length}{" "}
          {allActivities.length === 1 ? "activity" : "activities"}
        </p>
      </div>
    </section>
  );
}
