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

// ─── Per-stage hint definitions ───────────────────────────────────────────────

interface StageHintDef {
  icon: React.ElementType;
  title: string;
  body: string;
  /** Who this hint is primarily directed at */
  actor: "vendor" | "sales" | "both";
  /** Visual tone */
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
  "CAD Design": {
    icon: ImageIcon,
    title: "CAD design in progress",
    body: "Vendor: share CAD renders as soon as ready. A customer sign-off on the design is required before casting begins.",
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
  Building: {
    icon: Package,
    title: "In production",
    body: "Vendor: post progress photos at key milestones — casting, stone setting, polishing. Move to Certification once the piece is complete.",
    actor: "vendor",
    tone: "info",
  },
  Certification: {
    icon: FileCheck,
    title: "Awaiting certification",
    body: "Vendor: attach the certification PDF (GIA / IGI / SGL / hallmark) once received and move to Shipped to Store.",
    actor: "vendor",
    tone: "action",
  },
  "Shipped to Store": {
    icon: Truck,
    title: "In transit to store",
    body: "Piece is on its way. Sales: confirm receipt and notify the customer that their order is ready for pickup.",
    actor: "sales",
    tone: "info",
  },
  "Customer Pickup": {
    icon: CheckCircle2,
    title: "Order complete",
    body: "Customer has collected the piece. Remember to collect the balance payment and request a review.",
    actor: "sales",
    tone: "neutral",
  },
};

// ─── Tone styles ──────────────────────────────────────────────────────────────

const TONE_STYLES = {
  neutral:
    "border-border bg-muted/40 text-muted-foreground dark:border-border dark:bg-muted/20",
  action:
    "border-blue-200 bg-blue-50/60 text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/20 dark:text-blue-200",
  info: "border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900/30 dark:text-zinc-300",
};

const TONE_ICON_STYLES = {
  neutral: "text-muted-foreground",
  action: "text-blue-600 dark:text-blue-400",
  info: "text-zinc-500 dark:text-zinc-400",
};

// ─── Actor badge ──────────────────────────────────────────────────────────────

function ActorBadge({ actor }: { actor: StageHintDef["actor"] }) {
  if (actor === "both") {
    return (
      <div className="flex gap-1">
        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-700 dark:bg-amber-950 dark:text-amber-400">
          Vendor
        </span>
        <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-blue-700 dark:bg-blue-950 dark:text-blue-400">
          Sales
        </span>
      </div>
    );
  }
  if (actor === "vendor") {
    return (
      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-700 dark:bg-amber-950 dark:text-amber-400">
        Vendor
      </span>
    );
  }
  return (
    <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-blue-700 dark:bg-blue-950 dark:text-blue-400">
      Sales
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface StageHintProps {
  currentStage: Stage;
}

export function StageHint({ currentStage }: StageHintProps) {
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
      {/* Icon */}
      <Icon
        className={cn(
          "mt-0.5 h-4 w-4 flex-shrink-0",
          TONE_ICON_STYLES[hint.tone],
        )}
      />

      {/* Text */}
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
