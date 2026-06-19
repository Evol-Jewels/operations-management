import {
  ArrowRight,
  Ban,
  FileText,
  Image as ImageIcon,
  type LucideIcon,
  MessageSquare,
  Package,
  PackagePlus,
  Paperclip,
  ReceiptText,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { renderMessageWithLinks } from "@/lib/message-links";
import { getFirstName, getInitials, normalizePerson } from "@/lib/people";
import { cn, formatDateTime } from "@/lib/utils";
import {
  ACTOR_ROLE_COLORS,
  ACTOR_ROLE_LABELS,
  type ActivityEntry,
  type ActorRole,
} from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function roleColors(role?: ActorRole) {
  return role
    ? ACTOR_ROLE_COLORS[role]
    : {
        bg: "bg-muted",
        text: "text-muted-foreground",
        badge: "border-border bg-muted text-muted-foreground",
        dot: "border-border bg-muted",
        dotSolid: "bg-muted-foreground",
      };
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function PersonAvatar({
  person,
  role,
}: {
  person: ActivityEntry["postedBy"];
  role?: ActorRole;
}) {
  const normalized = normalizePerson(person);
  const colors = roleColors(role);
  return (
    <Avatar
      className={cn(
        "h-8 w-8 flex-shrink-0 text-[11px] font-semibold",
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

// ─── Event Icon ───────────────────────────────────────────────────────────────

function getEventIcon(type: ActivityEntry["type"]): {
  Icon: LucideIcon;
  filled: boolean;
} {
  switch (type) {
    case "order_created":
      return { Icon: PackagePlus, filled: true };
    case "stage_change":
      return { Icon: ArrowRight, filled: true };
    case "enquiry_closed":
      return { Icon: Ban, filled: false };
    case "estimation_added":
      return { Icon: ReceiptText, filled: false };
    case "file_upload":
      return { Icon: Paperclip, filled: false };
    case "item_added":
      return { Icon: Package, filled: false };
    default:
      return { Icon: MessageSquare, filled: false };
  }
}

function getDefaultMessage(entry: ActivityEntry): string {
  switch (entry.type) {
    case "order_created":
      return "created this enquiry";
    case "item_added":
      return "added an item";
    case "enquiry_closed":
      return "closed the enquiry";
    case "estimation_added":
      return "updated an estimation";
    case "file_upload":
      return "uploaded a file";
    case "stage_change":
      return entry.newStage ? `moved to ${entry.newStage}` : "posted an update";
    default:
      return "posted an update";
  }
}

// ─── System / Stage Event — compact horizontal banner ────────────────────────

function SystemEvent({
  entry,
  isLast,
}: {
  entry: ActivityEntry;
  isLast: boolean;
}) {
  const { Icon, filled } = getEventIcon(entry.type);
  const message = entry.note ?? getDefaultMessage(entry);

  return (
    <div className="relative flex items-start gap-3">
      {/* Timeline spine */}
      <div className="relative flex w-8 flex-shrink-0 flex-col items-center">
        {/* Node */}
        <div
          className={cn(
            "relative z-10 flex h-5 w-5 items-center justify-center rounded-full",
            filled
              ? "bg-foreground text-background"
              : "border-2 border-border bg-background text-muted-foreground",
          )}
        >
          <Icon className="h-3 w-3" strokeWidth={2} />
        </div>
        {/* Connector going down */}
        {!isLast && (
          <div
            className="mt-1 w-px flex-1 bg-border"
            style={{ minHeight: 24 }}
          />
        )}
      </div>

      {/* Content — message + timestamp only */}
      <div className="min-w-0 flex-1 pb-5">
        <p className="text-sm leading-relaxed text-foreground">
          {renderMessageWithLinks(message)}
        </p>
        <span className="mt-0.5 block text-xs text-muted-foreground/60 tabular-nums">
          {formatDateTime(entry.timestamp)}
        </span>
        {entry.file && <FileAttachment file={entry.file} />}
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
  return (
    <div className="relative flex items-start gap-3">
      {/* Timeline spine */}
      <div className="relative flex w-8 flex-shrink-0 flex-col items-center">
        {/* Avatar sits on the line */}
        <div className="relative z-10">
          <PersonAvatar person={entry.postedBy} role={entry.actorRole} />
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
            {getFirstName(entry.postedBy)}
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
                {renderMessageWithLinks(entry.note)}
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
        const isComment = entry.type === "comment";

        if (isComment) {
          return <HumanMessage key={entry.id} entry={entry} isLast={isLast} />;
        }

        return <SystemEvent key={entry.id} entry={entry} isLast={isLast} />;
      })}
    </div>
  );
}
