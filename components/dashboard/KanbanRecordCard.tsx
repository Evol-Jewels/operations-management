"use client";

import { Gem, Images } from "lucide-react";
import Image from "next/image";
import { type ComponentProps, type ReactNode, useState } from "react";
import {
  JewelryVisual,
  normalizeCategoryVisual,
} from "@/components/jewelry/JewelryVisual";
import { categoryPaths } from "@/components/jewelry/jewelry-icon-paths";
import { getStatusTone } from "@/lib/statusTones";
import { cn, getDaysRemaining } from "@/lib/utils";
import type { UrgencyLevel } from "@/types";

const URGENCY_TEXT: Record<UrgencyLevel, string> = {
  overdue: "text-red-600 dark:text-red-400",
  "due-soon": "text-amber-600 dark:text-amber-400",
  "on-track": "text-emerald-600 dark:text-emerald-400",
  none: "text-foreground",
};

export function formatCardDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    ...(date.getFullYear() !== new Date().getFullYear() && {
      year: "2-digit",
    }),
  });
}

function formatDaysLeft(days: number) {
  if (days < 0) return `${Math.abs(days)}d late`;
  if (days === 0) return "today";
  return `${days}d left`;
}

export function StatusDot({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "size-1.5 shrink-0 rounded-full",
        getStatusTone(status).dot,
        className,
      )}
    />
  );
}

export function DueValue({
  date,
  urgency,
}: {
  date: string;
  urgency: UrgencyLevel;
}) {
  const days = getDaysRemaining(date);
  return (
    <span className={URGENCY_TEXT[urgency]}>
      {formatCardDate(date)}
      {days !== null && urgency !== "none" && (
        <span className="ml-1 text-[10px] font-normal opacity-80">
          {formatDaysLeft(days)}
        </span>
      )}
    </span>
  );
}

