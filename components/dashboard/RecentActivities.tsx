"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { cn, formatRelativeTime } from "@/lib/utils";
import {
  ACTOR_ROLE_COLORS,
  ACTOR_ROLE_LABELS,
  type ActivityEntry,
  type ActorRole,
  type Order,
} from "@/types";

interface EnrichedActivity extends ActivityEntry {
  customerName: string;
  shareableToken: string;
}

function getActionText(entry: ActivityEntry): ReactNode {
  switch (entry.type) {
    case "order_created":
      return "created this order";
    case "stage_change":
      return (
        <>
          moved to{" "}
          <span className="font-medium text-foreground">{entry.newStage}</span>
        </>
      );
    case "note":
      return "added a note";
    case "file_upload":
      return "uploaded a file";
    default:
      return "updated";
  }
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function Avatar({ name, role }: { name: string; role?: ActorRole }) {
  const colors = role ? ACTOR_ROLE_COLORS[role] : ACTOR_ROLE_COLORS.sales;
  return (
    <div
      className={cn(
        "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
        colors.bg,
        colors.text,
      )}
      title={name}
    >
      {initials(name)}
    </div>
  );
}

function ActivityItem({ activity }: { activity: EnrichedActivity }) {
  return (
    <Link
      href={`/orders/${activity.shareableToken}`}
      className="group flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50"
    >
      <Avatar name={activity.postedBy} role={activity.actorRole} />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
          <span className="text-sm font-medium text-foreground">
            {activity.postedBy}
          </span>
          {activity.actorRole && (
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-1.5 py-px text-[10px] font-medium",
                ACTOR_ROLE_COLORS[activity.actorRole].badge,
              )}
            >
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
    <div className="sticky top-0 z-10 border-b border-border/50 bg-card/95 py-2 backdrop-blur-sm">
      <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

const ITEMS_PER_BATCH = 20;

interface RecentActivitiesProps {
  orders: Order[];
  className?: string;
}

export function RecentActivities({ orders, className }: RecentActivitiesProps) {
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_BATCH);
  const [sentinelRef, setSentinelRef] = useState<HTMLDivElement | null>(null);

  const allActivities = useMemo(() => {
    const enriched: EnrichedActivity[] = [];
    for (const order of orders) {
      for (const entry of order.activityFeed) {
        enriched.push({
          ...entry,
          customerName: order.customerName,
          shareableToken: order.shareableToken,
        });
      }
    }
    return enriched.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }, [orders]);

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

    const filtered = allActivities.slice(0, visibleCount);
    const result: { label: string; items: EnrichedActivity[] }[] = [];

    for (const group of groups) {
      const items = filtered.filter((a) => group.filter(new Date(a.timestamp)));
      if (items.length > 0) {
        result.push({ label: group.label, items });
      }
    }

    return { items: result, groups: result.map((r) => r.label) };
  }, [allActivities, visibleCount]);

  useEffect(() => {
    if (!sentinelRef) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < allActivities.length) {
          setVisibleCount((c) => c + ITEMS_PER_BATCH);
        }
      },
      { rootMargin: "100px" },
    );

    observer.observe(sentinelRef);
    return () => observer.disconnect();
  }, [sentinelRef, visibleCount, allActivities.length]);

  if (allActivities.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-border p-8 text-center">
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
        "flex h-full min-h-[360px] flex-col rounded-2xl border border-border bg-card shadow-sm",
        className,
      )}
    >
      <div className="border-b border-border px-5 py-4">
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/80">
          Recent Activity
        </span>
        <h2 className="mt-1 text-base font-semibold tracking-tight text-foreground">
          Latest updates across the pipeline
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 scrollbar-thin">
        {groups.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No recent activity
          </div>
        ) : (
          groupedItems.map((group) => (
            <div key={group.label}>
              <DateHeader label={group.label} />
              <div className="space-y-0.5 pb-2">
                {group.items.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
              </div>
            </div>
          ))
        )}

        <div ref={setSentinelRef} className="h-4" />

        {visibleCount < allActivities.length && (
          <div className="py-2 text-center">
            <span className="text-xs text-muted-foreground">
              Loading more...
            </span>
          </div>
        )}
      </div>

      <div className="border-t border-border px-4 py-2">
        <p className="text-xs text-muted-foreground">
          Showing {visibleCount} of {allActivities.length} activities
        </p>
      </div>
    </section>
  );
}
