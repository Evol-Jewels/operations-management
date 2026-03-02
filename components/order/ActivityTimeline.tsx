import {
  ArrowRight,
  FileText,
  Image as ImageIcon,
  PackagePlus,
} from "lucide-react";
import { cn, formatDate, formatDateTime } from "@/lib/utils";
import {
  ACTOR_ROLE_COLORS,
  ACTOR_ROLE_LABELS,
  type ActivityEntry,
  type ActorRole,
} from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function roleColors(role?: ActorRole) {
  return role ? ACTOR_ROLE_COLORS[role] : ACTOR_ROLE_COLORS.sales;
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name, role }: { name: string; role?: ActorRole }) {
  const colors = roleColors(role);
  return (
    <div
      className={cn(
        "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
        colors.bg,
        colors.text,
      )}
      title={name}
    >
      {initials(name)}
    </div>
  );
}

// ─── Role Badge ───────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role?: ActorRole }) {
  if (!role) return null;
  const colors = roleColors(role);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-1.5 py-px text-[10px] font-medium leading-none",
        colors.badge,
      )}
    >
      {ACTOR_ROLE_LABELS[role]}
    </span>
  );
}

// ─── File Attachment ──────────────────────────────────────────────────────────

function FileAttachment({
  file,
}: {
  file: NonNullable<ActivityEntry["file"]>;
}) {
  const isImage = file.fileType === "image";
  return (
    <div className="mt-2.5 flex min-w-0 max-w-full items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm">
      {isImage ? (
        <ImageIcon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
      ) : (
        <FileText className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
      )}
      <span className="min-w-0 truncate font-medium text-foreground">
        {file.filename}
      </span>
      <span className="ml-auto flex-shrink-0 rounded border border-border bg-background px-1 py-px text-[10px] uppercase text-muted-foreground">
        {file.fileType}
      </span>
    </div>
  );
}

// ─── System / Stage Event — compact horizontal banner ────────────────────────

function SystemEvent({
  entry,
  isLast,
}: {
  entry: ActivityEntry;
  isLast: boolean;
}) {
  const isCreated = entry.type === "order_created";

  return (
    <div className="relative flex items-start gap-3">
      {/* Timeline spine */}
      <div className="relative flex w-8 flex-shrink-0 flex-col items-center">
        {/* Node */}
        <div
          className={cn(
            "relative z-10 flex h-5 w-5 items-center justify-center rounded-full",
            isCreated
              ? "bg-foreground text-background"
              : "border-2 border-border bg-background",
          )}
        >
          {isCreated ? (
            <PackagePlus className="h-3 w-3" strokeWidth={2} />
          ) : (
            <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
          )}
        </div>
        {/* Connector going down */}
        {!isLast && (
          <div
            className="mt-1 w-px flex-1 bg-border"
            style={{ minHeight: 24 }}
          />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 pb-5">
        {isCreated ? (
          /* Order Created — slightly more prominent */
          <div className="min-w-0 pt-0.5">
            <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
              <span className="text-sm font-medium text-foreground">
                {entry.postedBy}
              </span>
              <RoleBadge role={entry.actorRole} />
              <span className="text-sm text-muted-foreground">
                {entry.type === "order_created" ? "created this order" : ""}
              </span>
            </div>
            <span className="mt-0.5 block text-xs text-muted-foreground/60 tabular-nums">
              {formatDateTime(entry.timestamp)}
            </span>
          </div>
        ) : (
          /* Stage change — inline pill */
          <div className="min-w-0 pt-0.5">
            <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
              <span className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  {entry.postedBy}
                </span>
                {" moved to "}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-foreground/20 bg-foreground/5 px-2 py-0.5 text-xs font-medium text-foreground">
                <ArrowRight className="h-2.5 w-2.5" strokeWidth={2.5} />
                {entry.newStage}
              </span>
            </div>
            <span className="mt-0.5 block text-xs text-muted-foreground/60 tabular-nums">
              {formatDateTime(entry.timestamp)}
            </span>
          </div>
        )}

        {/* Optional note on system events */}
        {entry.note && (
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {entry.note}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Human Message — full bubble ─────────────────────────────────────────────

function HumanMessage({
  entry,
  isLast,
}: {
  entry: ActivityEntry;
  isLast: boolean;
}) {
  const colors = roleColors(entry.actorRole);

  return (
    <div className="relative flex items-start gap-3">
      {/* Timeline spine */}
      <div className="relative flex w-8 flex-shrink-0 flex-col items-center">
        {/* Avatar sits on the line */}
        <div className="relative z-10">
          <Avatar name={entry.postedBy} role={entry.actorRole} />
        </div>
        {/* Connector going down */}
        {!isLast && (
          <div
            className="mt-1 w-px flex-1 bg-border"
            style={{ minHeight: 24 }}
          />
        )}
      </div>

      {/* Message card */}
      <div className="min-w-0 flex-1 pb-5">
        {/* Header */}
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-sm font-semibold text-foreground">
            {entry.postedBy}
          </span>
          <RoleBadge role={entry.actorRole} />
        </div>
        <span className="mt-0.5 block text-xs text-muted-foreground/60 tabular-nums">
          {formatDateTime(entry.timestamp)}
        </span>

        {/* Message bubble */}
        {(entry.note || entry.file) && (
          <div
            className={cn(
              "mt-2 min-w-0 overflow-hidden rounded-xl rounded-tl-sm border bg-card p-3.5",
              // Left border accent matches role color
              "border-l-2",
              entry.actorRole === "vendor" &&
                "border-l-amber-300 dark:border-l-amber-700",
              entry.actorRole === "sales" &&
                "border-l-blue-300 dark:border-l-blue-700",
              entry.actorRole === "owner" &&
                "border-l-purple-300 dark:border-l-purple-700",
              entry.actorRole === "customer" &&
                "border-l-emerald-300 dark:border-l-emerald-700",
              !entry.actorRole && "border-l-border",
            )}
          >
            {entry.note && (
              <p className="break-words text-sm leading-relaxed text-foreground">
                {entry.note}
              </p>
            )}
            {entry.file && <FileAttachment file={entry.file} />}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Timeline ────────────────────────────────────────────────────────────

interface ActivityTimelineProps {
  entries: ActivityEntry[];
}

export function ActivityTimeline({ entries }: ActivityTimelineProps) {
  // Oldest first — read the story top to bottom
  const sorted = [...entries].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  if (sorted.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">
        No activity yet.
      </div>
    );
  }

  return (
    <div>
      {sorted.map((entry, i) => {
        const isLast = i === sorted.length - 1;
        const isSystemEvent =
          entry.type === "order_created" || entry.type === "stage_change";

        if (isSystemEvent) {
          return <SystemEvent key={entry.id} entry={entry} isLast={isLast} />;
        }

        return <HumanMessage key={entry.id} entry={entry} isLast={isLast} />;
      })}
    </div>
  );
}