export function CardChip({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-5 min-w-0 items-center gap-1 rounded-md border border-border/70 bg-muted/40 px-1.5 text-[10px] font-medium text-muted-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function CardMetaSeparator() {
  return <span className="text-muted-foreground/40">·</span>;
}

function hasCategoryIcon(category?: string): category is string {
  return Boolean(
    category && Object.hasOwn(categoryPaths, normalizeCategoryVisual(category)),
  );
}

export function CategoryLabel({
  category,
  extra = 0,
}: {
  category?: string;
  extra?: number;
}) {
  if (!category) return null;
  return (
    <span className="inline-flex min-w-0 items-center gap-1">
      {hasCategoryIcon(category) && (
        <JewelryVisual kind="category" value={category} className="size-3.5" />
      )}
      <span className="truncate capitalize">{category.toLowerCase()}</span>
      {extra > 0 && <span className="shrink-0 tabular-nums">+{extra}</span>}
    </span>
  );
}

function CardMedia({
  images,
  alt,
  category,
  cornerBadge,
  compact,
}: {
  images: string[];
  alt: string;
  category?: string;
  cornerBadge?: ReactNode;
  compact: boolean;
}) {
  const [failed, setFailed] = useState<string[]>([]);
  const visible = images.filter((src) => !failed.includes(src));
  const cover = visible[0];

  return (
    <div
      className={cn(
        "relative aspect-[4/3] overflow-hidden border-b border-border/60",
        compact &&
          "max-xl:aspect-square max-xl:size-14 max-xl:shrink-0 max-xl:rounded-lg max-xl:border",
        cover ? "bg-white" : "bg-muted/40",
      )}
    >
      {cover ? (
        <Image
          src={cover}
          alt={alt}
          fill
          sizes={compact ? "(min-width: 1280px) 280px, 56px" : "280px"}
          unoptimized
          draggable={false}
          className={cn(
            "object-contain p-2 transition-transform duration-300 ease-out group-hover:scale-[1.04]",
            compact && "max-xl:p-1",
          )}
          onError={() => setFailed((current) => [...current, cover])}
        />
      ) : (
        <div className="flex h-full items-center justify-center text-muted-foreground/30">
          {hasCategoryIcon(category) ? (
            <JewelryVisual
              kind="category"
              value={category}
              className={cn("size-16 text-current", compact && "max-xl:size-8")}
            />
          ) : (
            <Gem
              className={cn("size-12", compact && "max-xl:size-7")}
              strokeWidth={1}
              aria-hidden="true"
            />
          )}
        </div>
      )}

      {cornerBadge && (
        <div
          className={cn("absolute right-2 top-2", compact && "max-xl:hidden")}
        >
          {cornerBadge}
        </div>
      )}

      {visible.length > 1 && (
        <span
          className={cn(
            "absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-zinc-900/70 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-white backdrop-blur-sm",
            compact && "max-xl:hidden",
          )}
        >
          <Images className="size-3" aria-hidden="true" />
          {visible.length}
        </span>
      )}
    </div>
  );
}

export interface CardStat {
  label: string;
  value: ReactNode;
}

export type KanbanCardButtonProps = Omit<
  ComponentProps<"button">,
  "title" | "children"
> & {
  draggableCard?: boolean;
};

export function KanbanRecordCard({
  images = [],
  imageAlt,
  category,
  cornerBadge,
  title,
  aside,
  meta,
  chips,
  stats,
  summary,
  compact = false,
  dimmed = false,
  draggableCard = false,
  className,
  ...props
}: KanbanCardButtonProps & {
  images?: string[];
  imageAlt: string;
  category?: string;
  cornerBadge?: ReactNode;
  title: ReactNode;
  aside?: ReactNode;
  meta?: ReactNode;
  chips?: ReactNode;
  stats: [CardStat, CardStat];
  summary?: ReactNode;
  compact?: boolean;
  dimmed?: boolean;
}) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "group relative block w-full overflow-hidden rounded-xl border border-border bg-card text-left shadow-xs transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-md focus-visible:outline-2 focus-visible:outline-ring",
        compact && "max-xl:flex max-xl:items-center max-xl:gap-3 max-xl:p-2",
        draggableCard ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
        className,
      )}
    >
      <CardMedia
        images={images}
        alt={imageAlt}
        category={category}
        cornerBadge={cornerBadge}
        compact={compact}
      />
      <div
        className={cn(
          dimmed && "opacity-60",
          compact && "max-xl:min-w-0 max-xl:flex-1",
        )}
      >
        <div
          className={cn(
            "space-y-2 px-3 pt-2.5",
            compact && "max-xl:space-y-1.5 max-xl:p-0",
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold leading-5 text-foreground">
                {title}
              </p>
              {meta && (
                <div className="flex min-w-0 items-center gap-1.5 text-[11px] leading-4 text-muted-foreground">
                  {meta}
                </div>
              )}
            </div>
            {aside && (
              <div className={cn("shrink-0", compact && "max-xl:hidden")}>
                {aside}
              </div>
            )}
          </div>
          {(chips || (compact && (summary || cornerBadge))) && (
            <div className="flex flex-wrap items-center gap-1.5 empty:hidden">
              {chips}
              {compact && cornerBadge && (
                <span className="xl:hidden">{cornerBadge}</span>
              )}
              {compact && summary && (
                <span className="ml-auto text-[11px] font-semibold tabular-nums xl:hidden">
                  {summary}
                </span>
              )}
            </div>
          )}
        </div>
        <dl
          className={cn(
            "mt-2.5 grid grid-cols-2 divide-x divide-border/60 border-t border-border/60",
            compact && "max-xl:hidden",
          )}
        >
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className={cn("min-w-0 px-3 py-2", index === 1 && "text-right")}
            >
              <dt className="text-[9px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                {stat.label}
              </dt>
              <dd className="truncate text-xs font-semibold tabular-nums text-foreground">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </button>
  );
}
