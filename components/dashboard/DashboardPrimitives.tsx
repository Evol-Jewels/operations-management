import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, Inbox } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type MetricTone = "blue" | "amber" | "emerald" | "violet" | "red";

const TONE_CLASSES: Record<MetricTone, string> = {
  blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  red: "bg-red-500/10 text-red-600 dark:text-red-400",
};

export interface MetricCardData {
  label: string;
  value: string;
  helper?: string;
  icon?: LucideIcon;
  tone?: MetricTone;
  href?: string;
}

export function DashboardHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          {title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function MetricsGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="@container">
      <div className="grid grid-cols-2 gap-3 @3xl:grid-cols-4">{children}</div>
    </div>
  );
}

export function MetricCard({ card }: { card: MetricCardData }) {
  const Icon = card.icon;
  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-muted-foreground">{card.label}</p>
        {Icon && (
          <span
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-md max-sm:hidden",
              TONE_CLASSES[card.tone ?? "blue"],
            )}
          >
            <Icon className="size-4" />
          </span>
        )}
      </div>
      <p className="mt-1 text-xl font-semibold tabular-nums tracking-tight text-foreground sm:text-2xl">
        {card.value}
      </p>
      {card.helper && (
        <p className="mt-1 text-xs text-muted-foreground">{card.helper}</p>
      )}
    </>
  );
  const className =
    "group relative flex min-w-0 flex-col rounded-lg border border-border/70 bg-card p-3 sm:p-4";

  if (card.href) {
    return (
      <Link
        href={card.href}
        className={cn(
          className,
          "transition-colors hover:border-border hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
      >
        {content}
        <ArrowUpRight className="absolute right-3 bottom-3 size-3.5 text-muted-foreground/0 transition-colors group-hover:text-muted-foreground" />
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}

export function MetricCardSkeleton() {
  return (
    <div className="rounded-lg border border-border/70 bg-card p-3 sm:p-4">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-3 h-7 w-20" />
      <Skeleton className="mt-2 h-3 w-28" />
    </div>
  );
}

export function Panel({
  title,
  description,
  action,
  children,
  className,
  contentClassName,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <section
      className={cn(
        "flex min-w-0 flex-col rounded-lg border border-border/70 bg-card",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 px-4 pt-4">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {description && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {action}
      </div>
      <div className={cn("flex-1 p-4", contentClassName)}>{children}</div>
    </section>
  );
}

export function EmptyRows({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="py-10 text-center">
      <Inbox className="mx-auto mb-2 size-7 text-muted-foreground/30" />
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground/70">{description}</p>
    </div>
  );
}

export function AnalyticsState({
  error,
  isLoading,
  onRetry,
}: {
  error: Error | null;
  isLoading: boolean;
  onRetry: () => void;
}) {
  if (isLoading) {
    return (
      <div className="space-y-5" aria-live="polite">
        <span className="sr-only">Loading order and enquiry analytics</span>
        <MetricsGrid>
          {["one", "two", "three", "four"].map((item) => (
            <MetricCardSkeleton key={item} />
          ))}
        </MetricsGrid>
        <Skeleton className="h-80 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-5 py-6">
      <p className="font-medium text-foreground">
        Order and enquiry analytics could not be loaded.
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {error?.message ?? "Please try again."}
      </p>
      <Button className="mt-4" variant="outline" size="sm" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}
