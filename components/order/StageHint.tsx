"use client";

import {
  ArrowRight,
  CheckCircle2,
  FileCheck,
  ImageIcon,
  Package,
  Pencil,
  Phone,
  Truck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Stage } from "@/types";

interface StageHintDef {
  icon: React.ElementType;
  title: string;
  body: string;
  actor: "vendor" | "sales" | "both";
  tone: "neutral" | "action" | "info";
}

const STAGE_HINTS: Partial<Record<Stage, StageHintDef>> = {
  Enquiry: {
    icon: Phone,
    title: "Enquiry received",
    body: "Follow up with the customer to confirm interest and collect full specs. Convert to an order once details are agreed.",
    actor: "sales",
    tone: "neutral",
  },
  Estimation: {
    icon: Pencil,
    title: "Awaiting estimate",
    body: "Vendor: please confirm stone availability and share a price breakdown. Sales: confirm delivery timeline with the customer once received.",
    actor: "both",
    tone: "action",
  },
  New: {
    icon: ArrowRight,
    title: "Order received",
    body: "Confirm production specs, vendor assignment, and delivery timeline before production begins.",
    actor: "both",
    tone: "action",
  },
  "CAD Design": {
    icon: ImageIcon,
    title: "CAD design in progress",
    body: "Vendor: share CAD renders as soon as ready. A customer sign-off on the design is required before manufacturing begins.",
    actor: "vendor",
    tone: "action",
  },
  "Order Confirmed": {
    icon: ArrowRight,
    title: "Ready to start production",
    body: "Vendor: please confirm receipt of specs and your expected start date. Post an update once materials are procured.",
    actor: "vendor",
    tone: "action",
  },
  "In Production": {
    icon: Package,
    title: "In production",
    body: "Vendor: post progress updates at key milestones. Move to Certification once the piece is complete.",
    actor: "vendor",
    tone: "info",
  },
  Certification: {
    icon: FileCheck,
    title: "Awaiting certification",
    body: "Vendor: attach the certification PDF once received and move to At Store or In Transit.",
    actor: "vendor",
    tone: "action",
  },
  "At Store": {
    icon: Package,
    title: "At store",
    body: "Sales: confirm receipt and notify the customer that their order is ready.",
    actor: "sales",
    tone: "info",
  },
  "In Transit": {
    icon: Truck,
    title: "In transit",
    body: "Order is in transit. Confirm receipt and update the customer once it arrives.",
    actor: "sales",
    tone: "info",
  },
  Delivered: {
    icon: CheckCircle2,
    title: "Delivered",
    body: "Order has been delivered. Confirm any balance payment and post final notes.",
    actor: "sales",
    tone: "neutral",
  },
  Closed: {
    icon: CheckCircle2,
    title: "Closed",
    body: "Order is closed. Activity remains available for reference.",
    actor: "sales",
    tone: "neutral",
  },
  Cancelled: {
    icon: CheckCircle2,
    title: "Cancelled",
    body: "Order is cancelled. Activity remains available for reference.",
    actor: "sales",
    tone: "neutral",
  },
};

const TONE_STYLES = {
  neutral:
    "border-border bg-muted/40 text-muted-foreground dark:border-border dark:bg-muted/20",
  action:
    "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300",
  info: "border-muted-foreground/20 bg-muted text-muted-foreground dark:border-muted-foreground/20 dark:bg-muted/50",
};

const TONE_ICON_STYLES = {
  neutral: "text-muted-foreground",
  action: "text-blue-600 dark:text-blue-400",
  info: "text-muted-foreground",
};

function ActorBadge({ actor }: { actor: StageHintDef["actor"] }) {
  if (actor === "both") {
    return (
      <div className="flex gap-1">
        <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
          Vendor
        </span>
        <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
          Sales
        </span>
      </div>
    );
  }

  return (
    <span
      className={cn(
        "rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide",
        actor === "vendor"
          ? "bg-amber-500/10 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
          : "bg-blue-500/10 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
      )}
    >
      {actor === "vendor" ? "Vendor" : "Sales"}
    </span>
  );
}

export function StageHint({ currentStage }: { currentStage: Stage }) {
  const hint = STAGE_HINTS[currentStage];
  if (!hint) return null;

  const Icon = hint.icon;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border px-4 py-3.5",
        TONE_STYLES[hint.tone],
      )}
    >
      <Icon
        className={cn(
          "mt-0.5 h-4 w-4 flex-shrink-0",
          TONE_ICON_STYLES[hint.tone],
        )}
      />
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold">{hint.title}</span>
          <ActorBadge actor={hint.actor} />
        </div>
        <p className="text-[13px] leading-snug opacity-90">{hint.body}</p>
      </div>
    </div>
  );
}
